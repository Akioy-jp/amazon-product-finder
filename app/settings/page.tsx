import { getConfiguration } from './actions'
import ConfigurationForm from './components/ConfigurationForm'
import { Toaster } from "@/components/ui/sonner"

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
    const data = await getConfiguration()

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">System Configuration</h1>
            <ConfigurationForm initialData={data} />
            <Toaster />
        </div>
    )
}
