'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bell, ArrowDown, ArrowUp, Plus } from 'lucide-react'

type Alert = {
    id: string
    title: string
    message: string
    type: string
    createdAt: Date
}

export default function AlertsFeed({ alerts }: { alerts: Alert[] }) {
    if (alerts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Recent Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No recent alerts.</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center">
                    <Bell className="w-5 h-5 mr-2" /> Recent Alerts
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {alerts.map(alert => (
                    <div key={alert.id} className="flex items-start space-x-3 p-3 border-b last:border-0">
                        <div className={`mt-1 p-2 rounded-full ${alert.type === 'PRICE_CHANGE' ? 'bg-blue-100 text-blue-600' :
                                alert.type === 'SENTIMENT_DROP' ? 'bg-red-100 text-red-600' :
                                    'bg-green-100 text-green-600'
                            }`}>
                            {alert.type === 'PRICE_CHANGE' && <ArrowUp className="w-4 h-4" />}
                            {/* Note: Simplified icon, logic for up/down price requires more data, using generic arrow for change */}
                            {alert.type === 'SENTIMENT_DROP' && <ArrowDown className="w-4 h-4" />}
                            {alert.type === 'NEW_PRODUCT' && <Plus className="w-4 h-4" />}
                        </div>
                        <div>
                            <h4 className="font-medium text-sm">{alert.title}</h4>
                            <p className="text-xs text-muted-foreground">{alert.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {new Date(alert.createdAt).toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
