import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Home from './app/page'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { useAuthStore } from '@/store/auth.store'
import { useChatStore } from '@/store/chat.store'
import { getMqttClient } from '@/mqtt/mqtt.client'
import { setupMqttListeners } from '@/mqtt/mqtt.service'

type BootstrapPhase = 'idle' | 'loading' | 'ready'

const MQTT_URL = import.meta.env.VITE_MQTT_URL ?? 'ws://localhost:1883'

function App(): JSX.Element {
  const [bootstrapPhase, setBootstrapPhase] = useState<BootstrapPhase>('idle')
  const hasBootstrappedRef = useRef(false)
  const mqttInitializedRef = useRef(false)
  const mqttCleanupRef = useRef<(() => void) | null>(null)

  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const fetchConversations = useChatStore((state) => state.fetchConversations)

  const connectMqtt = useCallback(async (): Promise<void> => {
    if (mqttInitializedRef.current) return

    try {
      const client = getMqttClient({ url: MQTT_URL })
      await client.connect()
      mqttCleanupRef.current?.()
      mqttCleanupRef.current = setupMqttListeners(client)
      mqttInitializedRef.current = true
    } catch (error) {
      console.error('Failed to connect MQTT:', error)
    }
  }, [])

  const bootstrapChat = useCallback(async (): Promise<void> => {
    await Promise.all([connectMqtt(), fetchConversations()])
  }, [connectMqtt, fetchConversations])

  useEffect(() => {
    let active = true

    const bootstrap = async (): Promise<void> => {
      setBootstrapPhase('loading')
      const authenticated = initializeAuth()

      if (authenticated) {
        try {
          await bootstrapChat()
        } catch (error) {
          console.error('Failed to bootstrap chat:', error)
        }
      }

      if (active) {
        setBootstrapPhase('ready')
        hasBootstrappedRef.current = true
      }
    }

    void bootstrap()

    return () => {
      active = false
    }
  }, [initializeAuth, bootstrapChat])

  useEffect(() => {
    if (!hasBootstrappedRef.current || !isAuthenticated) return
    void bootstrapChat().catch((error) => {
      console.error('Failed to bootstrap chat:', error)
    })
  }, [isAuthenticated, bootstrapChat])

  useEffect(() => {
    return () => {
      mqttCleanupRef.current?.()
      mqttCleanupRef.current = null
    }
  }, [])

  if (bootstrapPhase !== 'ready') {
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
