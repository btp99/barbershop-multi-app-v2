import type { Metadata } from "next"
import { Geist } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { Providers } from "./providers"
import AppHeader from "./_components/AppHeader"
import Footer from "./_components/Footer"
import { getServerCaller } from "@/lib/trpc-server"

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
})

export async function generateMetadata(): Promise<Metadata> {
  try {
    const caller = await getServerCaller()
    const barbershops = await caller.barbershop.getAll({})
    const name = barbershops[0]?.name ?? "Barbearia"
    return { title: name, description: "Agendamento online de barbearia" }
  } catch {
    return { title: "Barbearia", description: "Agendamento online de barbearia" }
  }
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  let shopName = "Barbearia"
  let logoUrl: string | null = null
  try {
    const caller = await getServerCaller()
    const barbershops = await caller.barbershop.getAll({})
    const first = barbershops[0]
    if (first) {
      shopName = first.name
      const full = await caller.barbershop.getById({ id: first.id })
      logoUrl = full?.logoUrl ?? null
    }
  } catch {
    // keep defaults
  }

  return (
    <html lang="pt" className={`${geist.variable} dark h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <AppHeader shopName={shopName} logoUrl={logoUrl} />
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
