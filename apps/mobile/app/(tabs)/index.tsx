import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native"
import { useRouter, Tabs } from "expo-router"
import { trpc } from "../../lib/trpc"
import { useAuth } from "../../context/AuthContext"
import {
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  CheckCircleIcon,
  UsersIcon,
  InfoIcon,
} from "lucide-react-native"
import { formatPrice, formatDuration } from "@barberlab/ui"
import { format } from "date-fns"
import { pt } from "date-fns/locale"

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

type Barbershop = Awaited<ReturnType<typeof trpc.barbershop.getById.query>>

export default function HomeScreen() {
  const [barbershop, setBarbershop] = useState<Barbershop | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<string | null>(null)
  const { token, signIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    trpc.barbershop.getAll
      .query({})
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
    router.push({
      pathname: "/booking/confirm",
      params: { barbershopId: barbershop.id, serviceId: selectedService },
    })
  }

  const avgRating =
    barbershop && barbershop.reviews.length > 0
      ? barbershop.reviews.reduce((s, r) => s + r.rating, 0) / barbershop.reviews.length
      : null

  if (loading) {
    return (
      <>
        <Tabs.Screen options={{ title: "Agendar" }} />
        <View style={styles.center}>
          <ActivityIndicator color="#18B549" />
        </View>
      </>
    )
  }

  if (!barbershop) {
    return (
      <>
        <Tabs.Screen options={{ title: "Agendar" }} />
        <View style={styles.center}>
          <Text style={styles.muted}>Barbearia não disponível.</Text>
        </View>
      </>
    )
  }

  return (
    <>
      {/* Set header title to the shop name; keep tab label as "Agendar" */}
      <Tabs.Screen
        options={{
          title: barbershop.name,
          tabBarLabel: "Agendar",
          headerTitle: () => (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {barbershop.logoUrl ? (
                <Image
                  source={{ uri: barbershop.logoUrl }}
                  style={{ width: 28, height: 28, borderRadius: 6 }}
                  resizeMode="contain"
                />
              ) : null}
              <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 17 }}>
                {barbershop.name}
              </Text>
            </View>
          ),
        }}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Hero image with gradient overlay and badges */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: barbershop.imageUrl }} style={styles.hero} />
          <View style={styles.heroOverlay} />
          {barbershop.logoUrl && (
            <Image
              source={{ uri: barbershop.logoUrl }}
              style={styles.heroLogo}
              resizeMode="contain"
            />
          )}
          <View style={styles.heroBadges}>
            {avgRating !== null && (
              <View style={styles.badge}>
                <StarIcon size={11} color="#eab308" fill="#eab308" />
                <Text style={styles.badgeText}>{avgRating.toFixed(1)}</Text>
              </View>
            )}
            <View style={styles.badge}>
              <UsersIcon size={11} color="#9ca3af" />
              <Text style={styles.badgeText}>{barbershop.reviews.length} avaliações</Text>
            </View>
          </View>
        </View>

        {/* Info */}
        <View style={styles.section}>
          <Text style={styles.shopName}>{barbershop.name}</Text>
          <View style={styles.row}>
            <MapPinIcon size={14} color="#6b7280" />
            <Text style={styles.muted}>{barbershop.address}</Text>
          </View>
          {barbershop.description ? (
            <Text style={[styles.muted, { marginTop: 8, lineHeight: 20 }]}>
              {barbershop.description}
            </Text>
          ) : null}
        </View>

        {/* Amenities */}
        {barbershop.amenities.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.row, { marginBottom: 10 }]}>
              <InfoIcon size={16} color="#18B549" />
              <Text style={styles.sectionTitle}>Comodidades</Text>
            </View>
            <View style={styles.amenitiesGrid}>
              {barbershop.amenities.map((a) => (
                <View key={a} style={styles.amenityItem}>
                  <CheckCircleIcon size={14} color="#18B549" />
                  <Text style={styles.amenityText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Contact */}
        {barbershop.phones.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.row, { marginBottom: 10 }]}>
              <PhoneIcon size={16} color="#18B549" />
              <Text style={styles.sectionTitle}>Contacto</Text>
            </View>
            {barbershop.phones.map((p) => (
              <View key={p} style={[styles.row, { marginBottom: 4 }]}>
                <Text style={styles.muted}>{p}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços</Text>
          {barbershop.services.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={[
                styles.serviceCard,
                selectedService === svc.id && styles.serviceCardActive,
              ]}
              onPress={() => setSelectedService(svc.id === selectedService ? null : svc.id)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: svc.imageUrl }} style={styles.serviceImg} />
              <View style={styles.serviceBody}>
                <Text style={styles.serviceName}>{svc.name}</Text>
                <Text style={styles.serviceDesc} numberOfLines={2}>
                  {svc.description}
                </Text>
                <View style={[styles.row, { marginTop: 6 }]}>
                  <Text style={styles.price}>{formatPrice(Number(svc.price))}</Text>
                  <Text style={[styles.muted, { marginLeft: "auto" }]}>
                    {formatDuration(svc.duration)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Business hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horário</Text>
          {barbershop.businessHours.map((h) => (
            <View key={h.id} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{DAY_NAMES[h.dayOfWeek]}</Text>
              {h.closed || (!h.morningOpen && !h.afternoonOpen) ? (
                <Text style={styles.closed}>Fechado</Text>
              ) : (
                <Text style={styles.hours}>
                  {h.morningOpen && h.morningClose
                    ? `${h.morningOpen}–${h.morningClose}`
                    : ""}
                  {h.morningOpen && h.afternoonOpen ? " / " : ""}
                  {h.afternoonOpen && h.afternoonClose
                    ? `${h.afternoonOpen}–${h.afternoonClose}`
                    : ""}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Reviews */}
        {barbershop.reviews.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.row, { marginBottom: 12 }]}>
              <StarIcon size={16} color="#eab308" fill="#eab308" />
              <Text style={styles.sectionTitle}>
                Avaliações{" "}
                <Text style={{ color: "#6b7280", fontWeight: "normal" }}>
                  ({barbershop.reviews.length})
                </Text>
              </Text>
              {avgRating !== null && (
                <Text style={[styles.rating, { marginLeft: "auto" }]}>
                  {avgRating.toFixed(1)} / 5
                </Text>
              )}
            </View>
            {barbershop.reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.row}>
                  <Text style={styles.reviewName}>{r.user.name}</Text>
                  <View style={[styles.row, { marginLeft: "auto", gap: 2 }]}>
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <StarIcon key={i} size={11} color="#eab308" fill="#eab308" />
                    ))}
                  </View>
                </View>
                {r.comment ? (
                  <Text style={[styles.muted, { marginTop: 4 }]}>{r.comment}</Text>
                ) : null}
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

  heroContainer: { position: "relative" },
  hero: { width: "100%", height: 220 },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroLogo: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  heroBadges: {
    position: "absolute",
    bottom: 10,
    left: 12,
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1c1f26" },
  sectionTitle: { color: "#fff", fontWeight: "bold", fontSize: 16, marginLeft: 6 },
  shopName: { color: "#fff", fontWeight: "bold", fontSize: 22, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  muted: { color: "#9ca3af", fontSize: 13 },
  rating: { color: "#eab308", fontWeight: "600", fontSize: 13 },

  amenitiesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  amenityItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "47%" },
  amenityText: { color: "#9ca3af", fontSize: 13, flexShrink: 1 },

  serviceCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#2a2d35",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  serviceCardActive: { borderColor: "#18B549", backgroundColor: "rgba(24,181,73,0.05)" },
  serviceImg: { width: 72, height: 72, borderRadius: 8 },
  serviceBody: { flex: 1 },
  serviceName: { color: "#fff", fontWeight: "600", fontSize: 14 },
  serviceDesc: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  price: { color: "#18B549", fontWeight: "bold", fontSize: 14 },

  hoursRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  hoursDay: { color: "#9ca3af", fontSize: 13, width: 44 },
  hours: { color: "#fff", fontSize: 13 },
  closed: { color: "#ef4444", fontSize: 13 },

  reviewCard: { backgroundColor: "#1c1f26", borderRadius: 10, padding: 12, marginBottom: 10 },
  reviewName: { color: "#fff", fontWeight: "600", fontSize: 13 },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "#111216",
    borderTopWidth: 1,
    borderTopColor: "#2a2d35",
  },
  bookBtn: {
    backgroundColor: "#18B549",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  bookBtnText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
})
