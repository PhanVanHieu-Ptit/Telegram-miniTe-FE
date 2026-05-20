import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './styles/globals.css'
import './i18n/config'
import App from './App.tsx'
import 'antd/dist/reset.css';
import { AntdProvider } from './components/antd-provider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AntdProvider>
        <App />
      </AntdProvider>
    </BrowserRouter>
  </StrictMode>,
)
