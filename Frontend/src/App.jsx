import AppProviders from './app/providers/AppProviders.jsx'
import AppRouter from './app/router/AppRouter.jsx'
import ScrollToTop from './shared/components/ui/ScrollToTop.jsx'

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
      <ScrollToTop />
    </AppProviders>
  )
}
