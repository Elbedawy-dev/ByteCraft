const mongoose = require('mongoose');

/**
 * Order Model
 * 
 * WHY:
 * 1. Self-Contained Snapshots: Catalogs and packages can change over time. An order
 *    stores immutable snapshots of project details, package terms, and pricing so historic
 *    orders remain completely accurate forever.
 * 2. Guest Access Security: Customers have no login accounts. Each order is provisioned with
 *    a secret `publicToken` (configured with `select: false`). The guest can only query order status
 *    and upload payment proofs when supplying this token.
 * 3. Audit Trail: `statusHistory` tracks every state transition, timestamp, and optional reason.
 * 4. Free Order Flag: `isFreeOrder: true` and `pricing.couponCode` facilitate auditing zero-total orders.
 */

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    publicToken: {
      type: String,
      required: true,
      select: false, // Critical: Never leaked in regular queries
    },
    locale: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    snapshot: {
      title: {
        ar: { type: String, required: true },
        en: { type: String, required: true },
      },
      slug: { type: String, required: true },
      packageKey: { type: String, required: true },
      packageName: {
        ar: { type: String, required: true },
        en: { type: String, required: true },
      },
      licenseType: {
        type: String,
        enum: ['single', 'multi'],
        required: true,
      },
    },
    customer: {
      fullName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true, index: true },
      phone: { type: String, required: true, trim: true },
      gitProvider: {
        type: String,
        enum: ['github', 'gitlab'],
        required: true,
      },
      gitUsername: { type: String, required: true, trim: true },
      organization: { type: String, trim: true, default: '' },
    },
    pricing: {
      currency: { type: String, default: 'EGP' },
      subtotal: { type: Number, required: true }, // piasters
      couponCode: { type: String, default: null },
      discount: { type: Number, default: 0 }, // piasters
      total: { type: Number, required: true }, // piasters (subtotal - discount)
    },
    paymentMethod: {
      type: String,
      enum: ['vodafone_cash', 'instapay', 'fawry', 'card'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        'pending_payment',
        'awaiting_review',
        'paid',
        'delivered',
        'rejected',
        'cancelled',
        'refunded',
        'expired',
      ],
      default: 'pending_payment',
      index: true,
    },
    isFreeOrder: {
      type: Boolean,
      default: false,
      index: true,
    },
    payment: {
      provider: {
        type: String,
        enum: ['manual', 'paymob'],
        default: 'manual',
      },
      providerOrderId: {
        type: String,
        sparse: true,
      },
      transactionId: {
        type: String,
      },
      providerTransactionId: {
        type: String,
      },
      fawryReference: {
        type: String,
      },
      proof: {
        url: { type: String },
        publicId: { type: String },
        reference: { type: String, trim: true },
        submittedAt: { type: Date },
      },
      rejectionReason: {
        type: String,
        trim: true,
      },
      paidAt: {
        type: Date,
      },
    },
    delivery: {
      repoAccess: {
        type: String,
        enum: ['pending', 'granted', 'failed', 'manual'],
        default: 'pending',
      },
      grantedAt: { type: Date },
      deliveredAt: { type: Date },
      notes: { type: String, trim: true, default: '' },
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        at: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Composite indexes for Owner dashboard and list filters
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paymentMethod: 1, createdAt: -1 });
orderSchema.index({ 'customer.fullName': 'text', 'customer.email': 'text', orderNumber: 'text' });
orderSchema.index({ 'payment.transactionId': 1 }, { unique: true, sparse: true });
orderSchema.index({ 'payment.providerTransactionId': 1 }, { unique: true, sparse: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
