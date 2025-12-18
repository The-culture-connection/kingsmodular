'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { useState } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import { UserRole, ROLE_LABELS } from '@/lib/constants'

// Mock data - replace with actual API call
const mockPendingUsers = [
  {
    id: '1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'project_manager' as UserRole,
    companyName: 'ABC Construction',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'field_staff' as UserRole,
    companyName: 'ABC Construction',
    createdAt: new Date('2024-01-16'),
  },
]

export default function AdminApprovalsPage() {
  const [selectedUser, setSelectedUser] = useState<typeof mockPendingUsers[0] | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('field_staff')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleApprove = async (userId: string, role: UserRole) => {
    // TODO: Implement approval API call
    console.log('Approving user', userId, 'with role', role)
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleDeny = async (userId: string) => {
    // TODO: Implement deny API call
    console.log('Denying user', userId)
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const openModal = (user: typeof mockPendingUsers[0]) => {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setIsModalOpen(true)
  }

  return (
    <ProtectedRoute allowedRoles={['office_admin']}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Approvals</h1>
          <p className="text-gray-600">Review and approve pending user registrations</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <Table dense>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Requested Role</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockPendingUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.firstName} {user.lastName}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant="info">{ROLE_LABELS[user.role]}</Badge>
                  </TableCell>
                  <TableCell>{user.companyName}</TableCell>
                  <TableCell>
                    {user.createdAt.toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openModal(user)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {mockPendingUsers.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <p className="text-gray-600">No pending approvals</p>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Review: ${selectedUser?.firstName} ${selectedUser?.lastName}`}
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Company</p>
                  <p className="font-medium">{selectedUser.companyName}</p>
                </div>
              </div>

              <Select
                label="Assign Role"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                options={Object.entries(ROLE_LABELS).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />

              <ModalFooter>
                <Button
                  variant="outline"
                  onClick={() => handleDeny(selectedUser.id)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Deny
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handleApprove(selectedUser.id, selectedRole)}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </ModalFooter>
            </div>
          )}
        </Modal>
      </div>
    </ProtectedRoute>
  )
}
