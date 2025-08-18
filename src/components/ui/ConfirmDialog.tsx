import { AlertTriangle, X } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'
import { IconButton } from './IconButton'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false
}: ConfirmDialogProps) {
  if (!isOpen) return null

  const titleId = 'confirm-dialog-title'
  const descId = 'confirm-dialog-description'

  return (
    <Modal isOpen={isOpen} onClose={onClose} labelledById={titleId} describedById={descId} role="alertdialog" dismissible={variant !== 'danger'} size="sm">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${variant === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
            <AlertTriangle className={`h-5 w-5 ${variant === 'danger' ? 'text-red-600' : 'text-yellow-600'
              }`} />
          </div>
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>

        <IconButton onClick={onClose} aria-label="Close dialog" variant="ghost" disabled={loading}>
          <X className="h-5 w-5 text-gray-400" />
        </IconButton>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 min-h-0 overflow-y-auto">
        <p id={descId} className="text-gray-600 leading-relaxed">{message}</p>
      </div>

      {/* Footer */}
      <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant={variant === 'danger' ? 'destructive' : 'secondary'}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  )
}
