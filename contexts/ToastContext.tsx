
import React, { createContext, useState, useCallback, useContext, ReactNode } from 'react';
import { CheckCircle, XCircle, Info, Undo2 } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = (id: number) => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  const addToast = useCallback((message: string, type: ToastType = 'success', action?: ToastAction) => {
    const id = Date.now();
    setToasts((prevToasts) => [...prevToasts, { id, message, type, action }]);
    
    const timeout = action ? 6000 : 4000;
    setTimeout(() => {
      removeToast(id);
    }, timeout);
  }, []);

  const ToastIcon = ({ type }: { type: ToastType }) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" />;
      case 'error': return <XCircle className="text-red-500" />;
      case 'info': return <Info className="text-blue-500" />;
      default: return null;
    }
  };

  const toastBgColor = (type: ToastType) => {
    switch (type) {
        case 'success': return 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/30';
        case 'error': return 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30';
        case 'info': return 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30';
        default: return 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600';
    }
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center w-full max-w-sm p-4 rounded-lg shadow-lg border backdrop-blur-md animate-slide-in ${toastBgColor(toast.type)}`}
          >
            <ToastIcon type={toast.type} />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap flex-grow">{toast.message}</p>
            {toast.action && (
              <button 
                onClick={() => {
                  toast.action?.onClick();
                  removeToast(toast.id);
                }} 
                className="ml-4 flex-shrink-0 p-1.5 rounded-md bg-slate-300 dark:bg-slate-600/50 hover:bg-slate-400/50 dark:hover:bg-slate-600 transition text-xs font-semibold flex items-center gap-1.5 text-slate-700 dark:text-slate-200"
              >
                <Undo2 size={12}/>
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};