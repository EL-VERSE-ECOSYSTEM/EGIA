import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { auth } from '@/lib/auth'

export default async function LandingPage() {
  const session = await auth.getSession()
  const user = session?.user

  return (
    <div className="flex flex-col min-h-screen">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="/">
          <span className="font-bold text-xl text-amber-600">EL GOODNEWS Academy</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:text-amber-600 transition-colors" href="/about">About</Link>
          <Link className="text-sm font-medium hover:text-amber-600 transition-colors" href="/admissions">Admissions</Link>
          <Link className="text-sm font-medium hover:text-amber-600 transition-colors" href="/news">News</Link>
          <Link className="text-sm font-medium hover:text-amber-600 transition-colors" href="/contact">Contact</Link>
          <Link className="text-sm font-medium hover:text-amber-600 transition-colors" href="/results-checker">Results</Link>
        </nav>
        <div className="ml-4 flex gap-2">
          {user ? (
            <Link href="/dashboard-redirect">
              <Button className="bg-amber-600 hover:bg-amber-700 size-sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-in"><Button variant="outline" size="sm">Sign In</Button></Link>
              <Link href="/sign-up"><Button className="bg-amber-600 hover:bg-amber-700" size="sm">Register</Button></Link>
            </>
          )}
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-amber-500 via-amber-600 to-yellow-700">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center text-white">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                  EL GOODNEWS INTERNATIONAL ACADEMY
                </h1>
                <p className="mx-auto max-w-[800px] text-lg sm:text-xl md:text-2xl text-amber-100 font-light">
                  Nurturing excellence in academics, character, and leadership. Your child's future begins with a world-class foundation.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <Link href="/admissions">
                  <Button size="lg" className="bg-white text-amber-700 hover:bg-amber-50 font-bold px-8">
                    Enroll Your Ward
                  </Button>
                </Link>
                <Link href="/about">
                  <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 px-8">
                    Explore Our Mission
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 bg-slate-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Why Choose Us?</h2>
              <p className="text-muted-foreground mt-4 max-w-[600px] mx-auto">We combine traditional values with modern technology to provide a balanced learning environment.</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="flex flex-col items-center p-8 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600 font-bold text-xl">1</div>
                <h3 className="text-xl font-bold mb-2">Qualified Teachers</h3>
                <p className="text-sm text-muted-foreground text-center">Our faculty consists of experienced professionals dedicated to student success and mentorship.</p>
              </div>
              <div className="flex flex-col items-center p-8 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600 font-bold text-xl">2</div>
                <h3 className="text-xl font-bold mb-2">Advanced CBT System</h3>
                <p className="text-sm text-muted-foreground text-center">Students are prepared for the digital age with our state-of-the-art Computer Based Testing facilities.</p>
              </div>
              <div className="flex flex-col items-center p-8 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4 text-amber-600 font-bold text-xl">3</div>
                <h3 className="text-xl font-bold mb-2">Holistic Growth</h3>
                <p className="text-sm text-muted-foreground text-center">Beyond academics, we focus on sports, arts, and religious studies to build well-rounded individuals.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 bg-white border-t">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tighter">Academic Levels & Departments</h2>
                <p className="text-slate-600 text-lg">We offer comprehensive coverage for both Junior and Senior secondary education in Nigeria.</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-amber-700">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    Junior Secondary: JSS 1, JSS 2, JSS 3
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-amber-700">
                    <span className="w-2 h-2 bg-amber-500 rounded-full" />
                    Senior Secondary: Science, Arts, Commercial
                  </div>
                </div>
                <Link href="/admissions">
                  <Button className="bg-amber-600 hover:bg-amber-700 mt-4">View Admission Requirements</Button>
                </Link>
              </div>
              <div className="bg-slate-100 rounded-3xl aspect-video flex items-center justify-center overflow-hidden border-4 border-white shadow-xl">
                 <span className="text-slate-400 italic">Academy Campus Aerial View</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
