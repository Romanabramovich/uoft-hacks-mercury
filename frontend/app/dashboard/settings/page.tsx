import { PreferencesForm } from "@/components/dashboard/settings/preferences-form";

export default function SettingsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-white">Settings</h2>
                <p className="text-zinc-400">Manage your profile and application preferences.</p>
            </div>
            <PreferencesForm />
        </div>
    );
}
