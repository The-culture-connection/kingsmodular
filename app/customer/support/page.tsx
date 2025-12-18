import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { HelpCircle, Mail, Phone } from 'lucide-react'

export default function CustomerSupportPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Support</h1>
        <p className="text-gray-600">Get help and contact support</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-6">Contact Support</h2>
            <form className="space-y-4">
              <Input label="Subject" placeholder="How can we help?" required />
              <Textarea
                label="Message"
                placeholder="Describe your issue or question..."
                rows={6}
                required
              />
              <Button type="submit" className="w-full sm:w-auto">
                Send Message
              </Button>
            </form>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Phone</h3>
            </div>
            <p className="text-gray-600">(555) 123-4567</p>
            <p className="text-sm text-gray-500 mt-1">Mon-Fri, 8AM-5PM EST</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Email</h3>
            </div>
            <p className="text-gray-600">support@kingsmodular.com</p>
            <p className="text-sm text-gray-500 mt-1">We'll respond within 24 hours</p>
          </div>
        </div>
      </div>
    </div>
  )
}
