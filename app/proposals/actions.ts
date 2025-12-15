'use server'

import { prisma } from "@/lib/prisma"
import { Analyzer } from "@/lib/agent/analyzer"
import { revalidatePath } from "next/cache"

export async function generateProposals() {
    const analyzer = new Analyzer()
    await analyzer.runGlobalAnalysis()
    revalidatePath('/proposals')
}

export async function getProposals() {
    return await prisma.proposal.findMany({
        include: {
            category: {
                include: {
                    market: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export async function deleteProposal(id: string) {
    await prisma.proposal.delete({
        where: { id }
    })
    revalidatePath('/proposals')
}
