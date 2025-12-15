'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Trash2, ArrowRight } from 'lucide-react'
import { generateProposals, deleteProposal } from '@/app/proposals/actions'
import { toast } from 'sonner'

type Proposal = {
    id: string
    productName: string
    targetPrice: number
    features: string
    keywords: string | null
    reasoning: string
    status: string
    createdAt: Date
    category: {
        name: string
        market: {
            name: string
        }
    }
}

export default function ProposalView({ initialData }: { initialData: Proposal[] }) {
    const [isGenerating, setIsGenerating] = useState(false)

    const handleGenerate = async () => {
        setIsGenerating(true)
        toast.info("Analyzing market gaps...")
        try {
            await generateProposals()
            toast.success("Analysis complete! New proposals generated.")
        } catch (e) {
            toast.error("Analysis failed")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Product Proposals</h2>
                    <p className="text-muted-foreground">AI-driven product concepts based on competitive gaps.</p>
                </div>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                    <Sparkles className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Analyzing...' : 'Generate Proposals'}
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                {initialData.map((proposal) => (
                    <Card key={proposal.id} className="flex flex-col border-l-4 border-l-primary">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <Badge variant="outline" className="mb-2">
                                        {proposal.category.market.name} / {proposal.category.name}
                                    </Badge>
                                    <CardTitle className="text-xl text-primary">{proposal.productName}</CardTitle>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => deleteProposal(proposal.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                            <CardDescription className="text-base font-medium">
                                Target Price: ¥{proposal.targetPrice.toLocaleString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div>
                                <h4 className="font-semibold mb-1 text-sm">Opportunity Logic</h4>
                                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                    {proposal.reasoning}
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-1 text-sm">Target Algorithm Keywords</h4>
                                <div className="flex flex-wrap gap-2">
                                    {proposal.keywords ? proposal.keywords.split(',').map((k, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs">
                                            {k.trim()}
                                        </Badge>
                                    )) : <span className="text-xs text-muted-foreground">No specific keywords identified.</span>}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-1 text-sm">Key Features</h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                    {proposal.features.split(',').map((f, i) => (
                                        <li key={i}>{f.trim()}</li>
                                    ))}
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" variant="secondary">
                                View Detail Strategy <ArrowRight className="ml-2 w-4 h-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            {initialData.length === 0 && (
                <div className="text-center py-20 bg-muted/30 rounded-lg border-dashed border-2">
                    <Sparkles className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Proposals Yet</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                        Click "Generate Proposals" to let the AI analyze your competitors and find market gaps.
                    </p>
                </div>
            )}
        </div>
    )
}
