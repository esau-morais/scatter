import { ConnectedAccounts } from "@/components/settings/connected-accounts";
import { ManageSubscription } from "@/components/settings/manage-subscription";

export default function SettingsPage() {
  return (
    <main className="relative z-10 mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account connections and preferences
        </p>
      </div>

      <div className="space-y-6">
        <ManageSubscription />
        <ConnectedAccounts />
      </div>
    </main>
  );
}
