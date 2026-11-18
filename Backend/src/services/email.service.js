const nodemailer = require('nodemailer');
const env = require('../config/env');
const { piastersToEgp } = require('../utils/money');
const { escapeHtml } = require('../utils/sanitize');

/**
 * Email Service
 * 
 * WHY:
 * 1. Bilingual Support: Generates modern, clean HTML emails in Arabic (RTL) or English (LTR)
 *    based on the order's `locale`.
 * 2. Non-Blocking Delivery: Email errors are caught and logged so that transactional API requests
 *    (e.g., checkout, approvals) never fail because of transient mail server issues.
 * 3. Graceful Development Mode: If SMTP credentials are not configured, it logs outgoing
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

  async sendMail({ to, subject, html, text }) {
    if (!to) return;

    if (!this.isConfigured || !this.transporter) {
      if (env.NODE_ENV !== 'production') {
        console.log(`\n📨 [EMAIL SIMULATION]`);
        console.log(`   To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Content Preview: ${text || (html ? html.substring(0, 150) + '...' : '')}\n`);
      }
      return;
    }

    try {
      await this.transporter.sendMail({
        from: env.MAIL_FROM || `"ByteCraft" <${env.SMTP_USER}>`,
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
  async sendOrderCreatedCustomer(order, paymentInstructions = null) {
    const isAr = order.locale === 'ar';
    const amountEgp = piastersToEgp(order.pricing.total, true);

    const subject = isAr
      ? `تم استلام طلبك بنجاح #${order.orderNumber} - بايت كرافت`
      : `Order Received #${order.orderNumber} - ByteCraft`;

    let instructionsHtml = '';
    if (order.status === 'paid' || order.isFreeOrder) {
      instructionsHtml = isAr
        ? `<p style="color: #10b981; font-weight: bold;">طلبك مجاني وتم تفعيله بنجاح! سيتم إتاحة وصول الكود المصدري لك فوراً.</p>`
        : `<p style="color: #10b981; font-weight: bold;">Your order is free and confirmed! Source code access is being provisioned.</p>`;
    } else if (paymentInstructions) {
      instructionsHtml = `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
          <h4 style="margin: 0 0 10px 0;">${isAr ? 'بيانات التحويل المطلوبة' : 'Payment Details'}</h4>
          <p><strong>${isAr ? 'المبلغ المطلوب' : 'Amount Due'}:</strong> ${amountEgp} EGP</p>
          <p><strong>${isAr ? 'الوجهة' : 'Destination'}:</strong> ${paymentInstructions.destination || ''} (${paymentInstructions.accountName || ''})</p>
          <p style="white-space: pre-line;">${isAr ? paymentInstructions.instructions?.ar || '' : paymentInstructions.instructions?.en || ''}</p>
        </div>
      `;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #0f172a;">${isAr ? 'مرحباً' : 'Hello'} ${order.customer.fullName}،</h2>
        <p>${isAr ? `شكراً لاختيارك بايت كرافت. تم استلام طلبك لشراء <strong>${order.snapshot.title[order.locale]}</strong>.` : `Thank you for choosing ByteCraft. We have received your order for <strong>${order.snapshot.title[order.locale]}</strong>.`}</p>
        <p><strong>${isAr ? 'رقم الطلب' : 'Order Number'}:</strong> ${order.orderNumber}</p>
        ${instructionsHtml}
        <p>${isAr ? 'يمكنك متابعة حالة طلبك أو رفع إيصال الدفع في أي وقت عبر الموقع.' : 'You can track your order status and upload payment proof at any time on our website.'}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">ByteCraft Dev Studio</p>
      </div>
    `;

    await this.sendMail({
      to: order.customer.email,
      subject,
      html,
      text: `${subject} - Order: ${order.orderNumber}`,
    });
  }

  // 2. New Order Notification (to Owner)
  async sendOrderCreatedOwner(order) {
    const ownerEmail = env.OWNER_NOTIFY_EMAIL || env.OWNER_EMAIL;
    if (!ownerEmail) return;

    const amountEgp = piastersToEgp(order.pricing.total, true);
    const subject = `🔔 New Order Received #${order.orderNumber} (${amountEgp} EGP)`;

    const html = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <h2>New Order Created</h2>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Project:</strong> ${order.snapshot.title.en} (${order.snapshot.packageKey})</p>
        <p><strong>Customer:</strong> ${order.customer.fullName} (${order.customer.email}, ${order.customer.phone})</p>
        <p><strong>Git:</strong> ${order.customer.gitProvider} / @${order.customer.gitUsername}</p>
        <p><strong>Total:</strong> ${amountEgp} EGP ${order.isFreeOrder ? '(FREE ORDER)' : ''}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        <p><strong>Status:</strong> ${order.status}</p>
      </div>
    `;

    await this.sendMail({
      to: ownerEmail,
      subject,
      html,
      text: subject,
    });
  }

  // 3. Payment Proof Submitted (to Owner)
  async sendProofSubmittedOwner(order) {
    const ownerEmail = env.OWNER_NOTIFY_EMAIL || env.OWNER_EMAIL;
    if (!ownerEmail) return;

    const subject = `🧾 Payment Proof Submitted for #${order.orderNumber}`;
    const html = `
      <div style="font-family: Arial, sans-serif; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <h2>Payment Proof Submitted for Review</h2>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Customer:</strong> ${order.customer.fullName} (${order.customer.email})</p>
        <p><strong>Reference / Notes:</strong> ${order.payment.proof?.reference || 'N/A'}</p>
        ${order.payment.proof?.url ? `<p><a href="${order.payment.proof.url}" target="_blank">View Receipt Image</a></p>` : ''}
        <p>Please review and approve or reject this payment in your Owner dashboard.</p>
      </div>
    `;

    await this.sendMail({
      to: ownerEmail,
      subject,
      html,
      text: subject,
    });
  }

  // 4. Payment Approved / Confirmed (to Customer)
  async sendPaymentApprovedCustomer(order) {
    const isAr = order.locale === 'ar';
    const subject = isAr
      ? `تم تأكيد الدفع لطلبك #${order.orderNumber} - بايت كرافت`
      : `Payment Confirmed for Order #${order.orderNumber} - ByteCraft`;

    const html = `
      <div style="font-family: Arial, sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #10b981;">${isAr ? 'تم تأكيد عملية الدفع بنجاح!' : 'Payment Confirmed Successfully!'}</h2>
        <p>${isAr ? `مرحباً ${order.customer.fullName}، يسعدنا إبلاغك بأنه تم تأكيد استلام دفعتك للطلب <strong>#${order.orderNumber}</strong>.` : `Hello ${order.customer.fullName}, we are pleased to confirm your payment for order <strong>#${order.orderNumber}</strong>.`}</p>
        <p>${isAr ? 'جاري تجهيز ومنح صلاحيات المستودع البرمجي (Git Repository) لحسابك.' : 'Source code repository access is being granted to your Git account.'}</p>
        <p><strong>${isAr ? 'حساب Git المُسجل' : 'Registered Git Username'}:</strong> ${order.customer.gitUsername} (${order.customer.gitProvider})</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">ByteCraft Dev Studio</p>
      </div>
    `;

    await this.sendMail({
      to: order.customer.email,
      subject,
      html,
      text: subject,
    });
  }

  // 5. Payment Rejected (to Customer)
  async sendPaymentRejectedCustomer(order, reason) {
    const isAr = order.locale === 'ar';
    const subject = isAr
      ? `تحديث بخصوص إيصال الدفع للطلب #${order.orderNumber}`
      : `Payment Proof Update for Order #${order.orderNumber}`;

    const html = `
      <div style="font-family: Arial, sans-serif; direction: ${isAr ? 'rtl' : 'ltr'}; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #ef4444;">${isAr ? 'تعذر تأكيد إيصال الدفع' : 'Payment Proof Not Verified'}</h2>
        <p>${isAr ? `مرحباً ${order.customer.fullName}، نود إعلامك بأن إيصال الدفع المُرسل للطلب <strong>#${order.orderNumber}</strong> لم يتم اعتماده للأسباب التالية:` : `Hello ${order.customer.fullName}, the payment proof submitted for order <strong>#${order.orderNumber}</strong> could not be verified for the following reason:`}</p>
        <div style="background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; padding: 12px; border-radius: 6px; margin: 15px 0;">
          <strong>${isAr ? 'سبب الرفض' : 'Reason'}:</strong> ${reason || (isAr ? 'بيانات التحويل غير مطابقة' : 'Transaction details did not match')}
        </div>
        <p>${isAr ? 'يمكنك الدخول لرابط طلبك وإعادة رفع الإيصال الصحيح أو التواصل معنا مباشرة.' : 'You can visit your order page to re-upload the correct proof or contact us directly.'}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b;">ByteCraft Dev Studio</p>
      </div>
    `;

    await this.sendMail({
      to: order.customer.email,
      subject,
      html,
      text: `${subject}: ${reason}`,
    });
  }

  // 6. New Customer Inquiry (to Owner)
  async sendInquiryOwner(inquiry) {
    const to = env.OWNER_NOTIFY_EMAIL || env.OWNER_EMAIL || 'owner@bytecraft.dev';
    const isAr = inquiry.locale === 'ar';
    const subject = `📩 New Inquiry from ${inquiry.name}: ${inquiry.subject}`;

    // Strictly escape raw user inputs to prevent HTML/XSS injection in owner emails
    const safeName = escapeHtml(inquiry.name);
    const safeEmail = escapeHtml(inquiry.email);
    const safePhone = escapeHtml(inquiry.phone || 'Not provided');
    const safeSubject = escapeHtml(inquiry.subject);
    const safeMessage = escapeHtml(inquiry.message).replace(/\n/g, '<br />');

    const html = `
      <div style="font-family: Arial, sans-serif; direction: ltr; color: #1e293b; max-width: 600px; margin: auto; padding: 20px;">
        <h2 style="color: #6366f1;">New Customer Inquiry Received</h2>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 15px 0;">
          <p><strong>From:</strong> ${safeName} (&lt;<a href="mailto:${safeEmail}">${safeEmail}</a>&gt;)</p>
          <p><strong>Phone:</strong> ${safePhone}</p>
          <p><strong>Locale:</strong> ${inquiry.locale}</p>
          <p><strong>Subject:</strong> ${safeSubject}</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; margin: 15px 0;">
          <strong>Message:</strong>
          <p style="margin-top: 8px; line-height: 1.6;">${safeMessage}</p>
        </div>
        <p style="font-size: 12px; color: #64748b;">ByteCraft Lead Notification</p>
      </div>
    `;

    await this.sendMail({
      to,
      subject,
      html,
      text: `New Inquiry from ${inquiry.name} (${inquiry.email}):\nSubject: ${inquiry.subject}\n\n${inquiry.message}`,
    });
  }
}

module.exports = new EmailService();
