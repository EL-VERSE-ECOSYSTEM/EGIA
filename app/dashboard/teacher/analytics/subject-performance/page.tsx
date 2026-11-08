import DashboardLayout from '@/components/layout/dashboard-layout'

export const dynamic = 'force-dynamic'

export default function Page() {
  const title = 'Subject Performance';

  return (
    <DashboardLayout role="teacher">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground">
          Welcome to the {title} page. This is a placeholder for the teacher dashboard.
        </p>
        <div className="mt-8 p-12 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground">
          Content for {title} will be implemented here.
        </div>
      </div>
    </DashboardLayout>
  )
}
