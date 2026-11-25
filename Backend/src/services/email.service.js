const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const env = require('../config/env');
const settingsService = require('./settings.service');
const { piastersToEgp } = require('../utils/money');
const { escapeHtml } = require('../utils/sanitize');

const DEFAULT_SITE_NAME = 'Nexus';

/**
 * Email Service
 *
 * WHY:
 * 1. Dynamic Branding: Reads `siteName` from the singleton Settings document so subjects,
 *    headers, footers, signatures, and the default `MAIL_FROM` display name stay in sync
 *    whenever the owner updates the brand name in Settings.
 * 2. Bilingual Support: Generates modern, clean HTML emails in Arabic (RTL) or English (LTR)
 *    based on the order's `locale`.
 * 3. Non-Blocking Delivery: Email errors are caught and logged so that transactional API requests
 *    (e.g., checkout, approvals) never fail because of transient mail server issues.
 * 4. Graceful Development Mode: If SMTP credentials are not configured, it logs outgoing
 *    email content to the terminal instead of failing.
 */

class EmailService {
  constructor() {
    this.isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);
    if (this.isConfigured) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    } else {
      this.transporter = null;
    }
  }

  /**
   * Resolves the current brand name from Settings (`siteName`), falling back to `Nexus`.
   */
  async getSiteName() {
    if (mongoose.connection.readyState !== 1) {
      return DEFAULT_SITE_NAME;
    }
    try {
      const settings = await settingsService.getSettings();
      const name = typeof settings?.siteName === 'string' ? settings.siteName.trim() : '';
      return name || DEFAULT_SITE_NAME;
    } catch {
      return DEFAULT_SITE_NAME;
    }
  }

  /**
   * Builds the outgoing `From:` header.
   * Uses `siteName` as the default display name when `MAIL_FROM` is unset or a bare email address.
   */
  buildFromAddress(siteName = DEFAULT_SITE_NAME, mailFrom = env.MAIL_FROM, smtpUser = env.SMTP_USER) {
    const cleanDisplayName =
      String(siteName || DEFAULT_SITE_NAME)
        .replace(/["\r\n<>]/g, '')
        .trim() || DEFAULT_SITE_NAME;

    if (mailFrom && String(mailFrom).trim()) {
      const trimmed = String(mailFrom).trim();
      if (!trimmed.includes('<') && !trimmed.includes('>')) {
        return `"${cleanDisplayName}" <${trimmed}>`;
      }
      return trimmed;
    }

    return `"${cleanDisplayName}" <${smtpUser || ''}>`;
  }

  /**
   * Resolves primary frontend URL from CLIENT_URL for action links in emails.
   */
  buildFrontendUrl(pathWithQuery = '/') {
    const firstOrigin = String(env.CLIENT_URL || 'http://localhost:5173')
      .split(',')[0]
      .trim()
      .replace(/\/+$/, '');
    const normalizedPath = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
    return `${firstOrigin}${normalizedPath}`;
  }

  async sendMail({ to, subject, html, text, siteName }) {
    if (!to) return;

    const resolvedSiteName = (siteName && String(siteName).trim()) || (await this.getSiteName());
    const from = this.buildFromAddress(resolvedSiteName);

    if (!this.isConfigured || !this.transporter) {
      // Only log simulated email contents (including links/tokens) in development/test — never in production
      if (env.NODE_ENV !== 'production') {
        console.log(`\n📨 [EMAIL SIMULATION]`);
        console.log(`   From: ${from}`);
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Content: ${text || (html ? html.substring(0, 200) + '...' : '')}\n`);
      }
      return;
    }

    try {
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
        text,
      });
      console.log(`✅ Email sent successfully to ${to} (${subject})`);
    } catch (error) {
      console.error(`⚠️ Failed to send email to ${to}: ${error.message}`);
    }
  }

  // 1. Order Received Notification (to Customer)
  buildOrderCreatedCustomerEmail(order, paymentInstructions = null, siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const safeBrand = escapeHtml(brand);
    const isAr = order.locale === 'ar';
    const amountEgp = piastersToEgp(order.pricing.total, true);
    const safeCustomerName = escapeHtml(order.customer?.fullName || '');
    const safeOrderNumber = escapeHtml(order.orderNumber || '');
    const rawProjectTitle = order.snapshot?.title?.[order.locale] || order.snapshot?.title?.en || '';
    const safeProjectTitle = escapeHtml(rawProjectTitle);

    const subject = isAr
      ? `تم استلام طلبك بنجاح #${order.orderNumber} - ${brand}`
      : `Order Received #${order.orderNumber} - ${brand}`;

    let instructionsHtml = '';
    if (order.status === 'paid' || order.isFreeOrder) {
      instructionsHtml = isAr
        ? `<p style="color: #10b981; font-weight: bold;">طلبك مجاني وتم تفعيله بنجاح! سيتم إتاحة وصول الكود المصدري لك فوراً.</p>`
        : `<p style="color: #10b981; font-weight: bold;">Your order is free and confirmed! Source code access is being provisioned.</p>`;
    } else if (paymentInstructions) {
      const safeDestination = escapeHtml(paymentInstructions.destination || '');
      const safeAccountName = escapeHtml(paymentInstructions.accountName || '');
      const safeInstr = escapeHtml(
        isAr ? paymentInstructions.instructions?.ar || '' : paymentInstructions.instructions?.en || ''
      );
      instructionsHtml = `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 10px 0;">${isAr ? 'بيانات التحويل المطلوبة' : 'Payment Details'}</h4>
          <p><strong>${isAr ? 'المبلغ المطلوب' : 'Amount Due'}:</strong> ${amountEgp} EGP</p>
          <p><strong>${isAr ? 'الوجهة' : 'Destination'}:</strong> ${safeDestination} (${safeAccountName})</p>
          <p style="white-space: pre-line;">${safeInstr}</p>
        </div>
      `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <p style="font-size: 13px; font-weight: bold; color: #6366f1; margin: 0 0 8px 0;">${safeBrand}</p>
        <h2 style="color: #0f172a; margin-top: 0;">${isAr ? 'مرحباً' : 'Hello'} ${safeCustomerName}${isAr ? '،' : ','}</h2>
        <p>${
          isAr
            ? `شكراً لاختيارك ${safeBrand}. تم استلام طلبك لشراء <strong>${safeProjectTitle}</strong>.`
            : `Thank you for choosing ${safeBrand}. We have received your order for <strong>${safeProjectTitle}</strong>.`
        }</p>
        <p><strong>${isAr ? 'رقم الطلب' : 'Order Number'}:</strong> ${safeOrderNumber}</p>
        ${instructionsHtml}
        <p>${isAr ? 'يمكنك متابعة حالة طلبك أو رفع إيصال الدفع في أي وقت عبر الموقع.' : 'You can track your order status and upload payment proof at any time on our website.'}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">${safeBrand}</p>
      </div>
    `;

    const text = `${subject} - Order: ${order.orderNumber}`;
    return { subject, html, text };
  }

  async sendOrderCreatedCustomer(order, paymentInstructions = null) {
    const siteName = await this.getSiteName();
    const { subject, html, text } = this.buildOrderCreatedCustomerEmail(order, paymentInstructions, siteName);

    await this.sendMail({
      to: order.customer.email,
      subject,
      html,
      text,
      siteName,
    });
  }

  // 2. New Order Notification (to Owner)
  buildOrderCreatedOwnerEmail(order, siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const safeBrand = escapeHtml(brand);
    const amountEgp = piastersToEgp(order.pricing.total, true);
    const subject = `🔔 [${brand}] New Order Received #${order.orderNumber} (${amountEgp} EGP)`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <p style="font-size: 13px; font-weight: bold; color: #6366f1; margin: 0 0 8px 0;">${safeBrand}</p>
        <h2 style="margin-top: 0;">New Order Created — ${safeBrand}</h2>
        <p><strong>Order Number:</strong> ${escapeHtml(order.orderNumber)}</p>
        <p><strong>Project:</strong> ${escapeHtml(order.snapshot?.title?.en || '')} (${escapeHtml(order.snapshot?.packageKey || '')})</p>
        <p><strong>Customer:</strong> ${escapeHtml(order.customer?.fullName || '')} (${escapeHtml(order.customer?.email || '')}, ${escapeHtml(order.customer?.phone || '')})</p>
        <p><strong>Git:</strong> ${escapeHtml(order.customer?.gitProvider || '')} / @${escapeHtml(order.customer?.gitUsername || '')}</p>
        <p><strong>Total:</strong> ${amountEgp} EGP ${order.isFreeOrder ? '(FREE ORDER)' : ''}</p>
        <p><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod || '')}</p>
        <p><strong>Status:</strong> ${escapeHtml(order.status || '')}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">${safeBrand}</p>
      </div>
    `;

    return { subject, html, text: subject };
  }

  async sendOrderCreatedOwner(order) {
    const ownerEmail = env.OWNER_NOTIFY_EMAIL || env.OWNER_EMAIL;
    if (!ownerEmail) return;

    const siteName = await this.getSiteName();
    const { subject, html, text } = this.buildOrderCreatedOwnerEmail(order, siteName);

    await this.sendMail({
      to: ownerEmail,
      subject,
      html,
      text,
      siteName,
    });
  }

  // 3. Payment Proof Submitted (to Owner)
  buildProofSubmittedOwnerEmail(order, siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const safeBrand = escapeHtml(brand);
    const subject = `🧾 [${brand}] Payment Proof Submitted for #${order.orderNumber}`;
    const rawProofUrl = order.payment?.proof?.url || '';
    const isSafeHref = /^(https?:\/\/|\/)/i.test(rawProofUrl);
    const proofLinkHtml =
      rawProofUrl && isSafeHref
        ? `<p><a href="${escapeHtml(rawProofUrl)}" target="_blank" rel="noopener noreferrer">View Receipt Image</a></p>`
        : '';

    const html = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <p style="font-size: 13px; font-weight: bold; color: #6366f1; margin: 0 0 8px 0;">${safeBrand}</p>
        <h2 style="margin-top: 0;">Payment Proof Submitted for Review — ${safeBrand}</h2>
        <p><strong>Order Number:</strong> ${escapeHtml(order.orderNumber)}</p>
        <p><strong>Customer:</strong> ${escapeHtml(order.customer?.fullName || '')} (${escapeHtml(order.customer?.email || '')})</p>
        <p><strong>Reference / Notes:</strong> ${escapeHtml(order.payment?.proof?.reference || 'N/A')}</p>
        ${proofLinkHtml}
        <p>Please review and approve or reject this payment in your Owner dashboard.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">${safeBrand}</p>
      </div>
    `;

    return { subject, html, text: subject };
  }

  async sendProofSubmittedOwner(order) {
    const ownerEmail = env.OWNER_NOTIFY_EMAIL || env.OWNER_EMAIL;
    if (!ownerEmail) return;

    const siteName = await this.getSiteName();
    const { subject, html, text } = this.buildProofSubmittedOwnerEmail(order, siteName);

    await this.sendMail({
      to: ownerEmail,
      subject,
      html,
      text,
      siteName,
    });
  }

  // 4. Payment Approved / Confirmed (to Customer)
  buildPaymentApprovedCustomerEmail(order, siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const safeBrand = escapeHtml(brand);
    const isAr = order.locale === 'ar';
    const safeCustomerName = escapeHtml(order.customer?.fullName || '');
    const safeOrderNumber = escapeHtml(order.orderNumber || '');
    const safeGitUser = escapeHtml(order.customer?.gitUsername || '');
    const safeGitProvider = escapeHtml(order.customer?.gitProvider || '');

    const subject = isAr
      ? `تم تأكيد الدفع لطلبك #${order.orderNumber} - ${brand}`
      : `Payment Confirmed for Order #${order.orderNumber} - ${brand}`;

    const html = `
      <div style="font-family: Arial, sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <p style="font-size: 13px; font-weight: bold; color: #6366f1; margin: 0 0 8px 0;">${safeBrand}</p>
        <h2 style="color: #10b981; margin-top: 0;">${isAr ? 'تم تأكيد عملية الدفع بنجاح!' : 'Payment Confirmed Successfully!'}</h2>
        <p>${
          isAr
            ? `مرحباً ${safeCustomerName}، يسعدنا إبلاغك بأنه تم تأكيد استلام دفعتك للطلب <strong>#${safeOrderNumber}</strong>.`
            : `Hello ${safeCustomerName}, we are pleased to confirm your payment for order <strong>#${safeOrderNumber}</strong>.`
        }</p>
        <p>${isAr ? 'جاري تجهيز ومنح صلاحيات المستودع البرمجي (Git Repository) لحسابك.' : 'Source code repository access is being granted to your Git account.'}</p>
        <p><strong>${isAr ? 'حساب Git المُسجل' : 'Registered Git Username'}:</strong> ${safeGitUser} (${safeGitProvider})</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">${safeBrand}</p>
      </div>
    `;

    return { subject, html, text: subject };
  }

  async sendPaymentApprovedCustomer(order) {
    const siteName = await this.getSiteName();
    const { subject, html, text } = this.buildPaymentApprovedCustomerEmail(order, siteName);

    await this.sendMail({
      to: order.customer.email,
      subject,
      html,
      text,
      siteName,
    });
  }

  // 5. Payment Rejected (to Customer)
  buildPaymentRejectedCustomerEmail(order, reason, siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const safeBrand = escapeHtml(brand);
    const isAr = order.locale === 'ar';
    const safeCustomerName = escapeHtml(order.customer?.fullName || '');
    const safeOrderNumber = escapeHtml(order.orderNumber || '');
    const safeReason = escapeHtml(
      reason || (isAr ? 'بيانات التحويل غير مطابقة' : 'Transaction details did not match')
    );

    const subject = isAr
      ? `تحديث بخصوص إيصال الدفع للطلب #${order.orderNumber} - ${brand}`
      : `Payment Proof Update for Order #${order.orderNumber} - ${brand}`;

    const html = `
      <div style="font-family: Arial, sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <p style="font-size: 13px; font-weight: bold; color: #6366f1; margin: 0 0 8px 0;">${safeBrand}</p>
        <h2 style="color: #ef4444; margin-top: 0;">${isAr ? 'تعذر تأكيد إيصال الدفع' : 'Payment Proof Not Verified'}</h2>
        <p>${
          isAr
            ? `مرحباً ${safeCustomerName}، نود إعلامك بأن إيصال الدفع المُرسل للطلب <strong>#${safeOrderNumber}</strong> لم يتم اعتماده للأسباب التالية:`
            : `Hello ${safeCustomerName}, the payment proof submitted for order <strong>#${safeOrderNumber}</strong> could not be verified for the following reason:`
        }</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 6px; margin: 15px 0;">
          <strong>${isAr ? 'سبب الرفض' : 'Reason'}:</strong> ${safeReason}
        </div>
        <p>${isAr ? 'يمكنك الدخول لرابط طلبك وإعادة رفع الإيصال الصحيح أو التواصل معنا مباشرة.' : 'You can visit your order page to re-upload the correct proof or contact us directly.'}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">${safeBrand}</p>
      </div>
    `;

    return { subject, html, text: `${subject}: ${reason || ''}` };
  }

  async sendPaymentRejectedCustomer(order, reason) {
    const siteName = await this.getSiteName();
    const { subject, html, text } = this.buildPaymentRejectedCustomerEmail(order, reason, siteName);

    await this.sendMail({
      to: order.customer.email,
      subject,
      html,
      text,
      siteName,
    });
  }

  // Helper: Build HTML-escaped Owner Inquiry notification payload
  buildInquiryOwnerEmail(inquiry, siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const safeBrand = escapeHtml(brand);

    const projectTypeLabels = {
      lms: 'LMS Platform (lms)',
      ecommerce: 'E-Commerce Store (ecommerce)',
      custom_mern: 'Custom MERN Web App (custom_mern)',
      consulting: 'Technical Consulting (consulting)',
      other: 'Other (other)',
    };
    const budgetRangeLabels = {
      '5k_10k': '5,000 - 10,000 EGP (5k_10k)',
      '10k_20k': '10,000 - 20,000 EGP (10k_20k)',
      '20k_plus': '20,000+ EGP (20k_plus)',
      undecided: 'Undecided (undecided)',
    };
    const timelineLabels = {
      urgent: 'Urgent (urgent)',
      standard: 'Standard (standard)',
      flexible: 'Flexible (flexible)',
    };

    const subject = `📩 [${brand}] New Inquiry from ${inquiry.name}: ${inquiry.subject}`;

    // Strictly escape ALL user-controlled values to prevent HTML/XSS injection in owner emails
    const safeName = escapeHtml(inquiry.name);
    const safeEmail = escapeHtml(inquiry.email);
    const safePhone = escapeHtml(inquiry.phone || 'Not provided');
    const safeLocale = escapeHtml(inquiry.locale || 'ar');
    const safeProjectType = escapeHtml(projectTypeLabels[inquiry.projectType] || inquiry.projectType || 'other');
    const safeBudgetRange = escapeHtml(budgetRangeLabels[inquiry.budgetRange] || inquiry.budgetRange || 'undecided');
    const safeTimeline = escapeHtml(timelineLabels[inquiry.timeline] || inquiry.timeline || 'standard');
    const safeSubject = escapeHtml(inquiry.subject);
    const safeMessage = escapeHtml(inquiry.message).replace(/\n/g, '<br />');

    const attachments = Array.isArray(inquiry.attachments) ? inquiry.attachments : [];
    let attachmentsHtml = '';
    if (attachments.length > 0) {
      const itemsHtml = attachments
        .map((att) => {
          const safeFilename = escapeHtml(att.originalName || 'Attachment');
          const safeMime = escapeHtml(att.mimeType || 'file');
          const sizeKb = att.size ? `${Math.max(1, Math.round(att.size / 1024))} KB` : '';
          const rawUrl = typeof att.url === 'string' ? att.url : '';
          const isSafeHref = /^(https?:\/\/|\/)/i.test(rawUrl);
          const safeUrl = escapeHtml(rawUrl);
          const linkHtml = isSafeHref
            ? `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeFilename}</a>`
            : safeFilename;
          return `<li>${linkHtml} (${safeMime}${sizeKb ? `, ${sizeKb}` : ''})</li>`;
        })
        .join('');

      attachmentsHtml = `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0;">
          <strong>Attachments (${attachments.length}):</strong>
          <ul style="margin: 8px 0 0 18px; padding: 0;">${itemsHtml}</ul>
        </div>
      `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; direction: ltr; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <p style="font-size: 13px; font-weight: bold; color: #6366f1; margin: 0 0 8px 0;">${safeBrand}</p>
        <h2 style="color: #6366f1; margin-top: 0;">New Customer Inquiry Received — ${safeBrand}</h2>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0;">
          <p><strong>From:</strong> ${safeName} (&lt;<a href="mailto:${safeEmail}">${safeEmail}</a>&gt;)</p>
          <p><strong>Phone / WhatsApp:</strong> ${safePhone}</p>
          <p><strong>Project Type:</strong> ${safeProjectType}</p>
          <p><strong>Estimated Budget:</strong> ${safeBudgetRange}</p>
          <p><strong>Timeline:</strong> ${safeTimeline}</p>
          <p><strong>Locale:</strong> ${safeLocale}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin: 15px 0;">
          <strong>Details / Message:</strong>
          <p style="margin-top: 8px; line-height: 1.6;">${safeMessage}</p>
        </div>
        ${attachmentsHtml}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">${safeBrand} Lead Notification</p>
      </div>
    `;

    const attachmentsText =
      attachments.length > 0
        ? `\nAttachments (${attachments.length}):\n` +
          attachments.map((a) => `- ${a.originalName || 'Attachment'}: ${a.url}`).join('\n')
        : '';

    const text = [
      `[${brand}] New Inquiry from ${inquiry.name} (${inquiry.email})`,
      `Phone: ${inquiry.phone || 'Not provided'}`,
      `Project Type: ${inquiry.projectType || 'other'}`,
      `Budget Range: ${inquiry.budgetRange || 'undecided'}`,
      `Timeline: ${inquiry.timeline || 'standard'}`,
      `Subject: ${inquiry.subject}`,
      '',
      inquiry.message,
      attachmentsText,
    ].join('\n');

    return { subject, html, text };
  }

  // 6. New Customer Inquiry (to Owner)
  async sendInquiryOwner(inquiry) {
    const to = env.OWNER_NOTIFY_EMAIL || env.OWNER_EMAIL;
    if (!to) return;

    const siteName = await this.getSiteName();
    const { subject, html, text } = this.buildInquiryOwnerEmail(inquiry, siteName);

    await this.sendMail({
      to,
      subject,
      html,
      text,
      siteName,
    });
  }

  // Shared helper for user-account bilingual email layout
  _wrapAuthEmailLayout({ brand, isAr, title, bodyHtml }) {
    const safeBrand = escapeHtml(brand);
    return `
      <div style="font-family: Arial, sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; color: #1e293b; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <p style="font-size: 13px; font-weight: bold; color: #6366f1; margin: 0 0 8px 0;">${safeBrand}</p>
        <h2 style="color: #0f172a; margin-top: 0;">${title}</h2>
        ${bodyHtml}
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 12px 0;" />
        <p style="font-size: 12px; color: #64748b; margin: 0;">${safeBrand}</p>
      </div>
    `;
  }

  _buildActionButtonHtml(url, label) {
    const safeUrl = /^(https?:\/\/|\/)/i.test(String(url || '')) ? escapeHtml(url) : '#';
    return `
      <p style="margin: 22px 0;">
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 22px; border-radius: 6px;">${escapeHtml(label)}</a>
      </p>
      <p style="font-size: 12px; color: #64748b; word-break: break-all;">${safeUrl}</p>
    `;
  }

  // 7. Email Verification (verify-email)
  buildVerifyEmailEmail(user, verifyUrl, siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const isAr = user?.locale !== 'en';
    const safeName = escapeHtml(user?.name || '');

    const subject = isAr
      ? `تأكيد بريدك الإلكتروني - ${brand}`
      : `Verify your email address - ${brand}`;

    const bodyHtml = isAr
      ? `
        <p>مرحباً ${safeName}،</p>
        <p>شكراً لتسجيلك في ${escapeHtml(brand)}. يرجى الضغط على الزر التالي لتأكيد بريدك الإلكتروني:</p>
        ${this._buildActionButtonHtml(verifyUrl, 'تأكيد البريد الإلكتروني')}
        <p style="font-size: 13px; color: #475569;">ينتهي هذا الرابط خلال 24 ساعة. إذا لم تقم بإنشاء هذا الحساب، يمكنك تجاهل هذه الرسالة.</p>
      `
      : `
        <p>Hello ${safeName},</p>
        <p>Thank you for registering with ${escapeHtml(brand)}. Please click the button below to verify your email address:</p>
        ${this._buildActionButtonHtml(verifyUrl, 'Verify Email Address')}
        <p style="font-size: 13px; color: #475569;">This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      `;

    const html = this._wrapAuthEmailLayout({
      brand,
      isAr,
      title: isAr ? 'تأكيد البريد الإلكتروني' : 'Verify Your Email',
      bodyHtml,
    });

    const text = isAr
      ? `مرحباً ${user?.name || ''}، يرجى تأكيد بريدك الإلكتروني عبر الرابط: ${verifyUrl}`
      : `Hello ${user?.name || ''}, please verify your email address using this link: ${verifyUrl}`;

    return { subject, html, text };
  }

  async sendVerifyEmail(user, rawToken) {
    const siteName = await this.getSiteName();
    const verifyUrl = this.buildFrontendUrl(`/verify-email?token=${encodeURIComponent(rawToken)}`);
    const { subject, html, text } = this.buildVerifyEmailEmail(user, verifyUrl, siteName);

    await this.sendMail({
      to: user.email,
      subject,
      html,
      text,
      siteName,
    });
  }

  // 8. Password Reset (reset-password)
  buildResetPasswordEmail(user, resetUrl, siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const isAr = user?.locale !== 'en';
    const safeName = escapeHtml(user?.name || '');

    const subject = isAr
      ? `إعادة تعيين كلمة المرور - ${brand}`
      : `Reset your password - ${brand}`;

    const bodyHtml = isAr
      ? `
        <p>مرحباً ${safeName}،</p>
        <p>تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في ${escapeHtml(brand)}. اضغط على الزر التالي لاختيار كلمة مرور جديدة:</p>
        ${this._buildActionButtonHtml(resetUrl, 'إعادة تعيين كلمة المرور')}
        <p style="font-size: 13px; color: #475569;">ينتهي هذا الرابط خلال ساعة واحدة (1 ساعة) ويُستخدم لمرة واحدة فقط. إذا لم تطلب ذلك، تجاهل هذه الرسالة بأمان.</p>
      `
      : `
        <p>Hello ${safeName},</p>
        <p>We received a request to reset the password for your ${escapeHtml(brand)} account. Click the button below to choose a new password:</p>
        ${this._buildActionButtonHtml(resetUrl, 'Reset Password')}
        <p style="font-size: 13px; color: #475569;">This single-use link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
      `;

    const html = this._wrapAuthEmailLayout({
      brand,
      isAr,
      title: isAr ? 'إعادة تعيين كلمة المرور' : 'Password Reset Request',
      bodyHtml,
    });

    const text = isAr
      ? `مرحباً ${user?.name || ''}، لإعادة تعيين كلمة المرور افتح الرابط (صالح لساعة واحدة): ${resetUrl}`
      : `Hello ${user?.name || ''}, reset your password using this single-use link (valid for 1 hour): ${resetUrl}`;

    return { subject, html, text };
  }

  async sendResetPassword(user, rawToken) {
    const siteName = await this.getSiteName();
    const resetUrl = this.buildFrontendUrl(`/reset-password?token=${encodeURIComponent(rawToken)}`);
    const { subject, html, text } = this.buildResetPasswordEmail(user, resetUrl, siteName);

    await this.sendMail({
      to: user.email,
      subject,
      html,
      text,
      siteName,
    });
  }

  // 9. Admin Invite (admin-invite: one-time "set your password" link)
  buildAdminInviteEmail(user, inviteUrl, invitedByName = '', siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const isAr = user?.locale !== 'en';
    const safeName = escapeHtml(user?.name || '');
    const safeInviter = escapeHtml(invitedByName || '');

    const subject = isAr
      ? `دعوة لإدارة منصة ${brand} — تعيين كلمة المرور`
      : `You're invited as an Admin on ${brand} — Set your password`;

    const inviterLineAr = safeInviter ? ` قام <strong>${safeInviter}</strong> بدعوتك` : ' تمت دعوتك';
    const inviterLineEn = safeInviter ? `<strong>${safeInviter}</strong> invited you` : 'You have been invited';

    const bodyHtml = isAr
      ? `
        <p>مرحباً ${safeName}،</p>
        <p>${inviterLineAr} للانضمام كمسؤول (Admin) في لوحة تحكم ${escapeHtml(brand)}.</p>
        <p>اضغط على الزر التالي لتعيين كلمة المرور الخاصة بك وتفعيل الدخول:</p>
        ${this._buildActionButtonHtml(inviteUrl, 'تعيين كلمة المرور')}
        <p style="font-size: 13px; color: #475569;">هذا الرابط صالح لمرة واحدة فقط وينتهي خلال 24 ساعة.</p>
      `
      : `
        <p>Hello ${safeName},</p>
        <p>${inviterLineEn} to join ${escapeHtml(brand)} as an administrator.</p>
        <p>Click the button below to set your password and activate your access:</p>
        ${this._buildActionButtonHtml(inviteUrl, 'Set Your Password')}
        <p style="font-size: 13px; color: #475569;">This one-time setup link expires in 24 hours.</p>
      `;

    const html = this._wrapAuthEmailLayout({
      brand,
      isAr,
      title: isAr ? 'دعوة حساب مسؤول' : 'Administrator Invitation',
      bodyHtml,
    });

    const text = isAr
      ? `مرحباً ${user?.name || ''}، تمت دعوتك كمسؤول في ${brand}. عيّن كلمة المرور عبر الرابط: ${inviteUrl}`
      : `Hello ${user?.name || ''}, you have been invited as an admin on ${brand}. Set your password here: ${inviteUrl}`;

    return { subject, html, text };
  }

  async sendAdminInvite(user, rawToken, invitedByName = '') {
    const siteName = await this.getSiteName();
    const inviteUrl = this.buildFrontendUrl(`/reset-password?token=${encodeURIComponent(rawToken)}`);
    const { subject, html, text } = this.buildAdminInviteEmail(user, inviteUrl, invitedByName, siteName);

    await this.sendMail({
      to: user.email,
      subject,
      html,
      text,
      siteName,
    });
  }

  // 10. Password Changed Notice (password-changed)
  buildPasswordChangedEmail(user, siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const isAr = user?.locale !== 'en';
    const safeName = escapeHtml(user?.name || '');

    const subject = isAr
      ? `تنبيه أمني: تم تغيير كلمة المرور - ${brand}`
      : `Security Notice: Your password was changed - ${brand}`;

    const bodyHtml = isAr
      ? `
        <p>مرحباً ${safeName}،</p>
        <p>نود إعلامك بأنه تم تغيير كلمة المرور لحسابك في ${escapeHtml(brand)} بنجاح.</p>
        <p style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 12px; border-radius: 6px;">
          إذا لم تقم بهذا التغيير، يرجى إعادة تعيين كلمة المرور فوراً والتواصل معنا لحماية حسابك.
        </p>
      `
      : `
        <p>Hello ${safeName},</p>
        <p>This is a confirmation that the password for your ${escapeHtml(brand)} account was recently changed.</p>
        <p style="background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 12px; border-radius: 6px;">
          If you did not make this change, please reset your password immediately and contact support.
        </p>
      `;

    const html = this._wrapAuthEmailLayout({
      brand,
      isAr,
      title: isAr ? 'تم تغيير كلمة المرور' : 'Password Changed',
      bodyHtml,
    });

    const text = isAr
      ? `مرحباً ${user?.name || ''}، تم تغيير كلمة المرور لحسابك في ${brand}. إذا لم تقم بذلك تواصل معنا فوراً.`
      : `Hello ${user?.name || ''}, your ${brand} account password was changed. If this wasn't you, reset it immediately.`;

    return { subject, html, text };
  }

  async sendPasswordChanged(user) {
    const siteName = await this.getSiteName();
    const { subject, html, text } = this.buildPasswordChangedEmail(user, siteName);

    await this.sendMail({
      to: user.email,
      subject,
      html,
      text,
      siteName,
    });
  }

  // 11. Welcome Email (welcome)
  buildWelcomeEmail(user, siteName = DEFAULT_SITE_NAME) {
    const brand = String(siteName || DEFAULT_SITE_NAME).trim() || DEFAULT_SITE_NAME;
    const isAr = user?.locale !== 'en';
    const safeName = escapeHtml(user?.name || '');
    const catalogUrl = this.buildFrontendUrl('/');

    const subject = isAr
      ? `أهلاً بك في ${brand}!`
      : `Welcome to ${brand}!`;

    const bodyHtml = isAr
      ? `
        <p>مرحباً ${safeName}،</p>
        <p>تم تأكيد بريدك الإلكتروني بنجاح! يسعدنا انضمامك إلى ${escapeHtml(brand)}.</p>
        <p>يمكنك الآن تصفح المشاريع الجاهزة، تتبع طلباتك، وربط طلباتك السابقة بحسابك بسهولة.</p>
        ${this._buildActionButtonHtml(catalogUrl, 'استكشف المشاريع')}
      `
      : `
        <p>Hello ${safeName},</p>
        <p>Your email is now verified! Welcome to ${escapeHtml(brand)}.</p>
        <p>You can now browse production-ready templates, track your orders, and manage your purchases from your account.</p>
        ${this._buildActionButtonHtml(catalogUrl, 'Explore Catalog')}
      `;

    const html = this._wrapAuthEmailLayout({
      brand,
      isAr,
      title: isAr ? `أهلاً بك في ${escapeHtml(brand)}` : `Welcome to ${escapeHtml(brand)}`,
      bodyHtml,
    });

    const text = isAr
      ? `مرحباً ${user?.name || ''}، أهلاً بك في ${brand}! يمكنك تصفح المشاريع عبر: ${catalogUrl}`
      : `Hello ${user?.name || ''}, welcome to ${brand}! Explore our catalog at: ${catalogUrl}`;

    return { subject, html, text };
  }

  async sendWelcome(user) {
    const siteName = await this.getSiteName();
    const { subject, html, text } = this.buildWelcomeEmail(user, siteName);

    await this.sendMail({
      to: user.email,
      subject,
      html,
      text,
      siteName,
    });
  }
}

module.exports = new EmailService();
