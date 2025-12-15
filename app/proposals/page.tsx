
import { getProposals } from './actions'
import ProposalView from './components/ProposalView'
import { Toaster } from "@/components/ui/sonner"

export default async function ProposalsPage() {
    const proposals = await getProposals()

    return (
        <div className="container mx-auto py-10">
            <ProposalView initialData={proposals} />
            <Toaster />
        </div>
    )
}
