import { AuthProvider, AuthGuard } from './features/auth'
import AppLayout from './common/layout/AppLayout'

function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    </AuthProvider>
  )
}

export default App
