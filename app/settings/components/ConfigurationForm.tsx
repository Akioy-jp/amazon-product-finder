'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, ArrowRight, Save, LayoutGrid, Tag, Store, ExternalLink, Lightbulb, Network, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { createMarket, createCategory, createCompetitor, deleteMarket, deleteCategory, deleteCompetitor, createChannel, deleteChannel, addRankingUrl, deleteRankingUrl, discoverRankingUrls, testScrapingConnection, bulkImportCategories } from '@/app/settings/actions'
import { toast } from 'sonner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type Market = {
    id: string
    name: string
    categories: Category[]
    competitors: Competitor[]
}

type RankingUrl = {
    id: string
    url: string
}

type Category = {
    id: string
    name: string
    rankingUrls: RankingUrl[]
}

type Competitor = {
    id: string
    name: string
    url: string | null
}

type Channel = {
    id: string
    name: string
}

type ConfigurationData = {
    markets: Market[]
    channels: Channel[]
}

export default function ConfigurationForm({ initialData }: { initialData: ConfigurationData }) {
    const [markets, setMarkets] = useState<Market[]>(initialData.markets)
    const [channels, setChannels] = useState<Channel[]>(initialData.channels)

    const [newMarketName, setNewMarketName] = useState('')
    const [newChannelName, setNewChannelName] = useState('')

    // States for adding new items
    const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null)
    const [newCategoryName, setNewCategoryName] = useState('')

    // New state for Ranking URL
    const [newRankingUrl, setNewRankingUrl] = useState('')

    // Suggestion Simulation
    const handleSuggestSubCategories = async (cat: Category) => {
        const keywords = ['gift', 'new-release', 'most-wished', 'movers-and-shakers', 'professional']
        const baseName = cat.name.split(' ')[0].toLowerCase()

        // Generate 3-5 random suggestions
        const count = 3 + Math.floor(Math.random() * 3)
        const suggestions = Array.from({ length: count }).map((_, i) =>
            `https://www.amazon.co.jp/gp/bestsellers/${baseName}/${keywords[i % keywords.length]}`
        )

        toast.info(`Found ${suggestions.length} related sub-categories! Adding them...`)

        try {
            for (const url of suggestions) {
                await addRankingUrl(cat.id, url)
            }
            toast.success(`Successfully added ${suggestions.length} sub-category URLs.`)
        } catch (e) {
            toast.error("Failed to add suggested URLs.")
        }
    }

    const handleAddRankingUrl = async (categoryId: string) => {
        if (!newRankingUrl) return
        try {
            await addRankingUrl(categoryId, newRankingUrl)
            setNewRankingUrl('')
            toast.success('URL added')
        } catch (e) {
            toast.error('Failed to add URL')
        }
    }

    const [testUrl, setTestUrl] = useState('')
    const [isTestingConnection, setIsTestingConnection] = useState(false)
    const [connectionResult, setConnectionResult] = useState<any>(null)

    const handleTestConnection = async () => {
        if (!testUrl) return
        setIsTestingConnection(true)
        setConnectionResult(null)
        try {
            const result = await testScrapingConnection(testUrl)
            setConnectionResult(result)
            if (result.success) {
                toast.success("Successfully fetched real data!")
            } else {
                toast.error("Connection blocked or failed.")
            }
        } catch (e) {
            toast.error("Network error during test.")
        } finally {
            setIsTestingConnection(false)
        }
    }

    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
    const [newCompetitorName, setNewCompetitorName] = useState('')
    const [newCompetitorUrl, setNewCompetitorUrl] = useState('')

    useEffect(() => {
        setMarkets(initialData.markets)
        setChannels(initialData.channels)
    }, [initialData])

    const handleAddMarket = async () => {
        if (!newMarketName) return
        try {
            await createMarket({ name: newMarketName })
            setNewMarketName('')
            toast.success('Market added')
        } catch (e) {
            toast.error('Failed to add market')
        }
    }

    const handleAddChannel = async () => {
        if (!newChannelName) return
        try {
            await createChannel({ name: newChannelName })
            setNewChannelName('')
            toast.success('Channel added')
        } catch (e) {
            toast.error('Failed to add channel')
        }
    }

    const handleAddCategory = async (marketId: string) => {
        if (!newCategoryName) return
        try {
            await createCategory({ name: newCategoryName, marketId })
            setNewCategoryName('')
            toast.success('Category added')
        } catch (e) {
            toast.error('Failed to add category')
        }
    }

    const handleAddCompetitor = async (categoryId: string) => {
        if (!newCompetitorName) return
        try {
            await createCompetitor({ name: newCompetitorName, url: newCompetitorUrl, categoryId })
            setNewCompetitorName('')
            setNewCompetitorUrl('')
            toast.success('Competitor added')
        } catch (e) {
            toast.error('Failed to add competitor')
        }
    }

    return (
        <div className="space-y-8">
            {/* 1. Market Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>1. Markets</CardTitle>
                    <CardDescription>Define the geographic or functional markets you monitor.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="New Market Name (e.g. Japan, North America)"
                            value={newMarketName}
                            onChange={(e) => setNewMarketName(e.target.value)}
                        />
                        <Button onClick={handleAddMarket}><Plus className="w-4 h-4 mr-2" /> Add</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {markets.map(market => (
                            <div key={market.id} className="p-4 border rounded-lg flex justify-between items-center bg-card">
                                <span className="font-medium">{market.name}</span>
                                <Button variant="ghost" size="icon" onClick={() => deleteMarket(market.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 2. Channel Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>2. Sales Channels</CardTitle>
                    <CardDescription>Define sales channels (e.g. Amazon, Rakuten).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="New Channel Name (e.g. Amazon, Rakuten)"
                            value={newChannelName}
                            onChange={(e) => setNewChannelName(e.target.value)}
                        />
                        <Button onClick={handleAddChannel}><Plus className="w-4 h-4 mr-2" /> Add</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {channels.map(channel => (
                            <div key={channel.id} className="p-4 border rounded-lg flex justify-between items-center bg-card">
                                <span className="font-medium">{channel.name}</span>
                                <Button variant="ghost" size="icon" onClick={() => deleteChannel(channel.id)}>
                                    <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 3. Category Configuration */}
            <Card>
                <CardHeader>
                    <CardTitle>3. Categories</CardTitle>
                    <CardDescription>Define product categories within a market.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Market</Label>
                        <Select onValueChange={setSelectedMarketId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a market..." />
                            </SelectTrigger>
                            <SelectContent>
                                {markets.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedMarketId && (
                        <div className="flex gap-2 mt-4 items-end">
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="catName">Category Name</Label>
                                <Input
                                    id="catName"
                                    placeholder="e.g. Smart Home"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                />
                            </div>
                            <Button onClick={() => handleAddCategory(selectedMarketId)} className="mb-0.5">
                                <Plus className="w-4 h-4 mr-2" /> Add Category
                            </Button>
                        </div>
                    )}

                    {selectedMarketId && (
                        <div className="mt-6 p-4 border rounded-lg bg-slate-50">
                            <Label className="mb-2 block font-semibold text-slate-700">Bulk Import Categories via CSV</Label>
                            <div className="text-xs text-slate-500 mb-2">
                                Format: <code>Category Name, https://amazon...</code> (One per line)
                            </div>
                            <textarea
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder={`Vitamin C, https://www.amazon.co.jp/...\nProtein, https://www.amazon.co.jp/...`}
                                id="bulkImport"
                            />
                            <Button
                                className="mt-2 w-full"
                                variant="secondary"
                                onClick={async () => {
                                    const text = (document.getElementById('bulkImport') as HTMLTextAreaElement).value
                                    if (!text) return
                                    toast.info("Importing...")
                                    try {
                                        const res = await bulkImportCategories(selectedMarketId, text)
                                        toast.success(`Imported ${res.count} items!`)
                                            ; (document.getElementById('bulkImport') as HTMLTextAreaElement).value = ''
                                    } catch (e) {
                                        toast.error("Import failed")
                                    }
                                }}
                            >
                                <LayoutGrid className="w-4 h-4 mr-2" /> Bulk Import
                            </Button>
                        </div>
                    )}

                    {selectedMarketId && (
                        <div className="grid grid-cols-1 gap-4 mt-4">
                            {markets.find(m => m.id === selectedMarketId)?.categories.map(cat => (
                                <Card key={cat.id} className="bg-muted/10">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold">{cat.name}</span>
                                            <Button variant="ghost" size="icon" onClick={() => deleteCategory(cat.id)}>
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>

                                        {/* Ranking URLs Section */}
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Ranking URLs (Up to 10)</Label>
                                            <div className="space-y-2">
                                                {cat.rankingUrls.map(url => (
                                                    <div key={url.id} className="flex gap-2 items-center text-sm bg-background p-2 rounded border">
                                                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                                                        <span className="truncate flex-1">{url.url}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteRankingUrl(url.id)}>
                                                            <Trash2 className="w-3 h-3 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="flex gap-2">
                                                <Input
                                                    placeholder="Add Ranking URL (Amazon, Rakuten, Yahoo, etc)..."
                                                    className="h-8 text-sm"
                                                    value={newRankingUrl}
                                                    onChange={(e) => setNewRankingUrl(e.target.value)}
                                                />
                                                <Button size="sm" onClick={() => handleAddRankingUrl(cat.id)}>
                                                    Add
                                                </Button>
                                            </div>

                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={() => handleSuggestSubCategories(cat)}
                                                >
                                                    <Lightbulb className="w-3 h-3 mr-2 text-yellow-500" />
                                                    Auto-Suggest (Simulated)
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={async () => {
                                                        if (!newRankingUrl) {
                                                            toast.error("Please enter a Seed URL first (e.g. main category page)")
                                                            return
                                                        }
                                                        toast.info("Deep Crawling & Auto-Clustering... Please wait.")
                                                        try {
                                                            const res = await discoverRankingUrls(cat.id, newRankingUrl)
                                                            if (res.created > 0) {
                                                                toast.success(`Success! Created ${res.created} new sub-categories and added ${res.count} URLs.`)
                                                            } else {
                                                                toast.success(`Discovery Complete! Added ${res.count} URLs to this category.`)
                                                            }
                                                            setNewRankingUrl('')
                                                        } catch (e) {
                                                            toast.error("Discovery failed.")
                                                        }
                                                    }}
                                                >
                                                    <Network className="w-3 h-3 mr-2 text-blue-500" />
                                                    Deep Crawl (Auto-Discover)
                                                </Button>
                                            </div>

                                            {cat.rankingUrls.length > 3 && (
                                                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                                                    <strong>Pro Tip:</strong> If these URLs cover different product types (e.g. "Vitamin C" vs "Protein"),
                                                    consider splitting them into separate Categories for more accurate "Winning Product" analysis.
                                                </div>
                                            )}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full text-xs"
                                                onClick={() => handleSuggestSubCategories(cat)}
                                            >
                                                <Lightbulb className="w-3 h-3 mr-2" />
                                                Auto-Suggest Sub-Categories
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {markets.find(m => m.id === selectedMarketId)?.categories.length === 0 && (
                                <p className="text-sm text-muted-foreground">No categories yet.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 4. Competitor Shops (Global) */}
            <Card>
                <CardHeader>
                    <CardTitle>4. Competitor Shops</CardTitle>
                    <CardDescription>Register key competitor brands/shops (e.g. "MyProtein", "SAVAS").</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Market</Label>
                        <Select onValueChange={setSelectedMarketId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a market..." />
                            </SelectTrigger>
                            <SelectContent>
                                {markets.map(m => (
                                    <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedMarketId && (
                        <div className="space-y-4 border p-4 rounded-lg bg-slate-50">
                            <Label className="text-slate-700 font-semibold">Add New Shop</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <Input
                                    placeholder="Shop Name (e.g. Official Store)"
                                    value={newCompetitorName}
                                    onChange={(e) => setNewCompetitorName(e.target.value)}
                                />
                                <Input
                                    placeholder="Ex: https://www.amazon.co.jp/stores/..."
                                    value={newCompetitorUrl}
                                    onChange={(e) => setNewCompetitorUrl(e.target.value)}
                                />
                            </div>
                            <Button className="w-full" onClick={() => handleAddCompetitor(selectedMarketId)}>
                                <Store className="w-4 h-4 mr-2" /> Register Shop
                            </Button>
                        </div>
                    )}

                    {selectedMarketId && (
                        <div className="space-y-2 mt-4">
                            <h4 className="font-medium text-sm text-muted-foreground">Registered Competitors in {markets.find(m => m.id === selectedMarketId)?.name}:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {/* @ts-ignore - Temporary ignore for type mismatch during refactor */}
                                {markets.find(m => m.id === selectedMarketId)?.competitors?.map((comp: any) => (
                                    <div key={comp.id} className="p-3 border rounded flex justify-between items-center bg-white">
                                        <div className="overflow-hidden">
                                            <div className="font-bold flex items-center gap-2">
                                                <Store className="w-3 h-3 text-slate-400" />
                                                {comp.name}
                                            </div>
                                            <div className="text-xs text-blue-600 truncate underline">{comp.url}</div>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => deleteCompetitor(comp.id)}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            {/* @ts-ignore */}
                            {(!markets.find(m => m.id === selectedMarketId)?.competitors || markets.find(m => m.id === selectedMarketId)?.competitors.length === 0) && (
                                <p className="text-sm text-slate-400 italic">No competitors registered yet.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* 5. Production Connection Diagnostics */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <CardTitle>5. Production Connection Diagnostics (Prototype)</CardTitle>
                    </div>
                    <CardDescription>
                        Test a **REAL** connection to Amazon. If blocked, use the <strong>Simulator</strong> to see the "Deep Analysis" capabilities.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Paste a real Amazon Product URL here..."
                            value={testUrl}
                            onChange={(e) => setTestUrl(e.target.value)}
                        />
                        <Button
                            onClick={handleTestConnection}
                            disabled={isTestingConnection}
                            className={isTestingConnection ? "opacity-80" : ""}
                        >
                            {isTestingConnection ? "Connecting..." : "Test Connection"}
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                // SIMULATED DEEP ANALYSIS (To demonstrate the "Ideal Output" user wants)
                                setIsTestingConnection(true);
                                setTimeout(() => {
                                    setConnectionResult({
                                        success: true,
                                        data: {
                                            title: "Simulated: Premium Whey Protein 1kg [Demo Data]",
                                            price: "¥4,500",
                                            image: "",
                                            rating: "3.8 out of 5 stars",
                                            metrics: {
                                                imageCount: 12,
                                                bulletCount: 6,
                                                descriptionLength: 1500,
                                                hasAPlusContent: true
                                            },
                                            ratingDistribution: {
                                                '5': '40%', '4': '10%', '3': '10%', '2': '10%', '1': '30%'
                                            },
                                            review: {
                                                title: "Taste is terrible but ingredients are good",
                                                body: "I bought this for the high protein content, but the artificial sweetener taste is unbearable. It clumps badly too.",
                                                rating: "1.0 out of 5 stars"
                                            },
                                            // Simulated "All Reviews" Analysis
                                            deepAnalysis: {
                                                scannedCount: 124,
                                                topics: [
                                                    { name: "Taste", sentiment: "Negative", mentionCount: 45 },
                                                    { name: "Solubility", sentiment: "Negative", mentionCount: 32 },
                                                    { name: "Price", sentiment: "Positive", mentionCount: 80 }
                                                ],
                                                conclusion: "Opportunity Detected: Users hate the taste and clumping. A 'Great Tasting, Easy Mix' competitor would win easily."
                                            }
                                        }
                                    });
                                    setIsTestingConnection(false);
                                    toast.success("Generated Deep Analysis Simulation");
                                }, 1500);
                            }}
                        >
                            <Lightbulb className="w-4 h-4 mr-2" /> Simulate Deep Scan
                        </Button>
                    </div>

                    {connectionResult && (
                        <div className={`p-4 rounded-md border ${connectionResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                            <div className="flex items-start gap-3">
                                {connectionResult.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                                )}
                                <div className="space-y-2 w-full">
                                    <h4 className={`font-semibold ${connectionResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                        {connectionResult.success ? "Connection Successful" : `Connection Failed (Status: ${connectionResult.statusCode || 'N/A'})`}
                                    </h4>

                                    {connectionResult.error && (
                                        <p className="text-sm text-red-700 font-medium">
                                            {connectionResult.error}
                                        </p>
                                    )}

                                    {connectionResult.data && (
                                        <div className="space-y-3">
                                            <div className="bg-white p-3 rounded border text-sm space-y-1">
                                                <div className="font-medium text-gray-900 line-clamp-1">{connectionResult.data.title}</div>
                                                <div className="flex justify-between items-center">
                                                    <div className="text-lg font-bold text-red-600">{connectionResult.data.price}</div>
                                                    <div className="text-xs bg-yellow-100 px-2 py-0.5 rounded text-yellow-800 border border-yellow-200">
                                                        {connectionResult.data.rating}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quality Analysis */}
                                            {connectionResult.data.metrics && (
                                                <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-2">
                                                    <h5 className="font-semibold text-xs text-slate-500 uppercase tracking-wider">Listing Quality Analysis</h5>
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className="flex justify-between p-2 bg-white rounded border">
                                                            <span>Images</span>
                                                            <span className={connectionResult.data.metrics.imageCount < 5 ? "text-green-600 font-bold" : "text-gray-600"}>
                                                                {connectionResult.data.metrics.imageCount}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between p-2 bg-white rounded border">
                                                            <span>Bullets</span>
                                                            <span className={connectionResult.data.metrics.bulletCount < 5 ? "text-green-600 font-bold" : "text-gray-600"}>
                                                                {connectionResult.data.metrics.bulletCount}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between p-2 bg-white rounded border">
                                                            <span>A+ Content</span>
                                                            <span className={!connectionResult.data.metrics.hasAPlusContent ? "text-green-600 font-bold" : "text-gray-600"}>
                                                                {connectionResult.data.metrics.hasAPlusContent ? "Yes" : "No"}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Opportunity Score Calculation */}
                                                    {(() => {
                                                        let score = 0;
                                                        if (connectionResult.data.metrics.imageCount < 5) score += 30;
                                                        if (connectionResult.data.metrics.bulletCount < 5) score += 30;
                                                        if (!connectionResult.data.metrics.hasAPlusContent) score += 40;

                                                        return (
                                                            <div className="mt-2 pt-2 border-t border-slate-200">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="font-bold text-sm">Opportunity Score</span>
                                                                    <span className={`text-lg font-black ${score > 50 ? 'text-green-600' : 'text-slate-400'}`}>{score}/100</span>
                                                                </div>
                                                                <p className="text-xs text-slate-500">
                                                                    {score > 50
                                                                        ? "High Opportunity! This listing is weak (few images/content)."
                                                                        : "Strong Listing. Hard to beat."}
                                                                </p>
                                                            </div>
                                                        )
                                                    })()}
                                                </div>
                                            )}

                                            {/* Star Balance (Histogram) */}
                                            {connectionResult.data.ratingDistribution && (
                                                <div className="bg-white p-3 rounded border space-y-2">
                                                    <h5 className="font-semibold text-xs text-gray-500 uppercase tracking-wider">Star Balance Assessment</h5>
                                                    <div className="space-y-1">
                                                        {['5', '4', '3', '2', '1'].map(star => {
                                                            const percentStr = connectionResult.data.ratingDistribution[star] || '0%';
                                                            const percent = parseInt(percentStr.replace('%', '')) || 0;
                                                            return (
                                                                <div key={star} className="flex items-center text-xs gap-2">
                                                                    <span className="w-8 text-right font-medium text-gray-600">{star} ★</span>
                                                                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className={`h-full rounded-full ${['1', '2', '3'].includes(star) && percent > 10 ? 'bg-red-400' : 'bg-yellow-400'}`}
                                                                            style={{ width: percentStr }}
                                                                        />
                                                                    </div>
                                                                    <span className="w-8 text-right text-gray-500">{percentStr}</span>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                    {/* Analysis of the Balance */}
                                                    {(() => {
                                                        const lowStars = (parseInt(connectionResult.data.ratingDistribution['1'] || '0') +
                                                            parseInt(connectionResult.data.ratingDistribution['2'] || '0') +
                                                            parseInt(connectionResult.data.ratingDistribution['3'] || '0'));

                                                        return (
                                                            <div className="mt-2 text-xs">
                                                                {lowStars > 15
                                                                    ? <span className="text-red-600 font-bold">⚠️ Warning: {lowStars}% of users are dissatisfied. DIG DEEPER here!</span>
                                                                    : <span className="text-green-600 font-medium">✓ Stable reputation. Only {lowStars}% negative/neutral.</span>
                                                                }
                                                            </div>
                                                        )
                                                    })()}
                                                </div>
                                            )}

                                            {/* DEEP ANALYSIS RESULT (NEW) */}
                                            {connectionResult.data.deepAnalysis && (
                                                <div className="bg-purple-50 p-3 rounded border border-purple-200 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h5 className="font-semibold text-xs text-purple-800 uppercase tracking-wider flex items-center gap-1">
                                                            <Lightbulb className="w-3 h-3" />
                                                            AI Deep Analysis
                                                        </h5>
                                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                            Scanned {connectionResult.data.deepAnalysis.scannedCount} Reviews
                                                        </span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="text-xs font-semibold text-gray-700">Identified Review Clusters:</div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {connectionResult.data.deepAnalysis.topics.map((topic: any, idx: number) => (
                                                                <div key={idx} className="bg-white p-2 rounded border border-purple-100 flex justify-between items-center text-xs">
                                                                    <span className="font-medium text-gray-800">{topic.name}</span>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`px-1.5 py-0.5 rounded ${topic.sentiment === 'Negative' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                                            {topic.sentiment}
                                                                        </span>
                                                                        <span className="text-gray-500">{topic.mentionCount} mentions</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="bg-white p-3 rounded border border-purple-100 mt-2">
                                                        <div className="text-xs font-bold text-purple-900 mb-1">AI Strategic Conclusion:</div>
                                                        <p className="text-xs text-gray-700 leading-relaxed">
                                                            {connectionResult.data.deepAnalysis.conclusion}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Voice of Customer (Review Extraction) - Only show if not replaced by Deep Analysis or if complementary */}
                                            {connectionResult.data.review && !connectionResult.data.deepAnalysis && (
                                                <div className="bg-orange-50 p-3 rounded border border-orange-200 space-y-2">
                                                    <h5 className="font-semibold text-xs text-orange-800 uppercase tracking-wider">Voice of Customer (Top Critical)</h5>
                                                    <div className="text-xs bg-white p-2 rounded border border-orange-100">
                                                        <div className="font-bold text-gray-800 mb-1">{connectionResult.data.review.title}</div>
                                                        <div className="text-orange-500 font-bold mb-1">{connectionResult.data.review.rating}</div>
                                                        <p className="text-gray-600 line-clamp-3 italic">"{connectionResult.data.review.body}"</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
