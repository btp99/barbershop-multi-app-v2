"use client"

import { UploadButton } from "@uploadthing/react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { UploadCloudIcon, XIcon } from "lucide-react"

interface ImageUploadProps {
  endpoint: keyof OurFileRouter
  value: string
  onChange: (url: string) => void
  label?: string
}

export default function ImageUpload({ endpoint, value, onChange, label }: ImageUploadProps) {
  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}

      {value ? (
        <div className="group relative inline-block w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Imagem" className="h-28 w-full rounded-lg object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-1 right-1 rounded-full bg-destructive/90 p-1 opacity-0 transition-opacity group-hover:opacity-100"
          >
            <XIcon className="h-3 w-3 text-white" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/20 py-6">
          <UploadCloudIcon className="h-8 w-8 text-muted-foreground" />
          <UploadButton<OurFileRouter, typeof endpoint>
            endpoint={endpoint}
            onClientUploadComplete={(res) => {
              if (res[0]) onChange(res[0].ufsUrl)
            }}
            onUploadError={(err) => alert(`Erro ao carregar: ${err.message}`)}
            appearance={{
              button:
                "bg-foreground text-background text-sm font-medium px-4 py-2 rounded-lg hover:bg-foreground/90 transition-colors ut-uploading:opacity-60 ut-uploading:cursor-not-allowed",
              allowedContent: "text-muted-foreground text-xs mt-1",
            }}
            content={{
              button: "Selecionar imagem",
              allowedContent: "JPG, PNG, WebP — máx. 4 MB",
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">ou colar URL</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://..."
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  )
}
