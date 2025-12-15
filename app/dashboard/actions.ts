'use server'

import { DataCollector } from '@/lib/agent/collector'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function triggerCollection() {
    const collector = new DataCollector()
    const competitors = await prisma.competitor.findMany()

    const results = await Promise.all(
        competitors.map(async (comp: { name: string, id: string }) => {
            try {
                const result = await collector.collectForCompetitor(comp.id)
                await collector.saveResult(result)
                return { competitor: comp.name, status: 'success' }
            } catch (e) {
                console.error(`Collection failed for ${comp.name}`, e)
                return { competitor: comp.name, status: 'failed' }
            }
        })
    )

    revalidatePath('/dashboard')
    return results
}

export async function getDashboardData() {
    const competitors = await prisma.competitor.findMany({
        include: {
            products: true,
            reviews: {
                orderBy: { recordedAt: 'desc' },
                take: 1
            }
        }
    })

    const categories = await prisma.category.findMany({
        include: {
            rankingUrls: true,
            market: true
        }
    })

    return {
        competitors: competitors.map(c => ({
            id: c.id,
            name: c.name,
            productsCount: c.products.length,
            avgPrice: c.products.reduce((acc, p) => acc + (p.currentPrice || 0), 0) / (c.products.length || 1),
            avgRating: c.reviews.length > 0 ? c.reviews[0].averageRating : 0,
            lastScan: c.updatedAt
        })),
        categories: categories.map(c => ({
            id: c.id,
            name: c.name,
            marketName: c.market.name,
            rankingUrlCount: c.rankingUrls.length
        }))
    }
}
