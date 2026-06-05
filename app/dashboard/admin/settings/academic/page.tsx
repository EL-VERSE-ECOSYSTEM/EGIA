import { DashboardLayout } from '@/components/dashboard-layout'

export default function Page({ params }: { params: any }) {
  const role = 'admin';
  const title = 'Academic';

  return (
    <DashboardLayout role={role as any}>
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">{title}</h1>
        <p className="text-muted-foreground">
          Welcome to the {title} page. This is a placeholder for the admin dashboard.
        </p>
        <div className="mt-8 p-12 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground">
          Content for {title} will be implemented here.
        </div>
      </div>
    </DashboardLayout>
  )
}
