'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, DollarSign, Star, Settings, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { triggerCollection } from '@/app/dashboard/actions'
import Link from 'next/link'

type DashboardData = {
    competitors: {
        id: string
        name: string
        productsCount: number
        avgPrice: number
        avgRating: number
        lastScan: Date | null
    }[]
    categories: {
        id: string
        name: string
        marketName: string
        rankingUrlCount: number
    }[]
}

export default function DashboardView({ initialData }: { initialData: DashboardData }) {
    const [data, setData] = useState(initialData)
    const [isScanning, setIsScanning] = useState(false)

    const handleScan = async () => {
        setIsScanning(true)
        toast.info('Starting competitive scan...')
        try {
            await triggerCollection()
            toast.success('Scan completed!')
            // In a real app we'd refresh data here, but revalidatePath in action handles the server reload.
            // We might need to router.refresh() if using client cache, but usually it works.
            // For now, let's just rely on the toast.
        } catch (error) {
            toast.error('Scan failed')
        } finally {
            setIsScanning(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button onClick={handleScan} disabled={isScanning}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
                        {isScanning ? 'Scanning...' : 'Scan Now'}
                    </Button>
                    <Link href="/settings">
                        <Button variant="outline">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Button>
                    </Link>
                    <Link href="/proposals">
                        <Button variant="default" className="bg-purple-600 hover:bg-purple-700">
                            <Sparkles className="mr-2 h-4 w-4" />
                            Proposals
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Competitors</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.competitors.length}</div>
                        <p className="text-xs text-muted-foreground">Active monitoring</p>
                    </CardContent>
                </Card>
                {/* Add more summary cards here */}
            </div>

            {/* Category Analysis Depth */}
            <h3 className="text-xl font-semibold mt-8">Category Analysis Depth</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.categories.map((cat) => (
                    <Card key={cat.id} className={cat.rankingUrlCount > 2 ? "border-green-500 border-l-4" : "border-yellow-500 border-l-4"}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">{cat.marketName} / {cat.name}</CardTitle>
                            <CardDescription>
                                Analysis Depth: <span className="font-bold">{cat.rankingUrlCount} URLs</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Market Logic:</span>
                                    {cat.rankingUrlCount > 2 ? (
                                        <div className="flex items-center text-green-600 font-medium">
                                            <Sparkles className="w-4 h-4 mr-1" /> Deep Niche
                                        </div>
                                    ) : (
                                        <div className="flex items-center text-yellow-600 font-medium">
                                            <Settings className="w-4 h-4 mr-1" /> Broad / Shallow
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                                    {cat.rankingUrlCount > 2
                                        ? "Good! Multiple ranking sources allow for precise 'Winning Product' detection."
                                        : "Tip: Add more sub-category ranking URLs to narrow down the target."}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <h3 className="text-xl font-semibold mt-8">Competitor Overview</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.competitors.map((comp) => (
                    <Card key={comp.id}>
                        <CardHeader>
                            <CardTitle>{comp.name}</CardTitle>
                            <CardDescription>
                                Last Scan: {comp.lastScan ? new Date(comp.lastScan).toLocaleString() : 'Never'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">Products Tracked</span>
                                    <span className="font-bold">{comp.productsCount}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <DollarSign className="w-4 h-4 mr-1" /> Avg Price
                                    </div>
                                    <span className="font-bold">¥{comp.avgPrice.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Star className="w-4 h-4 mr-1" /> Avg Rating
                                    </div>
                                    <span className="font-bold">{comp.avgRating.toFixed(1)} / 5.0</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
