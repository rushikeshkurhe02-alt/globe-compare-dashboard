import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../store/useToastStore';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-md px-4"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isWarning = toast.type === 'warning';
          const isError = toast.type === 'error';
          const isSuccess = toast.type === 'success';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-white dark:bg-[#14233D] border border-[#CBD3E0] dark:border-[#24365A] shadow-xl text-sm font-medium w-full text-text-primary"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                {isWarning && <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                {isError && <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />}
                {!isSuccess && !isWarning && !isError && (
                  <Info className="w-4 h-4 text-brand-indigo shrink-0" />
                )}
                <span className="truncate">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-md"
                aria-label="Dismiss toast"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
