import { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native"
import { useRouter } from "expo-router"
import { ActivityIndicator, Surface, Chip } from "react-native-paper"
import {
  MapPinIcon,
  PhoneIcon,
  StarIcon,
  CheckCircleIcon,
  ClockIcon,
} from "lucide-react-native"
import { format } from "date-fns"
import { pt } from "date-fns/locale"
import { trpc } from "../../lib/trpc"
import { useAuth } from "../../context/AuthContext"

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(price)
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}min` : `${h}h`
}

type Shop = Awaited<ReturnType<typeof trpc.shop.get.query>>

export default function HomeScreen() {
  const [shop, setShop] = useState<Shop>(null)
  const [loading, setLoading] = useState(true)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)
  const { token, signIn } = useAuth()
  const router = useRouter()

  useEffect(() => {
    trpc.shop.get
      .query()
      .then((s) => setShop(s))
      .catch((err) => console.error("[home]", err))
      .finally(() => setLoading(false))
  }, [])

  const handleBook = () => {
    if (!selectedServiceId) return
    if (!token) {
      void signIn()
      return
    }
    router.push({ pathname: "/booking", params: { serviceId: selectedServiceId } })
  }

  const avgRating =
    shop && shop.reviews.length > 0
      ? shop.reviews.reduce((s, r) => s + r.rating, 0) / shop.reviews.length
      : null

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#18B549" />
      </View>
    )
  }

  if (!shop) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Barbearia não disponível.</Text>
      </View>
    )
  }

  return (
    <>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Hero */}
        <View style={styles.hero}>
          <Image source={{ uri: shop.imageUrl }} style={styles.heroImg} />
          <View style={styles.heroOverlay} />
          {shop.logoUrl && (
            <Image source={{ uri: shop.logoUrl }} style={styles.heroLogo} resizeMode="contain" />
          )}
          <View style={styles.heroBadges}>
            {avgRating !== null && (
              <View style={styles.badge}>
                <StarIcon size={11} color="#eab308" fill="#eab308" />
                <Text style={styles.badgeText}>{avgRating.toFixed(1)}</Text>
              </View>
            )}
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{shop.reviews.length} avaliações</Text>
            </View>
          </View>
        </View>

        {/* Shop info */}
        <View style={styles.section}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <View style={styles.row}>
            <MapPinIcon size={14} color="#6b7280" />
            <Text style={styles.muted}>{shop.address}</Text>
          </View>
          {shop.description ? (
            <Text style={[styles.muted, { marginTop: 8, lineHeight: 20 }]}>{shop.description}</Text>
          ) : null}
        </View>

        {/* Amenities */}
        {shop.amenities.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comodidades</Text>
            <View style={styles.chipsRow}>
              {shop.amenities.map((a) => (
                <Chip
                  key={a}
                  icon={() => <CheckCircleIcon size={13} color="#18B549" />}
                  style={styles.chip}
                  textStyle={styles.chipText}
                >
                  {a}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* Contact */}
        {shop.phones.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.row, { marginBottom: 8 }]}>
              <PhoneIcon size={15} color="#18B549" />
              <Text style={styles.sectionTitle}>Contacto</Text>
            </View>
            {shop.phones.map((p) => (
              <Text key={p} style={styles.muted}>{p}</Text>
            ))}
          </View>
        )}

        {/* Services */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Serviços</Text>
          <Text style={[styles.muted, { marginBottom: 12, fontSize: 12 }]}>
            Seleciona um serviço para agendar
          </Text>
          {shop.services.map((svc) => {
            const isSelected = selectedServiceId === svc.id
            return (
              <TouchableOpacity
                key={svc.id}
                style={[styles.serviceCard, isSelected && styles.serviceCardActive]}
                onPress={() => setSelectedServiceId(isSelected ? null : svc.id)}
                activeOpacity={0.8}
              >
                <Image source={{ uri: svc.imageUrl }} style={styles.serviceImg} />
                <View style={styles.serviceBody}>
                  <Text style={styles.serviceName}>{svc.name}</Text>
                  <Text style={styles.serviceDesc} numberOfLines={2}>{svc.description}</Text>
                  <View style={[styles.row, { marginTop: 8 }]}>
                    <Text style={styles.price}>{formatPrice(Number(svc.price))}</Text>
                    <View style={[styles.row, { marginLeft: "auto" }]}>
                      <ClockIcon size={11} color="#6b7280" />
                      <Text style={[styles.muted, { fontSize: 12 }]}>{formatDuration(svc.duration)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Business hours */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horário</Text>
          {shop.businessHours.map((h) => (
            <View key={h.id} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{DAY_NAMES[h.dayOfWeek]}</Text>
              {h.closed || (!h.morningOpen && !h.afternoonOpen) ? (
                <Text style={styles.closed}>Fechado</Text>
              ) : (
                <Text style={styles.hours}>
                  {h.morningOpen && h.morningClose ? `${h.morningOpen}–${h.morningClose}` : ""}
                  {h.morningOpen && h.afternoonOpen ? "  /  " : ""}
                  {h.afternoonOpen && h.afternoonClose ? `${h.afternoonOpen}–${h.afternoonClose}` : ""}
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Reviews */}
        {shop.reviews.length > 0 && (
          <View style={styles.section}>
            <View style={[styles.row, { marginBottom: 12 }]}>
              <StarIcon size={15} color="#eab308" fill="#eab308" />
              <Text style={[styles.sectionTitle, { marginLeft: 6 }]}>
                Avaliações ({shop.reviews.length})
              </Text>
              {avgRating !== null && (
                <Text style={[styles.rating, { marginLeft: "auto" }]}>
                  {avgRating.toFixed(1)} / 5
                </Text>
              )}
            </View>
            {shop.reviews.map((r) => (
              <Surface key={r.id} style={styles.reviewCard} elevation={0}>
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
              </Surface>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {selectedServiceId && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.bookBtn} onPress={handleBook}>
            <Text style={styles.bookBtnText}>
              {token ? "Escolher horário →" : "Iniciar sessão para agendar"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111216" },
  scroll: { flex: 1, backgroundColor: "#111216" },
  content: { paddingBottom: 24 },

  hero: { position: "relative" },
  heroImg: { width: "100%", height: 220 },
  heroOverlay: { position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.45)" },
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
  badgeText: { color: "#fff", fontSize: 12, fontFamily: "Outfit_600SemiBold" },

  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#1c1f26" },
  sectionTitle: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 16 },
  shopName: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 22, marginBottom: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  muted: { color: "#9ca3af", fontSize: 13, fontFamily: "Outfit_400Regular" },
  rating: { color: "#eab308", fontFamily: "Outfit_600SemiBold", fontSize: 13 },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { backgroundColor: "#1c1f26" },
  chipText: { color: "#9ca3af", fontSize: 12, fontFamily: "Outfit_400Regular" },

  serviceCard: {
    flexDirection: "row",
    gap: 12,
    borderWidth: 1,
    borderColor: "#2a2d35",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    backgroundColor: "#17191f",
  },
  serviceCardActive: { borderColor: "#18B549", backgroundColor: "rgba(24,181,73,0.05)" },
  serviceImg: { width: 72, height: 72, borderRadius: 8 },
  serviceBody: { flex: 1 },
  serviceName: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 14 },
  serviceDesc: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 12, marginTop: 2 },
  price: { color: "#18B549", fontFamily: "Outfit_700Bold", fontSize: 14 },

  hoursRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  hoursDay: { color: "#9ca3af", fontFamily: "Outfit_400Regular", fontSize: 13, width: 44 },
  hours: { color: "#fff", fontFamily: "Outfit_400Regular", fontSize: 13 },
  closed: { color: "#ef4444", fontFamily: "Outfit_400Regular", fontSize: 13 },

  reviewCard: {
    backgroundColor: "#1c1f26",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  reviewName: { color: "#fff", fontFamily: "Outfit_600SemiBold", fontSize: 13 },

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
    paddingVertical: 15,
    alignItems: "center",
  },
  bookBtnText: { color: "#fff", fontFamily: "Outfit_700Bold", fontSize: 15 },
})
