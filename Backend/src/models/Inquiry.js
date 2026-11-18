const mongoose = require('mongoose');

/**
 * Inquiry Model
 * 
 * WHY:
 * 1. Customer Lead Management: Stores pre-sales inquiries, custom project requests,
 *    and service plan consultations.
 * 2. Bilingual Support: Tracks customer locale ('ar' or 'en') for localized follow-up emails.
 * 3. Status Workflow: Supports 'new', 'read', 'in_progress', 'resolved', 'archived' transitions.
 * 4. Audit & Notes: Allows the owner to keep private administrative notes on client interactions.
 */

const inquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    servicePlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServicePlan',
      default: null,
    },
    locale: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar',
    },
    status: {
      type: String,
      enum: ['new', 'read', 'in_progress', 'resolved', 'archived'],
      default: 'new',
      index: true,
    },
    ownerNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

inquirySchema.index({ status: 1, createdAt: -1 });
inquirySchema.index({ name: 'text', email: 'text', subject: 'text', message: 'text' });

const Inquiry = mongoose.model('Inquiry', inquirySchema);

module.exports = Inquiry;
