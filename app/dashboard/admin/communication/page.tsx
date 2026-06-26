import { redirect } from 'next/navigation'
export default function CommunicationIndex() {
  redirect('/dashboard/admin/communication/messages/inbox')
}
