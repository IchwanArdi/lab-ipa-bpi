'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Button from './Button';
import { AlertCircle, CheckCircle, X, AlertTriangle } from 'lucide-react';

type DialogType = 'alert' | 'confirm';

interface DialogOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogContextType {
  showAlert: (message: string, options?: Omit<DialogOptions, 'onConfirm' | 'onCancel'>) => Promise<void>;
  showConfirm: (message: string, options?: Omit<DialogOptions, 'onConfirm' | 'onCancel'>) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<{
    type: DialogType;
    options: DialogOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showAlert = useCallback((message: string, options?: Omit<DialogOptions, 'onConfirm' | 'onCancel'>): Promise<void> => {
    return new Promise((resolve) => {
      setDialog({
        type: 'alert',
        options: {
          message,
          type: options?.type || 'info',
          title: options?.title,
          confirmText: options?.confirmText || 'OK',
          ...options,
        },
        resolve: () => {
          setDialog(null);
          resolve(undefined);
        },
      });
    });
  }, []);

  const showConfirm = useCallback((message: string, options?: Omit<DialogOptions, 'onConfirm' | 'onCancel'>): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        type: 'confirm',
        options: {
          message,
          type: options?.type || 'warning',
          title: options?.title,
          confirmText: options?.confirmText || 'Ya',
          cancelText: options?.cancelText || 'Tidak',
          ...options,
        },
        resolve: (value: boolean) => {
          setDialog(null);
          resolve(value);
        },
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialog) {
      dialog.options.onConfirm?.();
      dialog.resolve(true);
    }
  }, [dialog]);

  const handleCancel = useCallback(() => {
    if (dialog) {
      dialog.options.onCancel?.();
      dialog.resolve(false);
    }
  }, [dialog]);

  const getIcon = () => {
    if (!dialog) return null;
    const type = dialog.options.type || 'info';
    const iconClass = 'w-6 h-6';

    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      default:
        return <AlertCircle className={`${iconClass} text-blue-500`} />;
    }
  };

  const getTitleColor = () => {
    if (!dialog) return 'text-gray-900';
    const type = dialog.options.type || 'info';
    switch (type) {
      case 'success':
        return 'text-green-700';
      case 'error':
        return 'text-red-700';
      case 'warning':
        return 'text-yellow-700';
      default:
        return 'text-blue-700';
    }
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      {dialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-100 animate-slideUp">
            <div className="flex items-start gap-4">
              <div className="shrink-0">{getIcon()}</div>
              <div className="flex-1">
                {dialog.options.title && <h3 className={`text-xl font-bold mb-2 ${getTitleColor()}`}>{dialog.options.title}</h3>}
                <p className="text-gray-700 whitespace-pre-line">{dialog.options.message}</p>
              </div>
              {dialog.type === 'alert' && (
                <button onClick={handleConfirm} className="shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              {dialog.type === 'confirm' && (
                <Button variant="secondary" onClick={handleCancel} size="sm">
                  {dialog.options.cancelText || 'Tidak'}
                </Button>
              )}
              <Button variant={dialog.options.type === 'error' ? 'danger' : 'primary'} onClick={handleConfirm} size="sm">
                {dialog.options.confirmText || (dialog.type === 'alert' ? 'OK' : 'Ya')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within DialogProvider');
  }
  return context;
}
