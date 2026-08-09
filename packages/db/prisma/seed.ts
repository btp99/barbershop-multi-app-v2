import { config } from "dotenv"
config({ path: "../../apps/api/.env" })

import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    // ── Barbershop ──────────────────────────────────────────────────────────
    const barbershop = await prisma.barbershop.upsert({
      where: { id: "mens-glamour" },
      update: {},
      create: {
        id: "mens-glamour",
        name: "MEN'S GLAMOUR",
        address: "Avenida Da Liberdade, 44, 3570-018, Aguiar da Beira",
        phones: ["960 111 222"],
        description:
          "Barbearia moderna com profissionais qualificados. Ambiente climatizado, Wi-Fi gratuito e estacionamento disponível.",
        imageUrl:
          "https://utfs.io/f/c97a2dc9-cf62-468b-a851-bfd2bdde775f-16p.png",
        amenities: [
          "Wi-Fi Gratuito",
          "Produtos Premium",
          "Ambiente Climatizado",
        ],
      },
    })

    // ── Business Hours ──────────────────────────────────────────────────────
    const hoursData = [
      { dayOfWeek: 0, closed: true },
      { dayOfWeek: 1, closed: true },
      {
        dayOfWeek: 2,
        morningOpen: "09:00",
        morningClose: "12:30",
        afternoonOpen: "14:00",
        afternoonClose: "18:00",
      },
      {
        dayOfWeek: 3,
        morningOpen: "09:00",
        morningClose: "12:30",
        afternoonOpen: "14:00",
        afternoonClose: "18:00",
      },
      {
        dayOfWeek: 4,
        morningOpen: "09:00",
        morningClose: "12:30",
        afternoonOpen: "14:00",
        afternoonClose: "18:00",
      },
      {
        dayOfWeek: 5,
        morningOpen: "09:00",
        morningClose: "12:30",
        afternoonOpen: "14:00",
        afternoonClose: "20:00",
      },
      { dayOfWeek: 6, morningOpen: "09:00", morningClose: "13:00" },
    ]

    for (const h of hoursData) {
      const existing = await prisma.businessHours.findFirst({
        where: { barbershopId: barbershop.id, dayOfWeek: h.dayOfWeek },
      })
      if (!existing) {
        await prisma.businessHours.create({
          data: { barbershopId: barbershop.id, ...h },
        })
      }
    }

    // ── Services ────────────────────────────────────────────────────────────
    const DEFAULT_IMAGE =
      "https://utfs.io/f/0ddfbd26-a424-43a0-aaf3-c3f1dc6be6d1-1kgxo7.png"

    const services = [
      {
        id: "svc-1",
        name: "Corte clássico",
        description: "Corte tradicional com acabamento perfeito.",
        price: 7,
        duration: 45,
        popular: true,
      },
      {
        id: "svc-2",
        name: "Corte fade / Degradê",
        description: "Degradê moderno com transição suave.",
        price: 9,
        duration: 75,
        popular: true,
      },
      {
        id: "svc-3",
        name: "Corte clássico + barba limpeza e contorno",
        description: "Combo completo: corte e barba tratada.",
        price: 12,
        duration: 90,
        popular: true,
      },
      {
        id: "svc-4",
        name: "Corte a máquina pente único",
        description: "Corte rápido e uniforme à máquina.",
        price: 5,
        duration: 25,
        popular: false,
      },
      {
        id: "svc-5",
        name: "Barba máquina",
        description: "Modelação de barba com máquina.",
        price: 5,
        duration: 45,
        popular: false,
      },
      {
        id: "svc-6",
        name: "Barba limpeza e contorno",
        description: "Limpeza e definição de contornos da barba.",
        price: 5,
        duration: 45,
        popular: false,
      },
      {
        id: "svc-7",
        name: "Aparar a barba",
        description: "Aparagem rápida para manter o estilo.",
        price: 2,
        duration: 15,
        popular: false,
      },
      {
        id: "svc-8",
        name: "Corte degradê + barba",
        description: "Degradê com barba totalmente tratada.",
        price: 14,
        duration: 120,
        popular: false,
      },
      {
        id: "svc-9",
        name: "Corte a máquina + barba",
        description: "Corte à máquina com barba incluída.",
        price: 10,
        duration: 75,
        popular: false,
      },
      {
        id: "svc-10",
        name: "Corte degradê + aparar a barba",
        description: "Degradê com aparagem de barba.",
        price: 11,
        duration: 85,
        popular: false,
      },
      {
        id: "svc-11",
        name: "Corte clássico + aparar a barba",
        description: "Corte clássico com aparagem de barba.",
        price: 9,
        duration: 60,
        popular: false,
      },
    ]

    for (const svc of services) {
      await prisma.barbershopService.upsert({
        where: { id: svc.id },
        update: {
          name: svc.name,
          price: svc.price,
          duration: svc.duration,
          popular: svc.popular,
        },
        create: {
          ...svc,
          imageUrl: DEFAULT_IMAGE,
          barbershopId: barbershop.id,
        },
      })
    }

    console.log("Seed concluído com sucesso!")
  } catch (error) {
    console.error("Erro no seed:", error)
    throw error
  } finally {
    await pool.end()
  }
}

main().catch(() => process.exit(1))
