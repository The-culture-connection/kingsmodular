'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Briefcase,
  Plus,
  Camera,
  Calendar,
  Filter,
  Search,
  X,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Copy,
  Download,
  FileText,
  MapPin,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  BarChart3,
  ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusSelect } from '@/components/ui/status-select'
import { DatePicker } from '@/components/ui/date-picker'
import { JobActionsMenu } from '@/components/ui/job-actions-menu'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/lib/toast-context'
import { getAllJobs, TransformedJob, getEstimateById, updateJobStatus, deleteJob, duplicateJob, updateJobData } from '@/lib/firebase/jobs'
import { getAllMaterials, addMaterial, Material } from '@/lib/firebase/materials'
import { getAllEmployees, Employee } from '@/lib/firebase/employees'
import { uploadJobPhoto, getJobPhotos } from '@/lib/firebase/photos'
import { cn } from '@/lib/utils'

export default function JobSuitePage() {
  const { showToast } = useToast()
  
  // Main state
  const [jobs, setJobs] = useState<TransformedJob[]>([])
  const [filteredJobs, setFilteredJobs] = useState<TransformedJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  
  // Job Detail Drawer
  const [selectedJob, setSelectedJob] = useState<TransformedJob | null>(null)
  const [showJobDrawer, setShowJobDrawer] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'materials' | 'payroll' | 'photos'>('overview')
  
  // Materials & Employees
  const [allMaterials, setAllMaterials] = useState<Material[]>([])
  const [allEmployees, setAllEmployees] = useState<Employee[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<{ materialId: string; quantity: number }[]>([])
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [materialQuantities, setMaterialQuantities] = useState<{ [materialId: string]: number }>({})
  const [jobPhotos, setJobPhotos] = useState<string[]>([])
  const [newMaterialName, setNewMaterialName] = useState('')
  const [newMaterialCost, setNewMaterialCost] = useState('')
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  
  // Modals
  const [showEditStatusModal, setShowEditStatusModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [jobToEdit, setJobToEdit] = useState<TransformedJob | null>(null)
  const [jobToDelete, setJobToDelete] = useState<TransformedJob | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')

  // Fetch jobs from Firestore
  useEffect(() => {
    loadJobs()
  }, [])

  // Load materials and employees when drawer opens
  useEffect(() => {
    if (selectedJob && showJobDrawer) {
      loadMaterials()
      loadEmployees()
      loadPhotos()
      // Load selected materials and employees from job
      const costData = (selectedJob as any).Cost || {}
      const materialsFromCost = costData.materials || []
      const materialsFromDirect = selectedJob.selectedMaterials || []
      const materials = materialsFromCost.length > 0 ? materialsFromCost : materialsFromDirect
      
      const materialsArray: { materialId: string; quantity: number }[] = []
      if (Array.isArray(materials)) {
        materials.forEach((mat: any) => {
          if (typeof mat === 'string') {
            materialsArray.push({ materialId: mat, quantity: 1 })
          } else if (mat.materialId) {
            materialsArray.push({ materialId: mat.materialId, quantity: mat.quantity || 1 })
          }
        })
      }
      setSelectedMaterials(materialsArray)
      const quantityMap: { [materialId: string]: number } = {}
      materialsArray.forEach((mat) => {
        quantityMap[mat.materialId] = mat.quantity
      })
      setMaterialQuantities(quantityMap)
      
      const employeesFromCost = costData.payroll?.map((p: any) => p.employeeId) || []
      const employeesFromDirect = selectedJob.assignedEmployees || []
      setSelectedEmployees(employeesFromCost.length > 0 ? employeesFromCost : employeesFromDirect)
    }
  }, [selectedJob, showJobDrawer])

  // Filter jobs based on filters
  useEffect(() => {
    let filtered = [...jobs]
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.status === statusFilter)
    }
    
    // Date filter
    if (dateFilter) {
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.startDate)
        const filterDate = new Date(dateFilter)
        return jobDate.toDateString() === filterDate.toDateString()
      })
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(job => 
        job.name?.toLowerCase().includes(query) ||
        job.location?.toLowerCase().includes(query) ||
        job.customerName?.toLowerCase().includes(query) ||
        job.site?.toLowerCase().includes(query)
      )
    }
    
    setFilteredJobs(filtered)
  }, [jobs, statusFilter, dateFilter, searchQuery])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const fetchedJobs = await getAllJobs()
      setJobs(fetchedJobs)
      
      // If a job drawer is open, update the selected job with fresh data
      if (selectedJob && showJobDrawer) {
        const updatedJob = fetchedJobs.find(j => j.id === selectedJob.id)
        if (updatedJob) {
          setSelectedJob(updatedJob)
        }
      }
    } catch (error: any) {
      console.error('Error loading jobs:', error)
      setError(error.message || 'Failed to load jobs')
      showToast('Failed to load jobs', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const loadMaterials = async () => {
    try {
      const materials = await getAllMaterials()
      setAllMaterials(materials)
    } catch (error: any) {
      console.error('Error loading materials:', error)
    }
  }

  const loadEmployees = async () => {
    try {
      const employees = await getAllEmployees()
      setAllEmployees(employees)
    } catch (error: any) {
      console.error('Error loading employees:', error)
    }
  }

  const loadPhotos = async () => {
    if (!selectedJob) return
    try {
      const photos = await getJobPhotos(selectedJob.id)
      setJobPhotos(photos)
    } catch (error: any) {
      console.error('Error loading photos:', error)
    }
  }

  // Calculate priority counts
  const priorityCounts = {
    awaitingApproval: jobs.filter(j => j.status === 'pending_approval').length,
    outstandingBalance: jobs.filter(j => (j.status === 'approved' || j.status === 'in_progress' || j.status === 'outstanding') && !j.paid).length,
    readyToClose: jobs.filter(j => j.status === 'in_progress' && j.photosUploaded && j.materialsFinalized && !j.payrollPending).length,
    missingPhotos: jobs.filter(j => j.status === 'in_progress' && !j.photosUploaded).length,
  }

  const handlePriorityClick = (filterType: string) => {
    switch (filterType) {
      case 'awaitingApproval':
        setStatusFilter('pending_approval')
        break
      case 'outstandingBalance':
        setStatusFilter('approved')
        break
      case 'readyToClose':
        setStatusFilter('in_progress')
        break
      case 'missingPhotos':
        setStatusFilter('in_progress')
        break
    }
  }

  const handleJobClick = (job: TransformedJob) => {
    setSelectedJob(job)
    setShowJobDrawer(true)
    setActiveTab('overview')
  }

  const handleViewJob = (job: TransformedJob) => {
    handleJobClick(job)
  }

  const handleEditJob = (job: TransformedJob) => {
    setJobToEdit(job)
    setNewStatus(job.status)
    setShowEditStatusModal(true)
  }

  const handleDeleteJob = (job: TransformedJob) => {
    setJobToDelete(job)
    setShowDeleteModal(true)
  }

  const handleDuplicateJob = async (job: TransformedJob) => {
    try {
      await duplicateJob(job.id)
      showToast('Job duplicated successfully', 'success')
      await loadJobs()
    } catch (error: any) {
      showToast(error.message || 'Failed to duplicate job', 'error')
    }
  }

  const handleExportJob = (job: TransformedJob) => {
    // Export job data as JSON
    const dataStr = JSON.stringify(job, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `job-${job.id}.json`
    link.click()
    URL.revokeObjectURL(url)
    showToast('Job data exported', 'success')
  }

  const handleGenerateInvoice = async (job: TransformedJob) => {
    try {
      // Navigate to invoice generation or open modal
      showToast('Invoice generation feature coming soon', 'info')
    } catch (error: any) {
      showToast(error.message || 'Failed to generate invoice', 'error')
    }
  }

  const handleSaveStatus = async () => {
    if (!jobToEdit || !newStatus) return
    try {
      await updateJobStatus(jobToEdit.id, newStatus)
      showToast('Job status updated successfully', 'success')
      setShowEditStatusModal(false)
      setJobToEdit(null)
      await loadJobs()
    } catch (error: any) {
      showToast(error.message || 'Failed to update job status', 'error')
    }
  }

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return
    try {
      await deleteJob(jobToDelete.id)
      showToast('Job deleted successfully', 'success')
      setShowDeleteModal(false)
      setJobToDelete(null)
      if (selectedJob?.id === jobToDelete.id) {
        setShowJobDrawer(false)
        setSelectedJob(null)
      }
      await loadJobs()
    } catch (error: any) {
      showToast(error.message || 'Failed to delete job', 'error')
    }
  }

  const handleSaveMaterials = async () => {
    if (!selectedJob) return
    try {
      const materialsWithDetails = selectedMaterials.map(sel => {
        const material = allMaterials.find(mat => mat.id === sel.materialId)
        const unitCost = material ? material.cost : 0
        const totalCost = unitCost * sel.quantity
        return {
          materialId: sel.materialId,
          name: material ? material.name : 'Unknown Material',
          quantity: sel.quantity,
          unitCost: unitCost,
          totalCost: totalCost
        }
      })
      const materialsCost = materialsWithDetails.reduce((sum, mat) => sum + mat.totalCost, 0)

      const materialsToSave: { materialId: string; quantity: number }[] = materialsWithDetails.map(m => ({ materialId: m.materialId, quantity: m.quantity }))
      
      const existingCost = (selectedJob as any).Cost || {}
      const newCost = {
        ...existingCost,
        materialsCost,
        materials: materialsWithDetails,
        totalCost: materialsCost + (existingCost.payrollCost || 0),
      }

      await updateJobData(selectedJob.id, {
        selectedMaterials: materialsToSave as any,
        materialsCost,
        materials: materialsWithDetails,
        Cost: newCost,
      })
      showToast('Materials saved successfully', 'success')
      const updatedJob = { 
        ...selectedJob, 
        materialsCost, 
        selectedMaterials: materialsToSave,
        materials: materialsWithDetails,
        Cost: newCost
      }
      setSelectedJob(updatedJob)
      await loadJobs()
    } catch (error: any) {
      showToast(error.message || 'Failed to save materials', 'error')
    }
  }

  const handleMaterialToggle = (materialId: string) => {
    setSelectedMaterials(prev => {
      const exists = prev.find(m => m.materialId === materialId)
      if (exists) {
        return prev.filter(m => m.materialId !== materialId)
      } else {
        return [...prev, { materialId, quantity: 1 }]
      }
    })
  }

  const handleQuantityChange = (materialId: string, quantity: number) => {
    const numQuantity = Math.max(1, Math.floor(quantity))
    setSelectedMaterials(prev => {
      const exists = prev.find(m => m.materialId === materialId)
      if (exists) {
        return prev.map(m => m.materialId === materialId ? { ...m, quantity: numQuantity } : m)
      }
      return prev
    })
  }

  const handleSaveEmployees = async () => {
    if (!selectedJob) return
    try {
      const totalDays = selectedJob.jobs?.reduce((sum, job) => sum + (job.timeEstimate || 0), 0) || 0
      const hoursPerDay = 8

      const payrollWithDetails = selectedEmployees.map(empId => {
        const employee = allEmployees.find(emp => emp.uid === empId)
        const hourlyRate = employee?.hourlyRate || 0
        const hours = totalDays * hoursPerDay
        return {
          employeeId: empId,
          employeeName: employee?.name || 'Unknown Employee',
          hourlyRate,
          hours,
          totalCost: hourlyRate * hours
        }
      })
      const payrollCost = payrollWithDetails.reduce((sum, emp) => sum + emp.totalCost, 0)

      const existingCost = (selectedJob as any).Cost || {}
      const newCost = {
        ...existingCost,
        payrollCost,
        payroll: payrollWithDetails,
        totalCost: (existingCost.materialsCost || 0) + payrollCost
      }

      await updateJobData(selectedJob.id, {
        assignedEmployees: selectedEmployees,
        totalDays,
        payrollCost,
        payroll: payrollWithDetails,
        Cost: newCost,
      })
      showToast('Employees and payroll saved successfully', 'success')
      const updatedJob = { 
        ...selectedJob, 
        assignedEmployees: selectedEmployees, 
        totalDays, 
        payrollCost,
        payroll: payrollWithDetails as any,
        Cost: newCost
      }
      setSelectedJob(updatedJob)
      await loadJobs()
    } catch (error: any) {
      showToast(error.message || 'Failed to save employees', 'error')
    }
  }

  const handleAddMaterial = async () => {
    if (!newMaterialName.trim() || !newMaterialCost) {
      showToast('Please fill in all fields', 'error')
      return
    }

    try {
      const cost = parseFloat(newMaterialCost)
      if (isNaN(cost) || cost < 0) {
        showToast('Please enter a valid cost', 'error')
        return
      }

      await addMaterial(newMaterialName.trim(), cost)
      showToast('Material added successfully', 'success')
      setNewMaterialName('')
      setNewMaterialCost('')
      setShowAddMaterial(false)
      await loadMaterials()
    } catch (error: any) {
      showToast(error.message || 'Failed to add material', 'error')
    }
  }

  const handlePhotoUpload = async (files: FileList | null) => {
    if (!selectedJob || !files || files.length === 0) return
    
    try {
      setUploadingPhotos(true)
      const uploadPromises = Array.from(files).map(file => uploadJobPhoto(selectedJob.id, file))
      const urls = await Promise.all(uploadPromises)
      
      const updatedPhotos = [...jobPhotos, ...urls]
      setJobPhotos(updatedPhotos)
      
      await updateJobData(selectedJob.id, {
        photos: updatedPhotos,
      })
      
      showToast('Photos uploaded successfully', 'success')
      await loadJobs()
    } catch (error: any) {
      showToast(error.message || 'Failed to upload photos', 'error')
    } finally {
      setUploadingPhotos(false)
    }
  }

  const handleCloseOutJob = async () => {
    if (!selectedJob) return
    
    try {
      const photoUrls = jobPhotos.length > 0 ? jobPhotos : (selectedJob.photos || [])
      
      const response = await fetch('/api/invoices/generate-with-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estimateId: selectedJob.id,
          customerId: selectedJob.customerId,
          jobNumber: selectedJob.id.substring(0, 8),
          companyName: selectedJob.customerName || selectedJob.customerEmail,
          photoUrls: photoUrls,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate invoice with photos')
      }

      const { signedUrl } = await response.json()
      window.open(signedUrl, '_blank')
      showToast('Invoice and photos exported successfully', 'success')
    } catch (error: any) {
      console.error('Error closing out job:', error)
      showToast(error.message || 'Failed to close out job', 'error')
    }
  }

  // Calculate financials
  const selectedJobFinancials = selectedJob ? {
    revenue: selectedJob.revenue || 0,
    materialsCost: (selectedJob as any).Cost?.materialsCost ?? selectedJob.materialsCost ?? 0,
    payrollCost: (selectedJob as any).Cost?.payrollCost ?? selectedJob.payrollCost ?? 0,
    totalCost: (selectedJob as any).Cost?.totalCost ?? ((selectedJob.materialsCost || 0) + (selectedJob.payrollCost || 0)),
    profit: (selectedJob.revenue || 0) - ((selectedJob as any).Cost?.totalCost ?? ((selectedJob.materialsCost || 0) + (selectedJob.payrollCost || 0))),
    margin: selectedJob.revenue > 0 
      ? (((selectedJob.revenue || 0) - ((selectedJob as any).Cost?.totalCost ?? ((selectedJob.materialsCost || 0) + (selectedJob.payrollCost || 0)))) / selectedJob.revenue) * 100
      : 0,
    healthColor: (() => {
      const profit = (selectedJob.revenue || 0) - ((selectedJob as any).Cost?.totalCost ?? ((selectedJob.materialsCost || 0) + (selectedJob.payrollCost || 0)))
      const margin = selectedJob.revenue > 0 ? (profit / selectedJob.revenue) * 100 : 0
      if (profit > 0 && margin > 20) return 'text-green-400'
      if (profit > 0 && margin > 0) return 'text-yellow-400'
      return 'text-red-400'
    })()
  } : null

  return (
    <div className="p-6 md:p-8">
      {/* Job Command Header */}
      <div className="mb-6">
        <Link href="/admin/dashboard" className="text-accent hover:underline mb-4 inline-block">
          ← Back to Dashboard
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Briefcase className="h-8 w-8 text-accent" />
              Job Suite
            </h1>
            <p className="text-foreground/70">Manage job estimates, schedules, and close out jobs</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/suites/job/create">
              <Button variant="primary" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Job
              </Button>
            </Link>
            <Button variant="outline" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Upload Photos
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-foreground mb-2">Status</label>
            <StatusSelect
              value={statusFilter}
              onChange={setStatusFilter}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-foreground mb-2">Date</label>
            <Button
              variant="outline"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full justify-between"
            >
              {dateFilter ? new Date(dateFilter).toLocaleDateString() : 'Select Date'}
              <Calendar className="h-4 w-4" />
            </Button>
            {showDatePicker && (
              <div className="absolute z-50 mt-2">
                <DatePicker
                  date={dateFilter}
                  onDateChange={(date) => {
                    setDateFilter(date)
                    setShowDatePicker(false)
                  }}
                />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-foreground mb-2">Search</label>
            <Input
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Priority Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => handlePriorityClick('awaitingApproval')}
          className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 hover:bg-yellow-500/30 transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-yellow-400">Jobs Awaiting Approval</span>
            <AlertCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{priorityCounts.awaitingApproval}</div>
        </button>
        
        <button
          onClick={() => handlePriorityClick('outstandingBalance')}
          className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 hover:bg-red-500/30 transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-red-400">Outstanding Balance</span>
            <DollarSign className="h-5 w-5 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{priorityCounts.outstandingBalance}</div>
        </button>
        
        <button
          onClick={() => handlePriorityClick('readyToClose')}
          className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 hover:bg-green-500/30 transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-400">Ready to Close</span>
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{priorityCounts.readyToClose}</div>
        </button>
        
        <button
          onClick={() => handlePriorityClick('missingPhotos')}
          className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 hover:bg-blue-500/30 transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-400">Missing Photos</span>
            <ImageIcon className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{priorityCounts.missingPhotos}</div>
        </button>
      </div>

      {/* Main Body: Split Layout */}
      <div className="flex gap-6">
        {/* LEFT (70%) - Job Workspace */}
        <div className="flex-1" style={{ flex: '0 0 70%' }}>
          {/* Job Table */}
          <div className="bg-base border border-accent/20 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-foreground/5 border-b border-accent/20">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Job / Site</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Revenue | Cost | Profit</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Dates</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-foreground/70">
                        Loading jobs...
                      </td>
                    </tr>
                  ) : filteredJobs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-foreground/70">
                        No jobs found
                      </td>
                    </tr>
                  ) : (
                    filteredJobs.map((job) => (
                      <tr
                        key={job.id}
                        className="border-b border-accent/10 hover:bg-foreground/5 cursor-pointer transition-colors"
                        onClick={() => handleJobClick(job)}
                      >
                        <td className="px-4 py-4">
                          <div>
                            <div className="font-semibold text-foreground">{job.location || job.name}</div>
                            {job.jobs && job.jobs.length > 0 && (
                              <ul className="text-sm text-foreground/70 mt-1 list-disc list-inside">
                                {job.jobs.map((j, idx) => (
                                  <li key={idx}>{j.name}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            'px-2 py-1 rounded text-xs font-semibold',
                            job.status === 'approved' && 'bg-green-500/20 text-green-400',
                            job.status === 'pending_approval' && 'bg-yellow-500/20 text-yellow-400',
                            job.status === 'in_progress' && 'bg-blue-500/20 text-blue-400',
                            job.status === 'completed' && 'bg-gray-500/20 text-gray-400',
                            job.status === 'draft' && 'bg-gray-500/20 text-gray-400',
                          )}>
                            {job.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <div className="text-foreground">${job.revenue.toLocaleString()}</div>
                            <div className="text-foreground/70">${job.cost.toLocaleString()}</div>
                            <div className={cn(
                              'font-semibold',
                              job.profit > 0 ? 'text-green-400' : 'text-red-400'
                            )}>
                              ${job.profit.toLocaleString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-foreground/70">
                          <div>{new Date(job.startDate).toLocaleDateString()}</div>
                          <div>{new Date(job.endDate).toLocaleDateString()}</div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div onClick={(e) => e.stopPropagation()}>
                            <JobActionsMenu
                              jobId={job.id}
                              onView={() => handleViewJob(job)}
                              onEdit={() => handleEditJob(job)}
                              onDelete={() => handleDeleteJob(job)}
                              onDuplicate={() => handleDuplicateJob(job)}
                              onExport={() => handleExportJob(job)}
                              onGenerateInvoice={() => handleGenerateInvoice(job)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT (30%) - Job Actions & Intelligence */}
        <div className="w-80 flex-shrink-0 space-y-4">
          {selectedJob ? (
            <>
              {/* Financial Snapshot */}
              <div className="bg-base border border-accent/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Financial Snapshot</h3>
                {selectedJobFinancials && (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Revenue</span>
                      <span className="text-foreground">${selectedJobFinancials.revenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Expenses</span>
                      <span className="text-foreground">${selectedJobFinancials.totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Profit</span>
                      <span className={cn('font-semibold', selectedJobFinancials.healthColor)}>
                        ${selectedJobFinancials.profit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground/70">Margin</span>
                      <span className={cn('font-semibold', selectedJobFinancials.healthColor)}>
                        {selectedJobFinancials.margin.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Job Actions Panel */}
              <div className="bg-base border border-accent/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Actions</h3>
                <div className="space-y-2">
                  {selectedJob.status === 'approved' && (
                    <>
                      <Button variant="outline" className="w-full justify-start">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Job
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <Users className="h-4 w-4 mr-2" />
                        Assign Crew
                      </Button>
                    </>
                  )}
                  {selectedJob.status === 'in_progress' && (
                    <>
                      <Button variant="outline" className="w-full justify-start">
                        <Camera className="h-4 w-4 mr-2" />
                        Upload Photos
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Cost Breakdown
                      </Button>
                    </>
                  )}
                  {priorityCounts.readyToClose > 0 && selectedJob.status === 'in_progress' && (
                    <>
                      <Button variant="outline" className="w-full justify-start">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Finalize Price
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Invoice
                      </Button>
                      <Button variant="primary" className="w-full justify-start">
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Close Job
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-base border border-accent/20 rounded-lg p-4 text-center text-foreground/70">
              Select a job to view details
            </div>
          )}
        </div>
      </div>

      {/* Job Detail Drawer */}
      {showJobDrawer && selectedJob && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowJobDrawer(false)} />
          <div className="relative z-50 w-full max-w-4xl bg-base border-l border-accent/20 ml-auto h-full overflow-y-auto">
            <div className="sticky top-0 bg-base border-b border-accent/20 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedJob.location || selectedJob.name}</h2>
                <p className="text-foreground/70">{selectedJob.customerName || selectedJob.customerEmail}</p>
              </div>
              <button
                onClick={() => setShowJobDrawer(false)}
                className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-accent/20 px-6">
              <div className="flex gap-6">
                {['Overview', 'Financials', 'Materials', 'Payroll', 'Photos'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab.toLowerCase() as any)}
                    className={cn(
                      'px-4 py-3 border-b-2 transition-colors font-medium',
                      activeTab === tab.toLowerCase()
                        ? 'border-accent text-accent'
                        : 'border-transparent text-foreground/70 hover:text-foreground'
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Job Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-foreground/70">Status:</span>
                        <span className="ml-2 text-foreground">{selectedJob.status}</span>
                      </div>
                      <div>
                        <span className="text-foreground/70">Start Date:</span>
                        <span className="ml-2 text-foreground">{new Date(selectedJob.startDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-foreground/70">End Date:</span>
                        <span className="ml-2 text-foreground">{new Date(selectedJob.endDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-foreground/70">Location:</span>
                        <span className="ml-2 text-foreground">{selectedJob.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedJob.jobs && selectedJob.jobs.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Included Jobs</h3>
                      <div className="space-y-2">
                        {selectedJob.jobs.map((job, idx) => (
                          <div key={idx} className="bg-foreground/5 p-3 rounded">
                            <div className="font-medium text-foreground">{job.name}</div>
                            {job.description && (
                              <div className="text-sm text-foreground/70 mt-1">{job.description}</div>
                            )}
                            <div className="text-sm text-accent mt-1">${job.price.toLocaleString()}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Button
                      variant="primary"
                      onClick={handleCloseOutJob}
                      className="w-full"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Close Out Job
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'financials' && selectedJobFinancials && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Financial Breakdown</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-foreground/70">Job Revenue</span>
                        <span className="text-foreground font-semibold">${selectedJobFinancials.revenue.toLocaleString()}</span>
                      </div>
                      
                      {(() => {
                        const costData = (selectedJob as any).Cost || {}
                        const materials = costData.materials || selectedJob.materials || []
                        const materialsCost = costData.materialsCost ?? selectedJob.materialsCost ?? 0
                        const payroll = costData.payroll || selectedJob.payroll || []
                        const payrollCost = costData.payrollCost ?? selectedJob.payrollCost ?? 0
                        const totalCost = costData.totalCost ?? (materialsCost + payrollCost)
                        
                        return (
                          <>
                            {(materials && materials.length > 0) ? (
                              <div className="mb-4 mt-4">
                                <div className="text-sm font-semibold text-foreground mb-2">Materials</div>
                                <div className="space-y-2 mb-2">
                                  {materials.map((mat: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center text-sm bg-foreground/5 p-2 rounded">
                                      <span className="text-foreground/70">
                                        {mat.name} (Qty: {mat.quantity} × ${mat.unitCost?.toLocaleString() || 0})
                                      </span>
                                      <span className="text-foreground font-medium">${mat.totalCost?.toLocaleString() || 0}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-accent/10">
                                  <span className="text-foreground/70 font-semibold">Total Materials Cost</span>
                                  <span className="text-foreground font-semibold">${materialsCost.toLocaleString()}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-foreground/70">Materials Cost</span>
                                <span className="text-foreground/70">${materialsCost.toLocaleString()}</span>
                              </div>
                            )}
                            
                            {(payroll && payroll.length > 0) ? (
                              <div className="mb-4 mt-4">
                                <div className="text-sm font-semibold text-foreground mb-2">Payroll</div>
                                <div className="space-y-2 mb-2">
                                  {payroll.map((emp: any, index: number) => (
                                    <div key={index} className="flex justify-between items-center text-sm bg-foreground/5 p-2 rounded">
                                      <span className="text-foreground/70">
                                        {emp.employeeName} ({emp.hours}h × ${emp.hourlyRate?.toLocaleString() || 0}/hr)
                                      </span>
                                      <span className="text-foreground font-medium">${emp.totalCost?.toLocaleString() || 0}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-accent/10">
                                  <span className="text-foreground/70 font-semibold">Total Payroll Cost</span>
                                  <span className="text-foreground font-semibold">${payrollCost.toLocaleString()}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-foreground/70">Payroll Cost</span>
                                <span className="text-foreground/70">${payrollCost.toLocaleString()}</span>
                              </div>
                            )}
                            
                            <div className="border-t border-accent/20 pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-foreground font-semibold">Total Cost</span>
                                <span className="text-foreground font-semibold">
                                  ${totalCost.toLocaleString()}
                                </span>
                              </div>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-foreground font-semibold">Profit</span>
                                <span className={cn(
                                  "font-semibold text-lg",
                                  selectedJobFinancials.healthColor
                                )}>
                                  ${selectedJobFinancials.profit.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'materials' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Materials</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddMaterial(!showAddMaterial)}
                        className="text-accent"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Material
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSaveMaterials}
                      >
                        Save Materials
                      </Button>
                    </div>
                  </div>

                  {showAddMaterial && (
                    <div className="bg-foreground/5 border border-accent/20 rounded-lg p-4 space-y-3">
                      <Input
                        label="Material Name"
                        value={newMaterialName}
                        onChange={(e) => setNewMaterialName(e.target.value)}
                        placeholder="Enter material name"
                      />
                      <Input
                        label="Cost"
                        type="number"
                        value={newMaterialCost}
                        onChange={(e) => setNewMaterialCost(e.target.value)}
                        placeholder="0.00"
                      />
                      <div className="flex gap-2">
                        <Button variant="primary" onClick={handleAddMaterial}>
                          Add
                        </Button>
                        <Button variant="outline" onClick={() => {
                          setShowAddMaterial(false)
                          setNewMaterialName('')
                          setNewMaterialCost('')
                        }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {allMaterials.map((material) => {
                      const isSelected = selectedMaterials.some(m => m.materialId === material.id)
                      const quantity = materialQuantities[material.id] || selectedMaterials.find(m => m.materialId === material.id)?.quantity || 1
                      return (
                        <div
                          key={material.id}
                          className={cn(
                            'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                            isSelected ? 'border-accent bg-accent/10' : 'border-accent/20 hover:border-accent/40'
                          )}
                          onClick={() => handleMaterialToggle(material.id)}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleMaterialToggle(material.id)}
                              className="rounded border-accent/30 bg-base text-accent"
                            />
                            <div>
                              <div className="font-medium text-foreground">{material.name}</div>
                              <div className="text-sm text-foreground/70">${material.cost.toLocaleString()}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <Input
                              type="number"
                              value={quantity}
                              onChange={(e) => handleQuantityChange(material.id, parseFloat(e.target.value) || 1)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-20"
                              min="1"
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'payroll' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Assign Employees</h3>
                    <Button
                      variant="primary"
                      onClick={handleSaveEmployees}
                    >
                      Save Employees & Payroll
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {allEmployees.map((employee) => {
                      const isSelected = selectedEmployees.includes(employee.uid)
                      const totalDays = selectedJob.jobs?.reduce((sum, job) => sum + (job.timeEstimate || 0), 0) || 0
                      const hours = totalDays * 8
                      const totalCost = isSelected ? employee.hourlyRate * hours : 0
                      
                      return (
                        <div
                          key={employee.uid}
                          className={cn(
                            'flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors',
                            isSelected ? 'border-accent bg-accent/10' : 'border-accent/20 hover:border-accent/40'
                          )}
                          onClick={() => {
                            setSelectedEmployees(prev =>
                              prev.includes(employee.uid)
                                ? prev.filter(id => id !== employee.uid)
                                : [...prev, employee.uid]
                            )
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedEmployees(prev =>
                                  prev.includes(employee.uid)
                                    ? prev.filter(id => id !== employee.uid)
                                    : [...prev, employee.uid]
                                )
                              }}
                              className="rounded border-accent/30 bg-base text-accent"
                            />
                            <div>
                              <div className="font-medium text-foreground">{employee.name}</div>
                              <div className="text-sm text-foreground/70">${employee.hourlyRate.toLocaleString()}/hr</div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="text-sm text-foreground/70">
                              {hours}h × ${employee.hourlyRate.toLocaleString()}/hr = ${totalCost.toLocaleString()}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="bg-foreground/5 border border-accent/20 rounded-lg p-4">
                    <h4 className="font-semibold text-foreground mb-2">Payroll Estimate</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Total Days:</span>
                        <span className="text-foreground">{selectedJob.jobs?.reduce((sum, job) => sum + (job.timeEstimate || 0), 0) || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Selected Employees:</span>
                        <span className="text-foreground">{selectedEmployees.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Estimated Payroll:</span>
                        <span className="text-foreground font-semibold">
                          ${selectedEmployees.reduce((sum, empId) => {
                            const emp = allEmployees.find(e => e.uid === empId)
                            const days = selectedJob.jobs?.reduce((s, j) => s + (j.timeEstimate || 0), 0) || 0
                            return sum + (emp ? emp.hourlyRate * days * 8 : 0)
                          }, 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'photos' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Job Photos</h3>
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e.target.files)}
                        className="hidden"
                      />
                      <Button variant="primary" asChild>
                        <span>
                          <Camera className="h-4 w-4 mr-2" />
                          {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                        </span>
                      </Button>
                    </label>
                  </div>

                  {jobPhotos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {jobPhotos.map((url, idx) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-accent/20">
                          <img
                            src={url}
                            alt={`Job photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-foreground/70">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No photos uploaded yet</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Modal */}
      <Modal
        isOpen={showEditStatusModal}
        onClose={() => {
          setShowEditStatusModal(false)
          setJobToEdit(null)
        }}
        title="Edit Job Status"
        size="md"
      >
        {jobToEdit && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Status</label>
              <StatusSelect
                value={newStatus}
                onChange={setNewStatus}
                excludeAll={true}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditStatusModal(false)
                  setJobToEdit(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveStatus}
              >
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false)
          setJobToDelete(null)
        }}
        title="Delete Job"
        size="md"
      >
        {jobToDelete && (
          <div className="space-y-4">
            <p className="text-foreground/70">
              Are you sure you want to delete this job? This action cannot be undone.
            </p>
            <div className="bg-foreground/5 p-3 rounded">
              <div className="font-medium text-foreground">{jobToDelete.location || jobToDelete.name}</div>
              <div className="text-sm text-foreground/70">{jobToDelete.customerName || jobToDelete.customerEmail}</div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false)
                  setJobToDelete(null)
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
