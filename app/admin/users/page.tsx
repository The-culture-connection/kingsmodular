import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TableFilters } from '@/components/admin/table-filters'
import { Badge } from '@/components/ui/badge'
import { Plus, Users } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants'

export default function AdminUsersPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Users & Permissions</h1>
          <p className="text-gray-600">Manage user accounts and access permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/users/approvals">
              View Pending Approvals
            </Link>
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <TableFilters
        searchPlaceholder="Search users..."
        onExport={() => console.log('Export users')}
        filters={[
          {
            id: 'role',
            label: 'Role',
            type: 'select',
            options: [
              { value: 'all', label: 'All Roles' },
              ...Object.entries(ROLE_LABELS).map(([value, label]) => ({
                value,
                label,
              })),
            ],
          },
        ]}
      />

      <div className="bg-white rounded-lg shadow-sm border">
        <Table dense>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                No users found.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
