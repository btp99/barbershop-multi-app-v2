import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-linear-to-br from-background to-muted/10">
      <div className="mx-auto max-w-3xl px-5 py-10 lg:px-8">
        <Link href="/" className="text-muted-foreground hover:text-foreground mb-8 inline-flex items-center gap-2 text-sm transition-colors">
          <ArrowLeftIcon className="h-4 w-4" />
          Voltar
        </Link>
        <h1 className="mb-2 text-3xl font-bold">{title}</h1>
        <div className="mt-8 space-y-6 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="text-muted-foreground space-y-2 text-sm">{children}</div>
    </section>
  )
}

export function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 pl-2">
      <h3 className="text-foreground text-sm font-medium">{title}</h3>
      <div className="text-muted-foreground space-y-1 text-sm">{children}</div>
    </div>
  )
}

export function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1 pl-5">{children}</ul>
}

export function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
      {children}
    </a>
  )
}
