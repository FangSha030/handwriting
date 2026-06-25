import { useEditorStore } from '../store/editorStore'

const TOAST_STYLES = {
  info: {
    bg: 'bg-paper',
    border: 'border-line',
    text: 'text-ink',
    icon: (
      <svg className="w-4 h-4 text-accent" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
  success: {
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    text: 'text-accent-dark',
    icon: (
      <svg className="w-4 h-4 text-accent-dark" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  warn: {
    bg: 'bg-warn/10',
    border: 'border-warn/30',
    text: 'text-warn',
    icon: (
      <svg className="w-4 h-4 text-warn" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  error: {
    bg: 'bg-error/10',
    border: 'border-error/30',
    text: 'text-error',
    icon: (
      <svg className="w-4 h-4 text-error" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  },
}

export function ToastContainer() {
  const { toasts, removeToast } = useEditorStore()

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type]
        return (
          <div
            key={toast.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-float border ${style.bg} ${style.border} animate-slide-up pointer-events-auto cursor-pointer`}
            onClick={() => removeToast(toast.id)}
          >
            {style.icon}
            <span className={`text-sm ${style.text}`}>{toast.text}</span>
          </div>
        )
      })}
    </div>
  )
}
