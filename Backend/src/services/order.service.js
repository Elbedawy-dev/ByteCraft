const crypto = require('crypto');
const Order = require('../models/Order');
const Project = require('../models/Project');
const Coupon = require('../models/Coupon');
const pricingService = require('./pricing.service');
const settingsService = require('./settings.service');
const emailService = require('./email.service');
const githubService = require('./github.service');
const uploadService = require('./upload.service');
const paymobService = require('./payments/paymob.service');
const { generateOrderNumber } = require('../utils/orderNumber');
const { runWithTransaction } = require('../utils/transaction');
const { validateMagicBytes } = require('../middleware/upload.middleware');
const AppError = require('../utils/AppError');
const { ERROR_CODES } = require('../config/constants');
const env = require('../config/env');

/**
 * Order Service
 * 
 * WHY:
 * 1. Financial Integrity: Computes pricing authoritatively on the server, enforcing tax-free
 *    totals and strict coupon checks.
 * 2. Concurrency & Rollbacks: Atomic coupon `usedCount` increment with automatic rollback
 *    if order creation fails (via MongoDB ACID transaction on replica sets or compensating
 *    rollback on standalone test databases).
 * 3. Guest Privacy & Security: Secret `publicToken` verified with constant-time equality checks.
 * 4. State Machine Validation: Strict enforcement of valid order lifecycle transitions.
 * 5. Automated Fulfillment: `onOrderPaid` handles statistics increment, GitHub repo invitations,
 *    and bilingual customer notifications.
 */

function hashToken(rawToken) {
  if (!rawToken) return '';
  return crypto.createHash('sha256').update(String(rawToken)).digest('hex');
}

class OrderService {
  hashToken(token) {
    return hashToken(token);
  }
  /**
   * Creates a new Order (Guest or Authenticated Checkout)
   */
  async createOrder(data, { userId = null } = {}) {
    const { projectSlug, packageKey, couponCode, paymentMethod, locale = 'ar', customer } = data;

    // 1. Authoritative Pricing Calculation
    const pricing = await pricingService.calculatePricing({
      projectSlug,
      packageKey,
      couponCode,
    });

    const isFreeOrder = pricing.total === 0;

    // 2. Validate Payment Method from Settings (unless order is 100% free)
    const settings = await settingsService.getSettings();
    const rawPm = settings.paymentMethods || {};
    const pmConfig = rawPm[paymentMethod];

    if (!isFreeOrder) {
      if (!pmConfig || !pmConfig.enabled) {
        throw AppError.badRequest(
          `Payment method "${paymentMethod}" is currently disabled.`,
          ERROR_CODES.VALIDATION_ERROR
        );
      }
    }

    // 3. Atomically increment coupon usedCount and create Order within transaction/rollback runner
    let createdOrder = null;

    await runWithTransaction(
      async ({ session }) => {
        // If a coupon was applied, increment usedCount atomically
        if (pricing.couponCode) {
          const couponUpdate = await Coupon.findOneAndUpdate(
            {
              code: pricing.couponCode,
              isActive: true,
              $or: [
                { maxUses: null },
                { $expr: { $lt: ['$usedCount', '$maxUses'] } },
              ],
            },
            { $inc: { usedCount: 1 } },
            { new: true, session }
          );

          if (!couponUpdate) {
            throw AppError.badRequest(
              'Coupon has reached its maximum usage limit or is no longer valid.',
              ERROR_CODES.COUPON_MAX_USES_REACHED
            );
          }
        }

        // Generate atomic sequential order number
        const orderNumber = await generateOrderNumber({ session });

        // Generate cryptographically secure random publicToken (48 hex chars)
        // Store only SHA-256 hash in database; rawToken is returned only once to client/email
        const rawToken = crypto.randomBytes(24).toString('hex');
        const publicTokenHash = hashToken(rawToken);

        // Snapshot project details
        const snapshot = {
          title: pricing.project.title,
          slug: pricing.project.slug,
          packageKey: pricing.package.key,
          packageName: pricing.package.name,
          licenseType: pricing.package.licenseType,
        };

        // Determine initial status & payment state
        let initialStatus = 'pending_payment';
        const initialPayment = {
          provider: (paymentMethod === 'card' || paymentMethod === 'fawry') ? 'paymob' : 'manual',
        };
        const initialStatusHistory = [];

        if (isFreeOrder) {
          initialStatus = 'paid';
          initialPayment.provider = 'manual';
          initialPayment.paidAt = new Date();
          initialStatusHistory.push({
            status: 'paid',
            at: new Date(),
            note: 'Free order via 100% discount coupon (Auto-confirmed)',
          });
        } else {
          initialStatusHistory.push({
            status: 'pending_payment',
            at: new Date(),
            note: 'Order created, awaiting payment',
          });
        }

        // Build Order Document
        const orderDoc = new Order({
          orderNumber,
          publicToken: publicTokenHash,
          locale,
          user: userId || null,
          project: pricing.project.id,
          snapshot,
          customer: {
            fullName: customer.fullName.trim(),
            email: customer.email.trim().toLowerCase(),
            phone: customer.phone.trim(),
            gitProvider: customer.gitProvider,
            gitUsername: customer.gitUsername.trim(),
            organization: customer.organization ? customer.organization.trim() : '',
          },
          pricing: {
            currency: 'EGP',
            subtotal: pricing.subtotal,
            couponCode: pricing.couponCode,
            discount: pricing.discount,
            total: pricing.total,
          },
          paymentMethod,
          status: initialStatus,
          isFreeOrder,
          payment: initialPayment,
          delivery: {
            repoAccess: 'pending',
          },
          statusHistory: initialStatusHistory,
        });

        await orderDoc.save({ session });
        createdOrder = orderDoc;
        // Keep raw publicToken in memory for single initial return
        createdOrder._unmaskedToken = rawToken;
      },
      // Compensating rollback for standalone MongoDB (e.g. local test fallback without replica set)
      async (error) => {
        if (pricing.couponCode) {
          console.log(`🔄 Compensating rollback: Reverting coupon usedCount for ${pricing.couponCode}...`);
          await Coupon.updateOne(
            { code: pricing.couponCode },
            { $inc: { usedCount: -1 } }
          );
        }
      }
    );

    // 4. Construct response & instructions / online payment URLs
    let paymentInstructions = null;
    let paymentUrl = null;
    let fawryReference = null;

    if (createdOrder.status === 'pending_payment') {
      if (paymentMethod === 'vodafone_cash') {
        paymentInstructions = {
          type: 'vodafone_cash',
          destination: pmConfig.walletNumber,
          accountName: pmConfig.accountName,
          instructions: pmConfig.instructions,
        };
      } else if (paymentMethod === 'instapay') {
        paymentInstructions = {
          type: 'instapay',
          destination: pmConfig.ipa,
          accountName: pmConfig.accountName,
          instructions: pmConfig.instructions,
        };
      } else if (paymentMethod === 'card' || paymentMethod === 'fawry') {
        const paymobResult = await paymobService.createPayment(createdOrder);
        createdOrder.payment.provider = 'paymob';
        createdOrder.payment.providerOrderId = paymobResult.providerOrderId;
        if (paymobResult.fawryReference) {
          createdOrder.payment.fawryReference = paymobResult.fawryReference;
          fawryReference = paymobResult.fawryReference;
        }
        if (paymobResult.paymentUrl) {
          paymentUrl = paymobResult.paymentUrl;
        }
        await createdOrder.save();
      }
    }

    // 5. If Free Order, immediately run post-paid fulfillment
    if (isFreeOrder) {
      this.onOrderPaid(createdOrder).catch((err) => {
        console.error('Error during free order fulfillment:', err.message);
      });
    } else {
      // Async customer & owner notifications
      emailService.sendOrderCreatedCustomer(createdOrder, paymentInstructions).catch(console.error);
      emailService.sendOrderCreatedOwner(createdOrder).catch(console.error);
    }

    return {
      orderNumber: createdOrder.orderNumber,
      publicToken: createdOrder._unmaskedToken, // Returned ONLY ONCE here
      pricing: createdOrder.pricing,
      status: createdOrder.status,
      paymentMethod: createdOrder.paymentMethod,
      isFreeOrder: createdOrder.isFreeOrder,
      paymentInstructions,
      paymentUrl,
      fawryReference,
      createdAt: createdOrder.createdAt,
    };
  }

  /**
   * Resolves manual payment instructions while order is pending_payment.
   */
  async _resolvePaymentInstructions(order) {
    if (order.status !== 'pending_payment') return null;

    const settings = await settingsService.getSettings();
    const rawPm = settings.paymentMethods || {};
    const pmConfig = rawPm[order.paymentMethod];
    if (!pmConfig) return null;

    if (order.paymentMethod === 'vodafone_cash') {
      return {
        type: 'vodafone_cash',
        destination: pmConfig.walletNumber,
        accountName: pmConfig.accountName,
        instructions: pmConfig.instructions,
      };
    }

    if (order.paymentMethod === 'instapay') {
      return {
        type: 'instapay',
        destination: pmConfig.ipa,
        accountName: pmConfig.accountName,
        instructions: pmConfig.instructions,
      };
    }

    return null;
  }

  /**
   * Formats safe order detail payload (never exposes publicToken).
   */
  _formatCustomerOrderDetail(order, paymentInstructions, { includeCustomer = false } = {}) {
    const payload = {
      orderNumber: order.orderNumber,
      status: order.status,
      isFreeOrder: order.isFreeOrder,
      pricing: order.pricing,
      snapshot: order.snapshot,
      paymentMethod: order.paymentMethod,
      delivery: {
        repoAccess: order.delivery.repoAccess,
        grantedAt: order.delivery.grantedAt,
      },
      payment: {
        proof: order.payment.proof?.submittedAt
          ? {
              submittedAt: order.payment.proof.submittedAt,
              reference: order.payment.proof.reference,
            }
          : null,
        rejectionReason: order.payment.rejectionReason || null,
        paidAt: order.payment.paidAt || null,
      },
      paymentInstructions,
      createdAt: order.createdAt,
    };

    if (includeCustomer) {
      payload.customer = order.customer;
      payload.fawryReference = order.payment?.fawryReference || null;
      payload.updatedAt = order.updatedAt;
    }

    return payload;
  }

  /**
   * Guest Order Status Retrieval
   */
  async getGuestOrder(orderNumber, token) {
    if (!token) {
      throw AppError.unauthorized('Order access token is required.', ERROR_CODES.UNAUTHORIZED);
    }

    const order = await Order.findOne({ orderNumber }).select('+publicToken');
    if (!order) {
      throw AppError.notFound(`Order "${orderNumber}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    // SHA-256 hash comparison with constant-time equality check
    const hashedProvided = hashToken(token);
    const bufferA = Buffer.from(order.publicToken, 'utf8');
    const bufferB = Buffer.from(hashedProvided, 'utf8');

    if (bufferA.length !== bufferB.length || !crypto.timingSafeEqual(bufferA, bufferB)) {
      throw AppError.unauthorized('Invalid order access token.', ERROR_CODES.UNAUTHORIZED);
    }

    const paymentInstructions = await this._resolvePaymentInstructions(order);
    return this._formatCustomerOrderDetail(order, paymentInstructions, { includeCustomer: false });
  }

  /**
   * Shared manual payment proof submission for a verified order document.
   */
  async _submitProofForOrder(order, { file, reference }) {
    // State machine check: proof can ONLY be submitted when pending_payment or rejected
    if (!['pending_payment', 'rejected'].includes(order.status)) {
      throw AppError.conflict(
        `Cannot submit payment proof for an order with status "${order.status}".`,
        ERROR_CODES.INVALID_STATE
      );
    }

    // Must be a manual payment method
    if (!['vodafone_cash', 'instapay'].includes(order.paymentMethod)) {
      throw AppError.badRequest(
        'Payment proof is only applicable for manual payment methods (Vodafone Cash, InstaPay).',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (!file) {
      throw AppError.badRequest('Receipt proof file is required.', ERROR_CODES.VALIDATION_ERROR);
    }

    // Verify real file magic bytes (real MIME type, not just extension)
    const detectedMime = validateMagicBytes(file.buffer);
    if (!detectedMime) {
      throw AppError.badRequest(
        'Invalid file type. File signature does not match an allowed image (JPEG, PNG, WebP) or PDF document.',
        ERROR_CODES.INVALID_FILE_TYPE
      );
    }

    // Upload receipt image or PDF to Cloudinary (folder 'bytecraft/proofs')
    const uploadRes = await uploadService.uploadImage(file.buffer, 'bytecraft/proofs', file.originalname);

    // Update Order state
    order.status = 'awaiting_review';
    order.payment.proof = {
      url: uploadRes.url,
      publicId: uploadRes.publicId,
      reference: reference ? reference.trim() : '',
      submittedAt: new Date(),
    };
    order.statusHistory.push({
      status: 'awaiting_review',
      at: new Date(),
      note: 'Payment proof submitted by customer',
    });

    await order.save();

    // Notify owner
    emailService.sendProofSubmittedOwner(order).catch(console.error);

    return {
      orderNumber: order.orderNumber,
      status: order.status,
      proof: {
        url: order.payment.proof.url,
        reference: order.payment.proof.reference,
        submittedAt: order.payment.proof.submittedAt,
      },
    };
  }

  /**
   * Guest Payment Proof Submission
   */
  async submitPaymentProof(orderNumber, token, { file, reference }) {
    if (!token) {
      throw AppError.unauthorized('Order access token is required.', ERROR_CODES.UNAUTHORIZED);
    }

    const order = await Order.findOne({ orderNumber }).select('+publicToken');
    if (!order) {
      throw AppError.notFound(`Order "${orderNumber}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    const hashedProvided = hashToken(token);
    const bufferA = Buffer.from(order.publicToken, 'utf8');
    const bufferB = Buffer.from(hashedProvided, 'utf8');
    if (bufferA.length !== bufferB.length || !crypto.timingSafeEqual(bufferA, bufferB)) {
      throw AppError.unauthorized('Invalid order access token.', ERROR_CODES.UNAUTHORIZED);
    }

    return this._submitProofForOrder(order, { file, reference });
  }

  /**
   * Authenticated Customer: List own orders (paginated, status filter)
   */
  async getAccountOrders(userId, { status, page = 1, limit = 10 } = {}) {
    const filter = { user: userId };
    if (status) {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [docs, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Order.countDocuments(filter),
    ]);

    const orders = docs.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      isFreeOrder: o.isFreeOrder,
      pricing: o.pricing,
      snapshot: o.snapshot,
      paymentMethod: o.paymentMethod,
      delivery: {
        repoAccess: o.delivery?.repoAccess || 'pending',
        grantedAt: o.delivery?.grantedAt || null,
      },
      payment: {
        proof: o.payment?.proof?.submittedAt
          ? {
              submittedAt: o.payment.proof.submittedAt,
              reference: o.payment.proof.reference,
            }
          : null,
        rejectionReason: o.payment?.rejectionReason || null,
        paidAt: o.payment?.paidAt || null,
      },
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return {
      orders,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Authenticated Customer: Retrieve single own order without publicToken
   */
  async getAccountOrderByNumber(orderNumber, userId) {
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      throw AppError.notFound(`Order "${orderNumber}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    if (!order.user || String(order.user) !== String(userId)) {
      throw AppError.forbidden('You do not have access to this order.', ERROR_CODES.FORBIDDEN);
    }

    const paymentInstructions = await this._resolvePaymentInstructions(order);
    return this._formatCustomerOrderDetail(order, paymentInstructions, { includeCustomer: true });
  }

  /**
   * Authenticated Customer: Upload payment proof for own order without publicToken
   */
  async submitAccountPaymentProof(orderNumber, userId, { file, reference }) {
    const order = await Order.findOne({ orderNumber });
    if (!order) {
      throw AppError.notFound(`Order "${orderNumber}" not found.`, ERROR_CODES.NOT_FOUND);
    }

    if (!order.user || String(order.user) !== String(userId)) {
      throw AppError.forbidden('You do not have access to this order.', ERROR_CODES.FORBIDDEN);
    }

    return this._submitProofForOrder(order, { file, reference });
  }

  /**
   * Authenticated Customer: Claim unclaimed guest orders matching user's verified email
   */
  async claimGuestOrders(user) {
    if (!user.emailVerified) {
      throw AppError.forbidden(
        'Please verify your email address before claiming guest orders.',
        ERROR_CODES.EMAIL_NOT_VERIFIED
      );
    }

    const result = await Order.updateMany(
      {
        $or: [{ user: null }, { user: { $exists: false } }],
        'customer.email': user.email.toLowerCase(),
      },
      {
        $set: { user: user._id },
      }
    );

    return {
      claimedCount: result.modifiedCount || 0,
    };
  }

  /**
   * Owner: List Orders with Filters & Pagination
   */
  async getOwnerOrders(query = {}) {
    const {
      status,
      paymentMethod,
      search,
      isFreeOrder,
      from,
      to,
      page = 1,
      limit = 20,
    } = query;

    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (isFreeOrder !== undefined) {
      filter.isFreeOrder = isFreeOrder === 'true' || isFreeOrder === true;
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }

    if (search && search.trim() !== '') {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { orderNumber: regex },
        { 'customer.fullName': regex },
        { 'customer.email': regex },
        { 'customer.phone': regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Order.countDocuments(filter),
    ]);

    return {
      orders,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  /**
   * Owner: Get Order Details by ID
   */
  async getOwnerOrderById(id) {
    const order = await Order.findById(id).populate('project', 'title slug packages');
    if (!order) {
      throw AppError.notFound('Order not found.', ERROR_CODES.NOT_FOUND);
    }
    return order;
  }

  /**
   * Owner: Approve Manual Payment
   */
  async approveOrder(id) {
    const order = await Order.findById(id);
    if (!order) {
      throw AppError.notFound('Order not found.', ERROR_CODES.NOT_FOUND);
    }

    // State machine check: can approve from awaiting_review or pending_payment
    if (!['awaiting_review', 'pending_payment'].includes(order.status)) {
      throw AppError.conflict(
        `Cannot approve order with current status "${order.status}".`,
        ERROR_CODES.INVALID_STATE
      );
    }

    order.status = 'paid';
    order.payment.paidAt = new Date();
    order.statusHistory.push({
      status: 'paid',
      at: new Date(),
      note: 'Payment approved by Owner',
    });

    await order.save();

    // Trigger fulfillment (stats, github invitation, confirmation emails)
    await this.onOrderPaid(order);

    return order;
  }

  /**
   * Owner: Reject Manual Payment Proof
   */
  async rejectOrder(id, reason) {
    if (!reason || reason.trim() === '') {
      throw AppError.badRequest('Rejection reason is required.', ERROR_CODES.VALIDATION_ERROR);
    }

    const order = await Order.findById(id);
    if (!order) {
      throw AppError.notFound('Order not found.', ERROR_CODES.NOT_FOUND);
    }

    if (order.status !== 'awaiting_review') {
      throw AppError.conflict(
        `Cannot reject order with status "${order.status}". Only orders awaiting review can be rejected.`,
        ERROR_CODES.INVALID_STATE
      );
    }

    order.status = 'rejected';
    order.payment.rejectionReason = reason.trim();
    order.statusHistory.push({
      status: 'rejected',
      at: new Date(),
      note: `Payment proof rejected: ${reason.trim()}`,
    });

    await order.save();

    // Notify customer
    emailService.sendPaymentRejectedCustomer(order, reason.trim()).catch(console.error);

    return order;
  }

  /**
   * Owner: Update Delivery & Access
   */
  async updateDelivery(id, { repoAccess, notes }) {
    const order = await Order.findById(id);
    if (!order) {
      throw AppError.notFound('Order not found.', ERROR_CODES.NOT_FOUND);
    }

    if (!['paid', 'delivered'].includes(order.status)) {
      throw AppError.conflict(
        `Cannot deliver or update access for an order with status "${order.status}". Order must be paid.`,
        ERROR_CODES.INVALID_STATE
      );
    }

    if (repoAccess) {
      order.delivery.repoAccess = repoAccess;
      if (repoAccess === 'granted') {
        order.delivery.grantedAt = new Date();
        order.delivery.deliveredAt = new Date();
        order.status = 'delivered';
      }
    }

    if (notes !== undefined) {
      order.delivery.notes = notes.trim();
    }

    order.statusHistory.push({
      status: order.status,
      at: new Date(),
      note: `Delivery status updated: repoAccess=${repoAccess || order.delivery.repoAccess}`,
    });

    await order.save();
    return order;
  }

  /**
   * Owner: Mark Order as Refunded
   */
  async refundOrder(id, note) {
    const order = await Order.findById(id);
    if (!order) {
      throw AppError.notFound('Order not found.', ERROR_CODES.NOT_FOUND);
    }

    if (!['paid', 'delivered'].includes(order.status)) {
      throw AppError.conflict(
        `Cannot refund order with status "${order.status}".`,
        ERROR_CODES.INVALID_STATE
      );
    }

    order.status = 'refunded';
    order.statusHistory.push({
      status: 'refunded',
      at: new Date(),
      note: note ? note.trim() : 'Order refunded by Owner',
    });

    await order.save();
    return order;
  }

  /**
   * Order Paid Fulfillment: Stats increment, GitHub collaborator invitation, Customer email
   */
  async onOrderPaid(order) {
    // 1. Atomically increment project purchases counter
    if (order.project) {
      await Project.findByIdAndUpdate(order.project, {
        $inc: { 'stats.purchases': 1 },
      }).catch((err) => console.error('Failed to increment project purchases:', err.message));
    }

    // 2. Automated GitHub Invitation
    if (
      env.AUTO_GITHUB_INVITE &&
      order.customer.gitProvider === 'github' &&
      order.customer.gitUsername
    ) {
      try {
        const project = await Project.findById(order.project).select('+privateRepo');
        if (project?.privateRepo?.owner && project?.privateRepo?.name) {
          const inviteRes = await githubService.inviteCollaborator({
            repoOwner: project.privateRepo.owner,
            repoName: project.privateRepo.name,
            username: order.customer.gitUsername,
          });

          if (inviteRes.success) {
            order.delivery.repoAccess = 'granted';
            order.delivery.grantedAt = new Date();
            order.delivery.deliveredAt = new Date();
            order.status = 'delivered';
            order.statusHistory.push({
              status: 'delivered',
              at: new Date(),
              note: `Automated GitHub invite sent to @${order.customer.gitUsername}`,
            });
          } else {
            order.delivery.repoAccess = 'failed';
            order.delivery.notes = `GitHub invite error: ${inviteRes.error}`;
          }
          await order.save();
        }
      } catch (err) {
        console.error('Error during automatic GitHub invitation:', err.message);
      }
    } else {
      order.delivery.repoAccess = 'manual';
      await order.save();
    }

    // 3. Email notifications
    emailService.sendPaymentApprovedCustomer(order).catch(console.error);
  }

  /**
   * Processes Paymob Webhook (Idempotent & Strict Amount Verification)
   * @param {object} transactionObj - Paymob transaction object from req.body.obj
   */
  async processPaymobWebhook(transactionObj) {
    if (!transactionObj || typeof transactionObj !== 'object') {
      throw AppError.badRequest('Invalid transaction payload.', ERROR_CODES.VALIDATION_ERROR);
    }

    const orderId =
      typeof transactionObj.order === 'object' && transactionObj.order !== null
        ? transactionObj.order.id
        : transactionObj.order;
    const merchantOrderId = transactionObj.order?.merchant_order_id;

    // 1. Locate Order by Paymob providerOrderId or merchant orderNumber
    const order = await Order.findOne({
      $or: [
        { 'payment.providerOrderId': String(orderId) },
        ...(merchantOrderId ? [{ orderNumber: String(merchantOrderId) }] : []),
      ],
    });

    if (!order) {
      throw AppError.notFound(
        `Order matching Paymob order [${orderId}] was not found.`,
        ERROR_CODES.NOT_FOUND
      );
    }

    // 2. Non-payable statuses check: If order is in refunded, cancelled, rejected, paid, or delivered, stay unchanged
    if (['refunded', 'cancelled', 'rejected', 'paid', 'delivered'].includes(order.status)) {
      console.warn(
        `⚠️ [PAYMOB WEBHOOK] Received webhook for non-payable order ${order.orderNumber} with status "${order.status}". Ignoring payment transition.`
      );
      return {
        idempotent: true,
        orderNumber: order.orderNumber,
        status: order.status,
      };
    }

    // 3. Amount & Currency Verification: Never trust client, verify against database authoritative total
    const confirmedAmount = Number(transactionObj.amount_cents);
    const expectedAmount = Number(order.pricing.total);

    if (confirmedAmount !== expectedAmount || transactionObj.currency !== 'EGP') {
      console.error(
        `🚨 [SECURITY ALERT] Paymob amount mismatch on order ${order.orderNumber}: expected ${expectedAmount} EGP (cents), received ${confirmedAmount} ${transactionObj.currency}`
      );
      order.statusHistory.push({
        status: order.status,
        at: new Date(),
        note: `Security alert: Webhook amount mismatch. Expected ${expectedAmount} EGP, received ${confirmedAmount} ${transactionObj.currency}`,
      });
      await order.save();
      throw AppError.badRequest(
        'Paid amount does not match order total in database.',
        ERROR_CODES.PAYMENT_FAILED
      );
    }

    // 4. Handle Transaction Status with strict Paymob verification flags:
    // Requires: success === true, pending === false, is_refunded === false, is_voided === false
    const isLegitimateSuccess =
      transactionObj.success === true &&
      transactionObj.pending === false &&
      transactionObj.is_refunded === false &&
      transactionObj.is_voided === false;

    if (isLegitimateSuccess) {
      const previousStatus = order.status;

      // Atomic update using allow-list: Only pending_payment, awaiting_review, or expired may become paid
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: { $in: ['pending_payment', 'awaiting_review', 'expired'] },
        },
        {
          $set: {
            status: 'paid',
            'payment.paidAt': new Date(),
            'payment.transactionId': String(transactionObj.id),
            'payment.providerTransactionId': String(transactionObj.id),
          },
          $push: {
            statusHistory: {
              status: 'paid',
              at: new Date(),
              note: `Payment confirmed via Paymob webhook (Txn ID: ${transactionObj.id})`,
            },
          },
        },
        { new: true }
      );

      // If null, another concurrent request already marked this order paid atomically or status changed
      if (!updatedOrder) {
        console.log(`ℹ️ [IDEMPOTENT] Paymob webhook for order ${order.orderNumber} already processed or ineligible.`);
        return {
          idempotent: true,
          orderNumber: order.orderNumber,
          status: order.status,
        };
      }

      // If an expired order becomes paid, re-consume its coupon atomically
      if (previousStatus === 'expired' && updatedOrder.pricing?.couponCode) {
        const couponCode = updatedOrder.pricing.couponCode.toUpperCase();
        const coupon = await Coupon.findOne({ code: couponCode });
        let reConsumed = false;

        if (coupon) {
          if (coupon.maxUses != null) {
            // Atomic conditional increment respecting maxUses
            const incResult = await Coupon.findOneAndUpdate(
              {
                code: couponCode,
                usedCount: { $lt: coupon.maxUses },
              },
              { $inc: { usedCount: 1 } },
              { new: true }
            );
            if (incResult) {
              reConsumed = true;
            }
          } else {
            // No limit on coupon usages
            await Coupon.findOneAndUpdate(
              { code: couponCode },
              { $inc: { usedCount: 1 } }
            );
            reConsumed = true;
          }
        }

        if (!reConsumed) {
          // Coupon was exhausted in the interim! Still mark order paid, but note in statusHistory
          await Order.updateOne(
            { _id: updatedOrder._id },
            {
              $push: {
                statusHistory: {
                  status: 'paid',
                  at: new Date(),
                  note: `Notice: Order was paid after expiration, but coupon "${couponCode}" was exhausted in the interim (max uses reached). Order honored.`,
                },
              },
            }
          );
        }
      }

      // Trigger post-paid fulfillment (purchases stats, GitHub invite, emails)
      await this.onOrderPaid(updatedOrder);

      return {
        idempotent: false,
        orderNumber: updatedOrder.orderNumber,
        status: 'paid',
      };
    } else {
      await Order.updateOne(
        { _id: order._id },
        {
          $push: {
            statusHistory: {
              status: order.status,
              at: new Date(),
              note: `Paymob payment attempt unsuccessful or pending (Txn ID: ${transactionObj.id}, success: ${transactionObj.success}, pending: ${transactionObj.pending})`,
            },
          },
        }
      );

      return {
        idempotent: false,
        orderNumber: order.orderNumber,
        status: order.status,
      };
    }
  }

  /**
   * Abandoned Orders Expiry & Coupon Rollback
   * 
   * WHY:
   * Orders stuck in pending_payment reserve a coupon use.
   * This method automatically cancels abandoned orders and atomically
   * decrements coupon usedCount so other customers can use the coupon.
   */
  async expireAbandonedOrders(options = {}) {
    const { cardHours = 24, fawryHours = 48, manualHours = 48 } = options || {};
    const now = new Date();
    const cardCutoff = new Date(now.getTime() - cardHours * 3600 * 1000);
    const fawryCutoff = new Date(now.getTime() - fawryHours * 3600 * 1000);
    const manualCutoff = new Date(now.getTime() - manualHours * 3600 * 1000);

    const query = {
      status: 'pending_payment',
      $or: [
        { paymentMethod: 'card', createdAt: { $lte: cardCutoff } },
        { paymentMethod: 'fawry', createdAt: { $lte: fawryCutoff } },
        { paymentMethod: { $in: ['vodafone_cash', 'instapay'] }, createdAt: { $lte: manualCutoff } },
      ],
    };

    const candidates = await Order.find(query);
    let expiredCount = 0;

    for (const candidate of candidates) {
      const expiredOrder = await Order.findOneAndUpdate(
        { _id: candidate._id, status: 'pending_payment' },
        {
          $set: { status: 'expired' },
          $push: {
            statusHistory: {
              status: 'expired',
              at: new Date(),
              note: `Order automatically marked as expired due to payment abandonment (${candidate.paymentMethod}).`,
            },
          },
        },
        { new: true }
      );

      if (expiredOrder) {
        expiredCount++;
        // If a coupon was used, atomically release its usedCount
        if (expiredOrder.pricing?.couponCode) {
          await Coupon.findOneAndUpdate(
            {
              code: expiredOrder.pricing.couponCode.toUpperCase(),
              usedCount: { $gt: 0 },
            },
            { $inc: { usedCount: -1 } }
          );
        }
      }
    }

    return { expiredCount };
  }
}

module.exports = new OrderService();
