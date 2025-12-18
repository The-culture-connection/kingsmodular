import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

export default function AdminSettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-gray-600">Configure your account and company settings</p>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">General Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input label="Company Name" placeholder="Kings Modular" />
            <Input label="Email" type="email" placeholder="contact@kingsmodular.com" />
            <Input label="Phone" type="tel" placeholder="(555) 123-4567" />
            <Input label="Address" placeholder="123 Main St" />
            <Input label="City" placeholder="New York" />
            <Input label="State" placeholder="NY" />
            <Input label="ZIP Code" placeholder="10001" />
          </div>
          <div className="mt-6 flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold mb-6">Preferences</h2>
          <div className="space-y-4">
            <Select
              label="Time Zone"
              options={[
                { value: 'est', label: 'Eastern Time (EST)' },
                { value: 'cst', label: 'Central Time (CST)' },
                { value: 'mst', label: 'Mountain Time (MST)' },
                { value: 'pst', label: 'Pacific Time (PST)' },
              ]}
            />
            <Select
              label="Date Format"
              options={[
                { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY' },
                { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY' },
                { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD' },
              ]}
            />
          </div>
          <div className="mt-6 flex justify-end">
            <Button>Save Changes</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
