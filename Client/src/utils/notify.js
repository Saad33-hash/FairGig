import { toast } from 'react-toastify';

const baseToast = {
  className: 'app-toast',
  bodyClassName: 'app-toast-body',
};

export const notifySuccess = (message) =>
  toast.success(message, {
    ...baseToast,
    style: {
      background: '#ecfdf3',
      color: '#334155',
      border: '1px solid #86efac',
    },
    progressStyle: {
      background: '#16a34a',
    },
  });

export const notifyError = (message) =>
  toast.error(message, {
    ...baseToast,
    style: {
      background: '#fef2f2',
      color: '#334155',
      border: '1px solid #fca5a5',
    },
    progressStyle: {
      background: '#ef4444',
    },
  });