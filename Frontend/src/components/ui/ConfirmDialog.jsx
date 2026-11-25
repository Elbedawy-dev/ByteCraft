import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'primary'
  loading = false,
  confirmDisabled = false,
  children,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? undefined : onClose}
      size="sm"
      title={title}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading}
            autoFocus={variant === 'danger'}
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary-gradient'}
            onClick={onConfirm}
            loading={loading}
            disabled={confirmDisabled || loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {message && (
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {message}
          </p>
        )}
        {children}
      </div>
    </Modal>
  );
}
