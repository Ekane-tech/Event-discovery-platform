import AppProviders from './app/providers/AppProviders.jsx'
import AppRouter from './app/router/AppRouter.jsx'

export default function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  )
}
