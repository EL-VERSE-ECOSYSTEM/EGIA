import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-slate-50">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-slate-900 mb-8">
          Welcome to <span className="text-amber-600">EL GOODNEWS Academy</span>
        </h1>

        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
           {user ? (
             <div className="text-center">
                <p className="text-xl mb-4">Hello, <span className="font-bold">{user.email}</span></p>
                <div className="flex gap-4 justify-center">
                   <Link href="/dashboard-redirect">
                     <Button size="lg" className="bg-amber-600 hover:bg-amber-700 h-16 px-10 rounded-2xl font-black text-lg">
                        Go to Dashboard
                     </Button>
                   </Link>
                </div>
             </div>
           ) : (
             <div className="flex gap-6">
                <Link href="/sign-in">
                  <Button variant="outline" size="lg" className="h-16 px-10 rounded-2xl font-bold border-2">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white h-16 px-10 rounded-2xl font-black text-lg">
                    Join Academy
                  </Button>
                </Link>
             </div>
           )}
        </div>
      </main>
    </div>
  )
}
