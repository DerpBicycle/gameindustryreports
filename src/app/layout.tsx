import { type Metadata } from 'next'
import '@/styles/tailwind.css'

export const metadata: Metadata = {
  title: 'Game Industry Reports - Comprehensive Gaming Market Analysis',
  description: 'Your comprehensive database of gaming industry research, market analysis, and strategic insights. Browse AI-analyzed reports with advanced filtering and search.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
