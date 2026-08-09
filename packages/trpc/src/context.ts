export interface Context {
  user: { id: string; email: string; isAdmin: boolean } | null
}
