"use client"

import { useState } from "react"
import { StarIcon } from "lucide-react"
import { trpc } from "@/lib/trpc"
import { toast } from "sonner"
import { signIn } from "next-auth/react"

interface Props {
  barbershopId: string
  existingReview: { rating: number; comment: string | null } | null
  isLoggedIn: boolean
}

export default function ReviewSection({ barbershopId, existingReview, isLoggedIn }: Props) {
  const [rating, setRating] = useState(existingReview?.rating ?? 0)
  const [hovered, setHovered] = useState(0)
  const [comment, setComment] = useState(existingReview?.comment ?? "")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-border p-4 text-center space-y-2">
        <p className="text-sm text-muted-foreground">Inicia sessão para deixares uma avaliação.</p>
        <button
          onClick={() => void signIn("google")}
          className="text-sm text-primary hover:underline"
        >
          Iniciar sessão
        </button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-border p-4 text-center text-sm text-muted-foreground">
        Obrigado pela tua avaliação!
      </div>
    )
  }

  const handleSubmit = async () => {
    if (rating === 0) return
    setLoading(true)
    try {
      await trpc.review.create.mutate({
        barbershopId,
        rating,
        comment: comment.trim() || undefined,
      })
      toast.success("Avaliação enviada!")
      setSubmitted(true)
    } catch {
      toast.error("Erro ao enviar avaliação.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border p-4">
      <p className="text-sm font-semibold">
        {existingReview ? "Alterar avaliação" : "Avaliar barbearia"}
      </p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <StarIcon
              className={`h-7 w-7 ${star <= (hovered || rating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
            />
          </button>
        ))}
      </div>
      <textarea
        rows={2}
        placeholder="Comentário (opcional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background resize-none"
      />
      <button
        disabled={rating === 0 || loading}
        onClick={() => void handleSubmit()}
        className="w-full bg-primary text-primary-foreground rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? "A enviar..." : existingReview ? "Atualizar" : "Enviar avaliação"}
      </button>
    </div>
  )
}
