import { router } from "./trpc"
import { barbershopRouter } from "./routers/barbershop"
import { bookingRouter } from "./routers/booking"
import { adminRouter } from "./routers/admin"
import { serviceRouter } from "./routers/service"
import { reviewRouter } from "./routers/review"
import { slotsRouter } from "./routers/slots"
import { clientRouter } from "./routers/client"
import { timeblockRouter } from "./routers/timeblock"
import { userRouter } from "./routers/user"

export const appRouter = router({
  barbershop: barbershopRouter,
  booking: bookingRouter,
  admin: adminRouter,
  service: serviceRouter,
  review: reviewRouter,
  slots: slotsRouter,
  client: clientRouter,
  timeblock: timeblockRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
