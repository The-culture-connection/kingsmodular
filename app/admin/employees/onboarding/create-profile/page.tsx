'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserPlus, Plus, X, ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/toast-context'
import { useAuth } from '@/lib/auth-context'
import { collection, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

interface CustomField {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'email' | 'tel'
  required: boolean
}

interface FormData {
  email: string
  password: string
  name: string
  dateOfBirth: string
  hireDate: string
  startDate: string
  role: 'employee' | 'admin'
  [key: string]: string | 'employee' | 'admin' // For custom fields
}

export default function CreateEmployeeProfilePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { user: currentUser } = useAuth() // Get current admin user
  const [isLoading, setIsLoading] = useState(false)
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [showAddFieldModal, setShowAddFieldModal] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'date' | 'email' | 'tel'>('text')
  const [newFieldRequired, setNewFieldRequired] = useState(false)
  
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: '',
    dateOfBirth: '',
    hireDate: '',
    startDate: '',
    role: 'employee',
  })

  // Load custom fields from Firestore
  useEffect(() => {
    loadCustomFields()
  }, [])

  const loadCustomFields = async () => {
    try {
      const fieldsRef = collection(db, 'employeeFormFields')
      const snapshot = await getDocs(fieldsRef)
      const fields: CustomField[] = []
      snapshot.forEach((doc) => {
        const data = doc.data()
        // Only include fields that aren't deleted
        if (!data.deleted) {
          fields.push({ id: doc.id, ...data } as CustomField)
        }
      })
      // Sort by creation order (you could add a createdAt field for better sorting)
      setCustomFields(fields)
      
      // Initialize form data for custom fields
      const customData: { [key: string]: string } = {}
      fields.forEach((field) => {
        customData[field.id] = ''
      })
      setFormData((prev) => ({ ...prev, ...customData }))
    } catch (error: any) {
      console.error('Error loading custom fields:', error)
      showToast('Failed to load custom fields', 'error')
    }
  }

  const handleAddCustomField = async () => {
    if (!newFieldLabel.trim()) {
      showToast('Field label is required', 'error')
      return
    }

    try {
      const fieldId = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newField: CustomField = {
        id: fieldId,
        label: newFieldLabel.trim(),
        type: newFieldType,
        required: newFieldRequired,
      }

      // Save to Firestore
      const fieldRef = doc(db, 'employeeFormFields', fieldId)
      await setDoc(fieldRef, {
        label: newField.label,
        type: newField.type,
        required: newField.required,
        createdAt: serverTimestamp(),
      })

      // Add to local state
      setCustomFields([...customFields, newField])
      setFormData((prev) => ({ ...prev, [fieldId]: '' }))

      // Reset form
      setNewFieldLabel('')
      setNewFieldType('text')
      setNewFieldRequired(false)
      setShowAddFieldModal(false)

      showToast('Custom field added successfully', 'success')
    } catch (error: any) {
      console.error('Error adding custom field:', error)
      showToast('Failed to add custom field', 'error')
    }
  }

  const handleRemoveCustomField = async (fieldId: string) => {
    try {
      // Remove from Firestore
      const fieldRef = doc(db, 'employeeFormFields', fieldId)
      await setDoc(fieldRef, { deleted: true }, { merge: true })

      // Remove from local state
      setCustomFields(customFields.filter((f) => f.id !== fieldId))
      const newFormData = { ...formData }
      delete newFormData[fieldId]
      setFormData(newFormData)

      showToast('Custom field removed', 'success')
    } catch (error: any) {
      console.error('Error removing custom field:', error)
      showToast('Failed to remove custom field', 'error')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Validate required fields
      if (!formData.email || !formData.password || !formData.name || !formData.dateOfBirth || 
          !formData.hireDate || !formData.startDate) {
        showToast('Please fill in all required fields', 'error')
        setIsLoading(false)
        return
      }

      // Validate custom required fields
      for (const field of customFields) {
        if (field.required && !formData[field.id]) {
          showToast(`Please fill in required field: ${field.label}`, 'error')
          setIsLoading(false)
          return
        }
      }

      // Prepare custom fields data
      const customFieldsData: { [key: string]: string } = {}
      customFields.forEach((field) => {
        if (formData[field.id]) {
          customFieldsData[field.id] = formData[field.id]
        }
      })

      // Create employee via API route (uses Firebase Admin SDK, doesn't sign in)
      const response = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          dateOfBirth: formData.dateOfBirth,
          hireDate: formData.hireDate,
          startDate: formData.startDate,
          role: formData.role,
          customFields: customFieldsData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create employee profile')
      }

      showToast('Employee profile created successfully!', 'success')
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        name: '',
        dateOfBirth: '',
        hireDate: '',
        startDate: '',
        role: 'employee',
        ...customFields.reduce((acc, field) => ({ ...acc, [field.id]: '' }), {}),
      })

      // Redirect admin back to employee suite (admin stays authenticated as themselves)
      // The new employee account is created but admin doesn't switch to it
      setTimeout(() => {
        router.push('/admin/suites/employee')
      }, 1000)
    } catch (error: any) {
      console.error('Error creating employee profile:', error)
      if (error.code === 'auth/email-already-in-use') {
        showToast('This email is already registered', 'error')
      } else {
        showToast(error.message || 'Failed to create employee profile', 'error')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getInputType = (fieldType: string): string => {
    switch (fieldType) {
      case 'number':
        return 'number'
      case 'date':
        return 'date'
      case 'email':
        return 'email'
      case 'tel':
        return 'tel'
      default:
        return 'text'
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/suites/employee" className="text-accent hover:underline mb-2 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Employee Suite
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <UserPlus className="h-8 w-8 text-accent" />
              Create Employee Profile
            </h1>
            <p className="text-foreground/70">Add a new employee profile and create their authentication</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowAddFieldModal(true)}
            className="text-accent"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Fields
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-base border border-accent/20 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-2 bg-foreground/5 border border-accent/20 rounded-lg text-foreground focus:outline-none focus:border-accent"
              placeholder="employee@example.com"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Password <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-2 bg-foreground/5 border border-accent/20 rounded-lg text-foreground focus:outline-none focus:border-accent"
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-2 bg-foreground/5 border border-accent/20 rounded-lg text-foreground focus:outline-none focus:border-accent"
              placeholder="John Doe"
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Date of Birth <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              className="w-full px-4 py-2 bg-foreground/5 border border-accent/20 rounded-lg text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Hire Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Hire Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.hireDate}
              onChange={(e) => handleInputChange('hireDate', e.target.value)}
              className="w-full px-4 py-2 bg-foreground/5 border border-accent/20 rounded-lg text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Start Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              required
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className="w-full px-4 py-2 bg-foreground/5 border border-accent/20 rounded-lg text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Role <span className="text-red-400">*</span>
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="w-full px-4 py-2 bg-foreground/5 border border-accent/20 rounded-lg text-foreground focus:outline-none focus:border-accent"
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        {/* Custom Fields */}
        {customFields.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Additional Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customFields.map((field) => (
                <div key={field.id}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-foreground">
                      {field.label}
                      {field.required && <span className="text-red-400 ml-1">*</span>}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(field.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Remove field"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type={getInputType(field.type)}
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    className="w-full px-4 py-2 bg-foreground/5 border border-accent/20 rounded-lg text-foreground focus:outline-none focus:border-accent"
                    placeholder={`Enter ${field.label.toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/suites/employee')}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="bg-accent hover:bg-accent/90"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Employee Profile
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Add Field Modal */}
      {showAddFieldModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base border border-accent/20 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">Add Custom Field</h2>
              <button
                onClick={() => setShowAddFieldModal(false)}
                className="text-foreground/70 hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Field Label <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  className="w-full px-4 py-2 bg-foreground/5 border border-accent/20 rounded-lg text-foreground focus:outline-none focus:border-accent"
                  placeholder="e.g., Phone Number, Address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Field Type
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-foreground/5 border border-accent/20 rounded-lg text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="email">Email</option>
                  <option value="tel">Phone</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="required" className="text-sm text-foreground">
                  Required field
                </label>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddFieldModal(false)
                    setNewFieldLabel('')
                    setNewFieldType('text')
                    setNewFieldRequired(false)
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleAddCustomField}
                  className="bg-accent hover:bg-accent/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
