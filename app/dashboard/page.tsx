import { prisma } from '@/lib/prisma'
import DashboardView from './components/DashboardView'
import AlertsFeed from './components/AlertsFeed'
import { Toaster } from "@/components/ui/sonner"
import { getDashboardData } from './actions'

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
    const dashboardData = await getDashboardData()

    // Fetch recent alerts
    const alerts = await prisma.alert.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    })

    return (
        <div className="container mx-auto py-10 space-y-8">
            <DashboardView initialData={dashboardData} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-3">
                    <AlertsFeed alerts={alerts} />
                </div>
            </div>
            <Toaster />
        </div>
    )
}
