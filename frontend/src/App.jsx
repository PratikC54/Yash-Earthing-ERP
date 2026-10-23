import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, AuthGuard } from './features/auth'
import AppLayout from './common/layout/AppLayout'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AuthGuard>
          <AppLayout />
        </AuthGuard>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
