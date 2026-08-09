import { useEffect, useState } from "react"
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Image } from "react-native"
import { useRouter } from "expo-router"
import { trpc } from "../../lib/trpc"
import { useAuth } from "../../context/AuthContext"
import { MapPinIcon, PhoneIcon, StarIcon } from "lucide-react-native"
import { formatPrice, formatDuration } from "@barberlab/ui"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

const DAY_NAMES = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]

type Barbershop = Awaited<ReturnType<typeof trpc.barbershop.getById.query>>

export default function HomeScreen() {
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const { token, signIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    trpc.barbershop.getAll.query({})
      .then(async (list) => {
        const first = list[0]
        if (first) {
          const detail = await trpc.barbershop.getById.query({ id: first.id })
          setBarbershop(detail)
        }
      })
      .catch((err) => console.error("[home]", err))
      .finally(() => setLoading(false))
  }, [])

  const handleBook = () => {
    if (!token) { void signIn(); return }
    if (!selectedService || !barbershop) return
    router.push({ pathname: "/booking/confirm", params: { barbershopId: barbershop.id, serviceId: selectedService } })
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#18B549" /></View>
  }

  if (!barbershop) {
    return <View style={styles.center}><Text style={styles.muted}>Barbearia não disponível.</Text></View>
  }

  const avgRating = barbershop.reviews.length > 0
    ? barbershop.reviews.reduce((s, r) => s + r.rating, 0) / barbershop.reviews.length
    : null

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Image source={{ uri: barbershop.imageUrl }} style={styles.hero} />

        <View style={styles.section}>
          <Text style={styles.shopName}>{barbershop.name}</Text>
          <View style={styles.row}>
            <MapPinIcon size={14} color="#6b7280" />
            <Text style={styles.muted}>{barbershop.address}</Text>
          </View>
          {avgRating && (
            <View style={[styles.row, { marginTop: 4 }]}>
              <StarIcon size={14} color="#eab308" fill="#eab308" />
              <Text style={styles.rating}>{avgRating.toFixed(1)}</Text>
            </View>
          )}
          <Text style={[styles.muted, { marginTop: 8 }]}>{barbershop.description}</Text>
        </View>

        {barbershop.phones.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contactos</Text>
            {barbershop.phones.map((p) => (
              <View key={p} style={styles.row}>
                <PhoneIcon size={14} color="#18B549" />
                <Text style={styles.muted}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços</Text>
          {barbershop.services.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={[styles.serviceCard, selectedService === svc.id && styles.serviceCardActive]}
              onPress={() => setSelectedService(svc.id === selectedService ? null : svc.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: svc.imageUrl }} style={styles.serviceImg} />
              <View style={styles.serviceBody}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text>
                <View style={[styles.row, { marginTop: 6 }]}>
                  <Text style={styles.price}>{formatPrice(Number(svc.price))}</Text>
                  <Text style={[styles.muted, { marginLeft: "auto" }]}>{formatDuration(svc.duration)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horário</Text>
          {barbershop.businessHours.map((h) => (
            <View key={h.id} style={styles.hoursRow}>
              <Text style={styles.muted}>{DAY_NAMES[h.dayOfWeek]}</Text>
              {h.closed || (!h.morningOpen && !h.afternoonOpen) ? (
                <Text style={styles.closed}>Fechado</Text>
              ) : (
                <Text style={styles.hours}>
                  {h.morningOpen && h.morningClose ? `${h.morningOpen}–${h.morningClose}` : ""}
                  {h.morningOpen && h.afternoonOpen ? " / " : ""}
                  {h.afternoonOpen && h.afternoonClose ? `${h.afternoonOpen}–${h.afternoonClose}` : ""}
                </Text>
              )}
            </View>
          ))}
        </View>

        {barbershop.reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Avaliações</Text>
            {barbershop.reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.row}>
                  <Text style={styles.reviewName}>{r.user.name}</Text>
                  <View style={[styles.row, { marginLeft: "auto" }]}>
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <StarIcon key={i} size={12} color="#eab308" fill="#eab308" />
                    ))}
                  </View>
                </View>
                {r.comment && <Text style={[styles.muted, { marginTop: 4 }]}>{r.comment}</Text>}
                <Text style={[styles.muted, { fontSize: 11, marginTop: 4 }]}>
                  {format(new Date(r.createdAt), "d 'de' MMMM 'de' yyyy", { locale: pt })}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedService && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
            <Text style={styles.bookBtnText}>
              {token ? "Escolher horário" : "Iniciar sessão para agendar"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { paddingBottom: 24 },
  hero: { width: "100%", height: 200 },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1c1f26" },
  sectionTitle: { color: "#fff", fontWeight: "bold", fontSize: 16, marginBottom: 12 },
  shopName: { color: "#fff", fontWeight: "bold", fontSize: 22, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  muted: { color: "#9ca3af", fontSize: 13 },
  rating: { color: "#eab308", fontWeight: "600", fontSize: 13 },
  serviceCard: { flexDirection: "row", gap: 12, borderWidth: 1, borderColor: "#2a2d35", borderRadius: 12, padding: 10, marginBottom: 10 },
  serviceCardActive: { borderColor: "#18B549", backgroundColor: "rgba(24,181,73,0.05)" },
  serviceImg: { width: 72, height: 72, borderRadius: 8 },
  serviceBody: { flex: 1 },
  serviceName: { color: "#fff", fontWeight: "600", fontSize: 14 },
  serviceDesc: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  price: { color: "#18B549", fontWeight: "bold", fontSize: 14 },
  hoursRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  hours: { color: "#fff", fontSize: 13 },
  closed: { color: "#ef4444", fontSize: 13 },
  reviewCard: { backgroundColor: "#1c1f26", borderRadius: 10, padding: 12, marginBottom: 10 },
  reviewName: { color: "#fff", fontWeight: "600", fontSize: 13 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "#111216", borderTopWidth: 1, borderTopColor: "#2a2d35" },
  bookBtn: { backgroundColor: "#18B549", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  bookBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
})
