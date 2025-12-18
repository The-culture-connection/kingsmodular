import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'

export default function CustomerProfilePage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile & Company Info</h1>
        <p className="text-gray-600">Manage your account and company information</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-6">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input label="First Name" placeholder="John" />
          <Input label="Last Name" placeholder="Doe" />
          <Input label="Email" type="email" placeholder="john@example.com" />
          <Input label="Phone" type="tel" placeholder="(555) 123-4567" />
        </div>

        <h2 className="text-xl font-semibold mb-6 mt-8">Company Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Input label="Company Name" placeholder="Acme Corp" />
          <Input label="Company Type" placeholder="Commercial" />
          <Input label="Address" placeholder="123 Main St" />
          <Input label="City" placeholder="New York" />
          <Input label="State" placeholder="NY" />
          <Input label="ZIP Code" placeholder="10001" />
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
