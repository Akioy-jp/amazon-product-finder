
import { getProposals } from './actions'
import ProposalView from './components/ProposalView'
import { Toaster } from "@/components/ui/sonner"

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProposalsPage() {
    const proposals = await getProposals()

    return (
        <div className="container mx-auto py-10">
            <ProposalView initialData={proposals} />
            <Toaster />
        </div>
    )
}
