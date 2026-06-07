import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import Credentials from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Mock authorization for development
        if (credentials.email === "admin@elgoodnews.edu.ng") {
          return { id: "1", name: "Admin", email: "admin@elgoodnews.edu.ng", role: "ADMIN" }
        }
        return null
      },
    }),
  ],
  callbacks: {
    async session({ session, user, token }) {
      if (session.user) {
        // Fetch role from DB
        const roleData = await prisma.userRole.findUnique({
          where: { userId: session.user.id }
        })
        session.user.role = roleData?.role || "STUDENT"
      }
      return session
    },
  },
})

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
    } & DefaultSession["user"]
  }
}
