import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function addTodo(formData: FormData) {
  'use server'

  const name = String(formData.get('name') ?? '').trim()
  if (!name) return

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('You must be signed in to add a todo.')

  const { error } = await supabase.from('todos').insert({
    name: name.slice(0, 280),
    user_id: user.id,
  })

  if (error) {
    console.error('Failed to insert todo:', error)
    throw new Error('Unable to save todo. Please try again.')
  }

  revalidatePath('/todos')
}

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="p-4 bg-slate-100 rounded-2xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700 mb-3">Please sign in to view and manage your todos.</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <LogIn size={16} /> Sign In
          </Link>
        </div>
      </div>
    )
  }

  const { data: todos, error } = await supabase
    .from('todos')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching todos:', error)
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-4">
        <div className="p-6 bg-red-50 rounded-2xl border border-red-200 text-red-700 space-y-3">
          <AlertCircle size={28} className="mx-auto text-red-500" />
          <p className="text-sm font-bold">Unable to load your todo list at this time.</p>
          <Link
            href="/todos"
            className="inline-flex items-center gap-1.5 bg-red-600 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl hover:bg-red-700 transition-colors"
          >
            <RefreshCw size={14} /> Retry
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      <form action={addTodo} className="mb-6 flex gap-2">
        <input
          name="name"
          required
          maxLength={280}
          placeholder="Add a todo"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white text-sm hover:bg-slate-800 transition-colors">
          Add
        </button>
      </form>
      {todos && todos.length > 0 ? (
        <ul className="space-y-2">
          {todos.map((todo) => (
            <li key={todo.id} className="p-3 bg-slate-100 rounded-lg shadow-sm font-semibold text-sm text-slate-800">
              {todo.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-slate-400 text-sm italic text-center py-4">No todos yet. Add one above!</p>
      )}
    </div>
  )
}
