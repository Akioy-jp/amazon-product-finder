import { prisma } from '@/lib/prisma'

export interface CollectedProduct {
    name: string
    url: string
    price: number
    currency: string
}

export interface CollectedReviewSummary {
    averageRating: number
    reviewCount: number
    sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE'
    summary: string
}

export interface CollectionResult {
    competitorId: string
    products: CollectedProduct[]
    reviews: CollectedReviewSummary
}

// Simulation Helper
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomPrice = (base: number) => Math.round(base * (1 + (Math.random() * 0.2 - 0.1))) // +/- 10%

export class DataCollector {

    async collectForCompetitor(competitorId: string): Promise<CollectionResult> {
        const competitor = await prisma.competitor.findUnique({
            where: { id: competitorId },
            include: { market: true }
        })

        if (!competitor) throw new Error('Competitor not found')

        console.log(`Starting collection for ${competitor.name}...`)

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Simulated Logic based on Category/Market Context
        const products: CollectedProduct[] = []

        // Generate 3-5 mock products
        const productCount = randomInt(3, 5)
        for (let i = 0; i < productCount; i++) {
            products.push({
                name: `${competitor.name} Product ${String.fromCharCode(65 + i)}`,
                url: `https://example.com/product/${competitor.name.toLowerCase()}-${i}`,
                price: randomPrice(10000), // Base price ~10000
                currency: 'JPY'
            })
        }

        const reviews: CollectedReviewSummary = {
            averageRating: parseFloat((Math.random() * 2 + 3).toFixed(1)), // 3.0 - 5.0
            reviewCount: randomInt(50, 500),
            sentiment: Math.random() > 0.5 ? 'POSITIVE' : 'NEUTRAL',
            summary: `Customers generally like the lineup from ${competitor.name}, praising the durability and design.`
        }

        return {
            competitorId,
            products,
            reviews
        }
    }

    async saveResult(result: CollectionResult) {
        // Save Products and Prices
        for (const p of result.products) {
            // Check if product exists (simple check by name for this demo)
            let product = await prisma.product.findFirst({
                where: {
                    competitorId: result.competitorId,
                    name: p.name
                }
            })

            if (!product) {
                product = await prisma.product.create({
                    data: {
                        competitorId: result.competitorId,
                        name: p.name,
                        url: p.url,
                        currentPrice: p.price,
                        currency: p.currency
                    }
                })
                // New Product Alert
                await prisma.alert.create({
                    data: {
                        title: 'New Product Found',
                        message: `New product discovered: ${p.name}`,
                        type: 'NEW_PRODUCT'
                    }
                })
            } else {
                // Price Change Alert
                if (product.currentPrice && Math.abs((p.price - product.currentPrice) / product.currentPrice) > 0.05) {
                    await prisma.alert.create({
                        data: {
                            title: 'Price Change Detected',
                            message: `${product.name} price changed from ¥${product.currentPrice} to ¥${p.price}`,
                            type: 'PRICE_CHANGE'
                        }
                    })
                }

                await prisma.product.update({
                    where: { id: product.id },
                    data: { currentPrice: p.price }
                })
            }

            // Record Price Point
            await prisma.pricePoint.create({
                data: {
                    productId: product.id,
                    price: p.price,
                    currency: p.currency
                }
            })
        }

        // Save Reviews
        const prevReview = await prisma.reviewSummary.findFirst({
            where: { competitorId: result.competitorId },
            orderBy: { recordedAt: 'desc' }
        })

        if (prevReview && result.reviews.averageRating < prevReview.averageRating - 0.5) {
            await prisma.alert.create({
                data: {
                    title: 'Sentiment Drop Detected',
                    message: `Sentiment for ${result.competitorId} dropped from ${prevReview.averageRating.toFixed(1)} to ${result.reviews.averageRating.toFixed(1)}`,
                    type: 'SENTIMENT_DROP'
                }
            })
        }

        await prisma.reviewSummary.create({
            data: {
                competitorId: result.competitorId,
                averageRating: result.reviews.averageRating,
                reviewCount: result.reviews.reviewCount,
                sentiment: result.reviews.sentiment,
                summary: result.reviews.summary
            }
        })
    }
}
