import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function DashboardRedirect() {
  const session = await auth()

  if (!session) {
    redirect("/sign-in")
  }

  const role = session.user.role

  switch (role) {
    case "ADMIN":
      redirect("/dashboard/admin/overview")
    case "TEACHER":
      redirect("/dashboard/teacher/overview")
    case "PARENT":
      redirect("/dashboard/parent/overview")
    case "STUDENT":
      redirect("/dashboard/student/overview")
    default:
      redirect("/")
  }
}
