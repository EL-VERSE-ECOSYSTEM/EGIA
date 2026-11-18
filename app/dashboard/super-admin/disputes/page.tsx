'use client'

import {useCallback,useEffect,useState} from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import {getSuperAdminDisputes,resolveDispute} from '@/app/actions/support'
import {useRealtimeSubscription} from '@/hooks/useRealtimeSubscription'
import {toast} from 'sonner'

export default function SuperAdminDisputesPage(){
  const [items,setItems]=useState<Awaited<ReturnType<typeof getSuperAdminDisputes>>>([])
  const [notes,setNotes]=useState<Record<string,string>>({})
  const load=useCallback(async()=>{try{setItems(await getSuperAdminDisputes())}catch(error){toast.error(error instanceof Error?error.message:'Unable to load disputes.')}},[])
  useEffect(()=>{void load()},[load])
  useRealtimeSubscription('dispute',()=>void load())
  useRealtimeSubscription('dispute_message',()=>void load())
  return <DashboardLayout role="super-admin"><main className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8"><header className="rounded-3xl bg-gradient-to-br from-slate-950 via-violet-950 to-indigo-950 p-8 text-white"><p className="text-xs font-black uppercase tracking-widest text-violet-300">Final review</p><h1 className="mt-2 text-3xl font-black">Dispute resolution desk</h1><p className="mt-2 text-sm text-white/70">School administrators can respond. Super Admins make the final closure decision.</p></header>
    {!items.length?<div className="rounded-2xl border border-dashed bg-white p-12 text-center text-slate-500">No disputes are waiting for review.</div>:items.map(item=><article key={item.id} className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm"><header className="flex flex-wrap justify-between gap-3"><div><h2 className="text-lg font-black">{item.title}</h2><p className="mt-1 text-xs text-slate-400">{item.ticketNumber} · {item.raisedBy?.name||item.raisedBy?.email||item.raisedById} · {item.raisedBy?.schoolId||'No school'}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{item.status}</span></header><p className="whitespace-pre-wrap text-sm text-slate-700">{item.description}</p>{item.messages.map(m=><div key={m.id} className="rounded-xl bg-slate-50 p-3 text-sm"><p>{m.message}</p><time className="text-xs text-slate-400">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</time></div>)}{item.resolution&&<p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><b>Current response:</b> {item.resolution}</p>}{item.status!=='RESOLVED'&&<div className="flex flex-col gap-2 sm:flex-row"><textarea value={notes[item.id]||''} onChange={e=>setNotes({...notes,[item.id]:e.target.value})} placeholder="Final resolution to share with the person who raised this" className="min-h-20 flex-1 rounded-xl border p-3 text-sm"/><button onClick={async()=>{try{await resolveDispute(item.id,notes[item.id]||'');toast.success('Dispute closed and the user notified.');setNotes({...notes,[item.id]:''});await load()}catch(error){toast.error(error instanceof Error?error.message:'Could not close dispute.')}}} className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white">Close dispute</button></div>}</article>)}</main></DashboardLayout>
}
