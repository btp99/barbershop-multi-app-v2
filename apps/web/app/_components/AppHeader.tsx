"use client"

import Link from "next/link"
import { useSession, signIn, signOut } from "next-auth/react"
import { CalendarIcon, ScissorsIcon, UserIcon, LogOutIcon, ShieldIcon } from "lucide-react"
import Image from "next/image"

export default function AppHeader() {
  const { data: session } = useSession()
  const user = session?.user as { id?: string; name?: string; email?: string; image?: string; isAdmin?: boolean } | undefined

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <ScissorsIcon className="w-5 h-5 text-primary" />
          <span>BarberLab</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/barbershops"
            className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            Barbearias
          </Link>

          {session ? (
            <>
              <Link
                href="/bookings"
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5"
              >
                <CalendarIcon className="w-4 h-4" />
                Agendamentos
              </Link>

              {user?.isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-accent transition-colors flex items-center gap-1.5"
                >
                  <ShieldIcon className="w-4 h-4" />
                  Admin
                </Link>
              )}

              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border">
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? ""}
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary" />
                  </div>
                )}
                <button
                  onClick={() => void signOut()}
                  className="text-sm text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-accent transition-colors"
                  title="Terminar sessão"
                >
                  <LogOutIcon className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => void signIn("google")}
              className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-semibold hover:bg-primary/90 transition-colors ml-2"
            >
              Iniciar sessão
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}
