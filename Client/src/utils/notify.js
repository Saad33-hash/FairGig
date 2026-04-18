import { toast } from 'react-toastify';

const baseToast = {
  className: 'app-toast',
  bodyClassName: 'app-toast-body',
};

export const notifySuccess = (message) =>
  toast.success(message, {
    ...baseToast,
    style: {
      background: 'var(--toast-success-bg)',
      color: 'var(--toast-success-text)',
      border: '1px solid var(--toast-success-border)',
    },
    progressStyle: {
      background: 'var(--success)',
    },
  });

export const notifyError = (message) =>
  toast.error(message, {
    ...baseToast,
    style: {
      background: 'var(--toast-error-bg)',
      color: 'var(--toast-error-text)',
      border: '1px solid var(--toast-error-border)',
    },
    progressStyle: {
      background: 'var(--toast-error-text)',
    },
  });