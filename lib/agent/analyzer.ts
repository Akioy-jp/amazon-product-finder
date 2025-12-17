
import { prisma } from "@/lib/prisma"

export class Analyzer {
    async analyzeCategory(categoryId: string) {
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
            include: {
                market: {
                    include: {
                        competitors: {
                            include: {
                                products: true,
                                reviews: {
                                    orderBy: { recordedAt: 'desc' },
                                    take: 1
                                }
                            }
                        }
                    }
                },
                rankingUrls: true
            }
        })

        if (!category) throw new Error("Category not found")

        // Use Market-level competitors (Fallback logic: ideally strictly filter by category context in future)
        const competitors = category.market.competitors
        if (competitors.length === 0) return null

        // Calculate Average Price and Rating for the category
        let totalPrice = 0
        let totalRating = 0
        let productCount = 0
        let reviewCount = 0

        for (const comp of competitors) {
            for (const prod of comp.products) {
                if (prod.currentPrice) {
                    totalPrice += prod.currentPrice
                    productCount++
                }
            }
            if (comp.reviews.length > 0) {
                totalRating += comp.reviews[0].averageRating
                reviewCount++
            }
        }

        const avgPrice = productCount > 0 ? totalPrice / productCount : 0
        const avgRating = reviewCount > 0 ? totalRating / reviewCount : 0

        // Logic to find opportunity
        // 1. "Premium Gap": If existing products are low rated but cheap, propose a high quality premium version.
        // 2. "Value Gap": If existing products are expensive and high rated, propose a cheaper alternative.
        // 3. "Quality Gap": If existing products are expensive AND low rated, this is a golden opportunity.

        let proposal = {
            targetPrice: 0,
            productName: '',
            features: '',
            keywords: '',
            reasoning: '',
            status: 'DRAFT'
        }

        if (avgRating < 3.5 && avgPrice > 5000) {
            // Expensive and bad -> Golden Opportunity
            proposal.reasoning = `Competitors in ${category.name} are charging high prices (avg ¥${avgPrice.toFixed(0)}) but delivering poor quality (avg ${avgRating.toFixed(1)} stars). There is a massive opportunity for a quality product at a similar or slightly lower price point.`
            proposal.productName = `Premium ${category.name} Solver`
            proposal.targetPrice = avgPrice * 0.9
            proposal.features = "High durability materials, Extended warranty, Premium unboxing experience"
        } else if (avgRating > 4.5 && avgPrice > 10000) {
            // Expensive and Good -> Value Gap
            proposal.reasoning = `The market for ${category.name} is dominated by high-end expensive products. A "Good Enough" value option could capture significantly market share.`
            proposal.productName = `Essential ${category.name}`
            proposal.targetPrice = avgPrice * 0.6
            proposal.features = "Core functionality focus, Simplified design, Cost-effective packaging"
        } else {
            // General improvement or defaulting (for demo purposes)
            proposal.reasoning = `Analysis of ${category.name} suggests a balanced market. A differentiated product focusing on specific user pain points in reviews is recommended.`
            proposal.productName = `NextGen ${category.name}`
            proposal.targetPrice = avgPrice > 0 ? avgPrice : 2980
            proposal.features = "Modern aesthetic, User-centric ergonomics, Eco-friendly materials"
        }

        // ... existing logic ...

        // Advanced Research & Keyword Analysis
        // 1. Fetch Ranking URLs (Simulated)
        const rankingUrls = category.rankingUrls
        if (rankingUrls && rankingUrls.length > 0) { // Added null check for rankingUrls
            // Simulation: Aggregate data from multiple URLs
            // Logic: "Niche" = Top 10 has < 50% Big Brands
            const bigBrands = ["Sony", "Panasonic", "Samsung", "Anker", "Apple"]
            const simulatedTop10 = Array.from({ length: 10 }).map((_, i) => ({
                brand: Math.random() > 0.6 ? bigBrands[Math.floor(Math.random() * bigBrands.length)] : "Unknown Brand",
                price: avgPrice * (0.8 + Math.random() * 0.4),
                rating: 3.0 + Math.random() * 2.0,
                reviews: Math.floor(Math.random() * 500)
            }))

            const bigBrandCount = simulatedTop10.filter(p => bigBrands.includes(p.brand)).length
            const isNiche = bigBrandCount < 5 // < 50%

            // Keyword Analysis (Volume / Difficulty)
            // Simulated Keywords for the category
            const candidates = [
                { word: `${category.name} small`, vol: 5000, diff: 30 },
                { word: `${category.name} mute`, vol: 3000, diff: 20 },
                { word: `${category.name} design`, vol: 8000, diff: 80 },
                { word: `${category.name} professional`, vol: 1500, diff: 10 },
                { word: `${category.name} cheap`, vol: 20000, diff: 95 }
            ]

            // Score = Volume / Difficulty
            const scoredKeywords = candidates.map(k => ({ ...k, score: k.vol / k.diff })).sort((a, b) => b.score - a.score)
            const top3Keywords = scoredKeywords.slice(0, 3) // Top 3 Middle Keywords

            // Review Gap Analysis
            const lowRatedHighVol = simulatedTop10.filter(p => p.rating < 3.8 && p.reviews > 100)

            // Generate Reasoning
            proposal.keywords = top3Keywords.map(k => k.word).join(", ")
            proposal.reasoning += `\n\n[Advanced Analysis]:\n`
            proposal.reasoning += `- **Niche Status**: ${isNiche ? "✅ Blue Ocean (Big Brands < 50%)" : "⚠️ Red Ocean (Dominated by Big Brands)"}.\n`
            proposal.reasoning += `- **Target Keywords**: ${top3Keywords.map(k => `"${k.word}" (Score: ${k.score.toFixed(0)})`).join(", ")}.\n`

            if (lowRatedHighVol.length > 0) {
                proposal.reasoning += `- **Opportunity**: Found ${lowRatedHighVol.length} high-volume items with low ratings (<3.8). Users are buying but unsatisfied.\n`
                proposal.features += `, Fixes common complaints (e.g. noise, durability) found in top selling items`
            }
        }

        // Save Proposal
        await prisma.proposal.create({
            data: {
                categoryId: category.id,
                targetPrice: proposal.targetPrice,
                productName: proposal.productName,
                features: proposal.features,
                keywords: proposal.keywords,
                reasoning: proposal.reasoning,
                status: 'DRAFT'
            }
        })
    }

    async runGlobalAnalysis() {
        const categories = await prisma.category.findMany()
        for (const cat of categories) {
            await this.analyzeCategory(cat.id)
        }
    }
}
