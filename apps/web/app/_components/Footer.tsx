import Link from "next/link"
import { getServerCaller } from "@/lib/trpc-server"

export default async function Footer() {
  let name = "Barbearia"
  try {
    const caller = await getServerCaller()
    const barbershops = await caller.barbershop.getAll()
    name = barbershops[0]?.name ?? "Barbearia"
  } catch {
    // use default
  }
  const year = new Date().getFullYear()

  return (
    <footer className="bg-card/30 border-t backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground text-sm">
            © {year} <span className="font-bold">{name}</span>. Todos os direitos reservados.
          </p>
          <div className="text-muted-foreground flex items-center gap-6 text-sm">
            <Link href="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-primary transition-colors">Termos</Link>
            <Link href="/cookies" className="hover:text-primary transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
