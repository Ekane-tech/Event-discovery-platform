import Alert from './Alert.jsx'
import Button from '../ui/Button.jsx'
import Modal from '../ui/Modal.jsx'

export default function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', variant = 'danger', loading = false, onConfirm, onClose }) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="grid gap-5">
        <Alert type={variant === 'danger' ? 'warning' : 'info'}>{message}</Alert>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button type="button" variant={variant} onClick={onConfirm} disabled={loading}>{loading ? 'Processing...' : confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}
