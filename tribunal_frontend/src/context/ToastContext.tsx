import React, { createContext, useContext, ReactNode } from 'react';
import toast, { Toaster, ToastOptions } from 'react-hot-toast';
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

interface ToastContextType {
  success: (message: string, options?: ToastOptions) => void;
  error: (message: string, options?: ToastOptions) => void;
  warning: (message: string, options?: ToastOptions) => void;
  info: (message: string, options?: ToastOptions) => void;
  loading: (message: string, options?: ToastOptions) => string;
  dismiss: (toastId?: string) => void;
  promise: <T>(promise: Promise<T>, messages: {
    loading: string;
    success: string;
    error: string;
  }) => Promise<T>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Configuración base de estilos
const baseToastStyle = {
  style: {
    background: 'var(--toast-bg)',
    color: 'var(--toast-text)',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    fontWeight: '500',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
  },
  duration: 4000,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, {
      ...baseToastStyle,
      icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      ...options,
    });
  };

  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, {
      ...baseToastStyle,
      icon: <XCircle className="w-5 h-5 text-red-500" />,
      duration: 5000,
      ...options,
    });
  };

  const warning = (message: string, options?: ToastOptions) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-amber-50 dark:bg-amber-950/90 border border-amber-200 dark:border-amber-800 rounded-xl shadow-lg pointer-events-auto flex items-center gap-3 p-4`}>
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200 flex-1">{message}</p>
        <button onClick={() => toast.dismiss(t.id)} className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200">
          ✕
        </button>
      </div>
    ), { duration: 4000, ...options });
  };

  const info = (message: string, options?: ToastOptions) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-blue-50 dark:bg-blue-950/90 border border-blue-200 dark:border-blue-800 rounded-xl shadow-lg pointer-events-auto flex items-center gap-3 p-4`}>
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex-1">{message}</p>
        <button onClick={() => toast.dismiss(t.id)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
          ✕
        </button>
      </div>
    ), { duration: 3000, ...options });
  };

  const loading = (message: string, options?: ToastOptions) => {
    return toast.loading(message, {
      ...baseToastStyle,
      icon: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
      ...options,
    });
  };

  const dismiss = (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  };

  const promise = async <T,>(
    promise: Promise<T>,
    messages: { loading: string; success: string; error: string }
  ): Promise<T> => {
    return toast.promise(promise, messages, {
      ...baseToastStyle,
      success: {
        ...baseToastStyle,
        icon: <CheckCircle className="w-5 h-5 text-emerald-500" />,
      },
      error: {
        ...baseToastStyle,
        icon: <XCircle className="w-5 h-5 text-red-500" />,
        duration: 5000,
      },
      loading: {
        ...baseToastStyle,
        icon: <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />,
      },
    });
  };

  return (
    <ToastContext.Provider value={{ success, error, warning, info, loading, dismiss, promise }}>
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-text)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}