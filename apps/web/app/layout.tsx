import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { Providers } from "./providers"
import AppHeader from "./_components/AppHeader"
import Footer from "./_components/Footer"

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "BarberLab",
  description: "Agendamento online de barbearia",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt" className={`${geist.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <AppHeader />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  )
}
