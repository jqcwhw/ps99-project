import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ApiKeyProvider } from "./contexts/ApiKeyContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Maska x StatsPets x Cosmic",
  description: "Most advanced tool in all ps99 history",
  // You can leave the metadata icons property, but it’s optional now
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Explicitly setting the favicon */}
        <link rel="icon" href="https://cdn-icons-png.flaticon.com/512/5278/5278402.ico" />
        {/* You can also add any additional meta tags here */}
      </head>
      <body className={inter.className}>
        <ApiKeyProvider>{children}</ApiKeyProvider>
      </body>
    </html>
  )
}
