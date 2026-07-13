import { Toaster } from 'sonner'

export default function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        duration: 3500,
        className: 'font-medium',
      }}
    />
  )
}
