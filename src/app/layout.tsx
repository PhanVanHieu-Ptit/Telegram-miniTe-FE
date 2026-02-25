import { AntdProvider } from '@/components/antd-provider'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AntdProvider>
          {children}
        </AntdProvider>
      </body>
    </html>
  )
}
