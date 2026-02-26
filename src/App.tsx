import { useEffect, useState, type JSX } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './app/page'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuthStore } from '@/store/auth.store'

function App(): JSX.Element {
  const [isInitialized, setIsInitialized] = useState(false)
  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    initializeAuth()
    setIsInitialized(true)
  }, [initializeAuth])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-dvh w-full bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
