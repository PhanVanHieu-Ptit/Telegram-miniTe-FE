import { getMqttClient } from '@/mqtt/mqtt.client'
import { setupMqttListeners } from '@/mqtt/mqtt.service'
import { useAuthStore } from '@/store/auth.store'
import { useChatStore } from '@/store/chat.store'
import { useCallback, useEffect, useRef, useState, type JSX } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import GoogleCallbackPage from './pages/GoogleCallbackPage'
import MessageSummarizerPage from './pages/MessageSummarizerPage'
import NotificationProvider from './components/NotificationProvider'
import { WebRTCProvider } from '@/contexts/webrtc.context'
import IncomingCallOverlay from '@/components/IncomingCallOverlay'
import { Toaster } from 'sonner'

type BootstrapPhase = 'idle' | 'loading' | 'ready'

const MQTT_URL = import.meta.env.VITE_MQTT_URL ?? 'ws://localhost:1883'
const MQTT_USER = import.meta.env.VITE_MQTT_USER
const MQTT_PASS = import.meta.env.VITE_MQTT_PASS

function App(): JSX.Element {
  const [bootstrapPhase, setBootstrapPhase] = useState<BootstrapPhase>('idle')
  const hasBootstrappedRef = useRef(false)
  const mqttInitializedRef = useRef(false)
  const mqttCleanupRef = useRef<(() => void) | null>(null)

  const initializeAuth = useAuthStore((state) => state.initializeAuth)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const fetchConversations = useChatStore((state) => state.fetchConversations)
  const subscribeToAllConversations = useChatStore((state) => state.subscribeToAllConversations)

  const connectMqtt = useCallback(async (): Promise<void> => {
    if (mqttInitializedRef.current) return

    try {
      const client = getMqttClient({
        url: MQTT_URL,
        username: MQTT_USER,
        password: MQTT_PASS,
      });
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
    // Subscribe to message topics for ALL conversations so incoming
    // messages are received even when the conversation is not active.
    await subscribeToAllConversations()
  }, [connectMqtt, fetchConversations, subscribeToAllConversations])

  useEffect(() => {
    let active = true

    const bootstrap = async (): Promise<void> => {
      setBootstrapPhase('loading')
      const authenticated = await initializeAuth()

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
    if (!isAuthenticated || !mqttInitializedRef.current) return;

    const intervalId = setInterval(() => {
      const user = useAuthStore.getState().user;
      const activeConvId = useChatStore.getState().activeConversationId;

      if (user?.id) {
        const client = getMqttClient({ url: MQTT_URL });
        const isHidden = document.hidden;
        const effectiveActiveConvId = isHidden ? null : activeConvId;

        import('@/mqtt/mqtt.service').then(({ publishHeartbeat }) => {
          void publishHeartbeat(client, user.id, effectiveActiveConvId);
        });
      }
    }, 10_000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [isAuthenticated]);

  useEffect(() => {
    return () => {
      mqttCleanupRef.current?.()
      mqttCleanupRef.current = null
    }
  }, [])

  return (
    <NotificationProvider>
      {/* WebRTCProvider is intentionally outside the bootstrap guard so the
          socket connects as soon as the token is available — not after MQTT
          and conversations finish loading. This prevents missing incoming
          calls during the app bootstrap window. */}
      <WebRTCProvider>
        <Toaster 
          position="top-center" 
          richColors 
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              color: '#ffffff',
            },
          }}
        />
        {/* Global incoming call popup — always visible regardless of page */}
        <IncomingCallOverlay />
        {bootstrapPhase !== 'ready' ? (
          <div className="flex items-center justify-center h-dvh w-full bg-transparent">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        ) : (
          <Routes>
            <Route path="/sign-in" element={<LoginPage />} />
            <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />
            <Route path="/auth/login" element={<Navigate to="/sign-in" replace />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/summarize"
              element={
                <ProtectedRoute>
                  <MessageSummarizerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={<Navigate to="/chat" replace />}
            />
            <Route
              path="/admin"
              element={<Navigate to="/" replace />}
            />
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/chat" replace /> : <Navigate to="/sign-in" replace />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </WebRTCProvider>
    </NotificationProvider>
  )
}


export default App
