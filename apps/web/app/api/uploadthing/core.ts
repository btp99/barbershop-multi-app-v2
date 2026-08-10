import { createUploadthing, type FileRouter } from "uploadthing/next"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const f = createUploadthing()

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const user = session?.user as { isAdmin?: boolean } | undefined
  if (!user?.isAdmin) throw new Error("Sem permissão")
  return {}
}

export const uploadRouter = {
  shopImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(requireAdmin)
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),

  serviceImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(requireAdmin)
    .onUploadComplete(({ file }) => {
      return { url: file.ufsUrl }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof uploadRouter
