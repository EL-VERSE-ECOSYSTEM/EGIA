import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

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

  if (error) throw new Error(`Unable to save todo: ${error.message}`)

  revalidatePath('/todos')
}

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: todos, error } = await supabase
    .from('todos')
    .select('id, name, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Unable to load todos: ${error.message}`)

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Todo List</h1>
      <form action={addTodo} className="mb-6 flex gap-2">
        <input
          name="name"
          required
          maxLength={280}
          placeholder="Add a todo"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
        />
        <button type="submit" className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white">
          Add
        </button>
      </form>
      <ul className="space-y-2">
        {todos?.map((todo) => (
          <li key={todo.id} className="p-3 bg-slate-100 rounded-lg shadow-sm font-semibold">{todo.name}</li>
        ))}
      </ul>
    </div>
  )
}
