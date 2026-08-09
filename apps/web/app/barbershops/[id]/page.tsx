import { getServerCaller } from "@/lib/trpc-server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import Image from "next/image"
import { MapPinIcon, PhoneIcon, ClockIcon, StarIcon, UsersIcon, InfoIcon, CalendarIcon, MessageSquareIcon, CheckCircleIcon } from "lucide-react"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import BookingSection from "./_components/BookingSection"
import ReviewSection from "./_components/ReviewSection"
import PhoneItem from "@/app/_components/PhoneItem"

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

function formatHours(bh: {
  closed: boolean
  morningOpen: string | null
  morningClose: string | null
  afternoonOpen: string | null
  afternoonClose: string | null
}): string {
  if (bh.closed) return "Fechado"
  const open = bh.morningOpen ?? bh.afternoonOpen
  const close = bh.afternoonClose ?? bh.morningClose
  if (!open || !close) return "Fechado"
  if (bh.morningClose && bh.afternoonOpen) {
    return `${bh.morningOpen} - ${bh.morningClose} / ${bh.afternoonOpen} - ${bh.afternoonClose ?? ""}`
  }
  return `${open} - ${close}`
}

async function MapCard({ address }: { address: string }) {
  let iframeSrc: string | null = null
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      {
        next: { revalidate: 86400 },
        headers: { "User-Agent": "BarberLab/1.0 contact@barberlab.pt" },
      },
    )
    const data = await res.json() as Array<{ lat: string; lon: string }>
    if (data[0]) {
      const lat = parseFloat(data[0].lat)
      const lon = parseFloat(data[0].lon)
      const d = 0.005
      iframeSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&layer=mapnik&marker=${lat},${lon}`
    }
  } catch {
    // fall through to link-only fallback
  }

  return (
    <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
        <MapPinIcon className="text-primary h-5 w-5" />
        <span className="font-semibold text-sm">Localização</span>
      </div>
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          width="100%"
          height="200"
          className="border-0"
          loading="lazy"
          title="Mapa de localização"
        />
      )}
      <div className="px-4 py-3">
        <p className="text-muted-foreground text-sm">{address}</p>
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary mt-1 inline-block text-xs hover:underline"
        >
          Abrir no Google Maps →
        </a>
      </div>
    </div>
  )
}

export default async function BarbershopPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params
  const caller = await getServerCaller()
  const session = await getServerSession(authOptions)

  const barbershop = await caller.barbershop.getById({ id })
  if (!barbershop) notFound()

  const currentUserId = (session?.user as { id?: string } | undefined)?.id
  const userReview = currentUserId
    ? (barbershop.reviews.find((r) => r.userId === currentUserId) ?? null)
    : null

  const avgRating =
    barbershop.reviews.length > 0
      ? Math.round((barbershop.reviews.reduce((s, r) => s + r.rating, 0) / barbershop.reviews.length) * 10) / 10
      : null

  const totalClients = 300

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted/20">
      {/* Hero image */}
      <div className="relative w-full h-[300px] lg:h-[500px]">
        <Image
          src={barbershop.imageUrl}
          alt={barbershop.name}
          fill
          sizes="100vw"
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-black/20" />

        <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="text-white">
              <div className="mb-2 flex items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-primary/90 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  <StarIcon className="w-3 h-3 fill-white" />
                  {avgRating ?? "—"}
                </span>
                <span className="inline-flex items-center border border-white/30 bg-white/20 text-white backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-full">
                  {barbershop.reviews.length} avaliações
                </span>
              </div>
              <h1 className="mb-2 text-2xl font-bold lg:text-4xl">{barbershop.name}</h1>
              <div className="flex items-center gap-2 text-white/90">
                <MapPinIcon className="w-4 h-4" />
                <p className="text-sm lg:text-base">{barbershop.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-5 py-8 lg:px-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-12">

          {/* Left column */}
          <div className="space-y-8 lg:col-span-8">

            {/* Mobile quick stats */}
            <div className="grid grid-cols-2 gap-3 lg:hidden">
              <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 p-4 text-center">
                <StarIcon className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
                <p className="text-lg font-bold text-yellow-500">{avgRating ?? "—"}</p>
                <p className="text-muted-foreground text-xs">Avaliação</p>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-4 text-center">
                <UsersIcon className="mx-auto mb-1 h-5 w-5 text-blue-500" />
                <p className="text-lg font-bold text-blue-500">+{totalClients}</p>
                <p className="text-muted-foreground text-xs">Clientes</p>
              </div>
            </div>

            {/* About */}
            <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5">
              <h2 className="flex items-center gap-2 font-bold text-lg mb-3">
                <InfoIcon className="text-primary h-5 w-5" />
                Sobre a Barbearia
              </h2>
              <p className="text-muted-foreground leading-relaxed">{barbershop.description}</p>
              {barbershop.amenities.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {barbershop.amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2 text-sm">
                      <CheckCircleIcon className="h-4 w-4 text-green-500 shrink-0" />
                      <span>{a}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Services */}
            <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 font-bold text-lg">
                  <CalendarIcon className="text-primary h-5 w-5" />
                  Serviços
                </h2>
                <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full">
                  {barbershop.services.length} serviços
                </span>
              </div>
              <BookingSection
                barbershopId={id}
                services={barbershop.services.map((s) => ({ ...s, price: Number(s.price) }))}
                userId={currentUserId ?? null}
              />
            </div>

            {/* Reviews */}
            <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm p-5">
              <h2 className="flex items-center gap-2 font-bold text-lg mb-4">
                <MessageSquareIcon className="text-primary h-5 w-5" />
                Avaliações
                {barbershop.reviews.length > 0 && (
                  <span className="text-muted-foreground text-sm font-normal">({barbershop.reviews.length})</span>
                )}
              </h2>

              <ReviewSection
                barbershopId={id}
                existingReview={userReview ? { rating: userReview.rating, comment: userReview.comment } : null}
                isLoggedIn={!!currentUserId}
              />

              {barbershop.reviews.length > 0 && (
                <div className="mt-6 space-y-4">
                  {barbershop.reviews.map((review) => (
                    <div key={review.id} className="border border-border rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        {review.user.image && (
                          <Image
                            src={review.user.image}
                            alt={review.user.name ?? ""}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <span className="font-semibold text-sm">{review.user.name}</span>
                        <span className="flex items-center gap-0.5 ml-auto text-yellow-500 text-sm">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <StarIcon key={i} className="w-3.5 h-3.5 fill-yellow-500" />
                          ))}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(review.createdAt), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="mt-8 space-y-5 lg:col-span-4 lg:mt-0">

            {/* Desktop quick stats */}
            <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
              <div className="rounded-xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 p-5 text-center">
                <div className="mx-auto mb-2 w-fit rounded-xl bg-yellow-500/20 p-2.5">
                  <StarIcon className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-2xl font-bold text-yellow-500">{avgRating ?? "—"}</p>
                <p className="text-muted-foreground text-sm mt-1">Avaliação Média</p>
              </div>
              <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-5 text-center">
                <div className="mx-auto mb-2 w-fit rounded-xl bg-blue-500/20 p-2.5">
                  <UsersIcon className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold text-blue-500">+{totalClients}</p>
                <p className="text-muted-foreground text-sm mt-1">Clientes Atendidos</p>
              </div>
            </div>

            {/* Business hours */}
            <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm">
              <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
                <ClockIcon className="text-primary h-5 w-5" />
                <span className="font-semibold text-sm">Horário de Funcionamento</span>
              </div>
              <div className="px-4 py-3 space-y-2">
                {barbershop.businessHours.length > 0 ? (
                  barbershop.businessHours.map((bh) => {
                    const hours = formatHours(bh)
                    return (
                      <div key={bh.dayOfWeek} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                        <span className="text-sm font-medium">{DAY_NAMES[bh.dayOfWeek]}</span>
                        <span className={`text-sm ${hours === "Fechado" ? "text-destructive" : "text-muted-foreground"}`}>
                          {hours}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-muted-foreground text-sm">Horário não configurado.</p>
                )}
              </div>
            </div>

            {/* Contact */}
            {barbershop.phones.length > 0 && (
              <div className="rounded-xl border border-border bg-card/30 backdrop-blur-sm">
                <div className="px-4 py-3 flex items-center gap-2 border-b border-border">
                  <PhoneIcon className="text-primary h-5 w-5" />
                  <span className="font-semibold text-sm">Contacto</span>
                </div>
                <div className="px-4 py-3 space-y-3">
                  {barbershop.phones.map((phone) => (
                    <PhoneItem key={phone} phone={phone} />
                  ))}
                </div>
              </div>
            )}

            {/* Map */}
            <MapCard address={barbershop.address} />

            {/* CTA */}
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-5 text-center">
              <CalendarIcon className="mx-auto mb-2 h-6 w-6 text-primary" />
              <h3 className="font-semibold mb-1">Pronto para agendar?</h3>
              <p className="text-muted-foreground text-sm">Escolha um serviço acima e reserve o seu horário.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
