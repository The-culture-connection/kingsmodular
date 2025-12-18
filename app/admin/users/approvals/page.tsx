'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Modal, ModalFooter } from '@/components/ui/modal'
import { Select } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants'
import { UserRole } from '@/lib/types'
import { getPendingApprovals, approveUser, denyUser } from '@/lib/firebase/firestore'
import { useToast } from '@/lib/toast-context'
import { useAuth } from '@/lib/auth-context'

interface PendingUser {
  uid: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  companyName?: string
  createdAt: Date
}

export default function AdminApprovalsPage() {
  const { refreshUser } = useAuth()
  const { showToast } = useToast()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('field_staff')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPendingUsers()
  }, [])

  const loadPendingUsers = async () => {
    try {
      setIsLoading(true)
      const users = await getPendingApprovals()
      setPendingUsers(users.map((u) => ({
        uid: u.uid,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role as UserRole,
        companyName: u.companyName,
        createdAt: u.createdAt instanceof Date ? u.createdAt : new Date(u.createdAt),
      })))
    } catch (error: any) {
      showToast('Failed to load pending approvals', 'error')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (userId: string, role: UserRole) => {
    try {
      await approveUser(userId, role)
      showToast('User approved successfully', 'success')
      setIsModalOpen(false)
      setSelectedUser(null)
      await loadPendingUsers()
      await refreshUser()
    } catch (error: any) {
      showToast(error.message || 'Failed to approve user', 'error')
    }
  }

  const handleDeny = async (userId: string) => {
    try {
      await denyUser(userId)
      showToast('User denied', 'info')
      setIsModalOpen(false)
      setSelectedUser(null)
      await loadPendingUsers()
    } catch (error: any) {
      showToast(error.message || 'Failed to deny user', 'error')
    }
  }

  const openModal = (user: PendingUser) => {
    setSelectedUser(user)
    setSelectedRole(user.role)
    setIsModalOpen(true)
  }

  return (
    <ProtectedRoute allowedRoles={['office_admin']}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">User Approvals</h1>
          <p className="text-foreground/70">Review and approve pending user registrations</p>
        </div>

        {isLoading ? (
          <div className="bg-base border border-accent/20 rounded-lg shadow-sm p-12 text-center">
            <p className="text-foreground/70">Loading...</p>
          </div>
        ) : (
          <>
            <div className="bg-base border border-accent/20 rounded-lg shadow-sm">
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
                  {pendingUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-foreground/70 py-8">
                        No pending approvals
                      </TableCell>
                    </TableRow>
                  ) : (
                    pendingUsers.map((user) => (
                      <TableRow key={user.uid}>
                        <TableCell className="font-medium">
                          {user.firstName} {user.lastName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="info">{ROLE_LABELS[user.role]}</Badge>
                        </TableCell>
                        <TableCell>{user.companyName || 'N/A'}</TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title={`Review: ${selectedUser?.firstName} ${selectedUser?.lastName}`}
            >
              {selectedUser && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-foreground/70">Email</p>
                      <p className="font-medium">{selectedUser.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-foreground/70">Company</p>
                      <p className="font-medium">{selectedUser.companyName || 'N/A'}</p>
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
                      onClick={() => handleDeny(selectedUser.uid)}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Deny
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(selectedUser.uid, selectedRole)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </ModalFooter>
                </div>
              )}
            </Modal>
          </>
        )}
      </div>
    </ProtectedRoute>
  )
}