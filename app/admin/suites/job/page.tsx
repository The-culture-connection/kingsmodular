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
  ChevronRight,
  ArrowRight
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
import { addService } from '@/lib/firebase/firestore'
import { getAllEmployees, Employee } from '@/lib/firebase/employees'
import { uploadJobPhoto, getJobPhotos } from '@/lib/firebase/photos'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'
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
  const [dateRangeStart, setDateRangeStart] = useState<string>('')
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('')
  const [showDateRangePicker, setShowDateRangePicker] = useState(false)
  
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
  const [materialOrderStatus, setMaterialOrderStatus] = useState<{ [materialId: string]: boolean }>({})
  const [materialOrderLinks, setMaterialOrderLinks] = useState<{ [materialId: string]: string }>({})
  const [editingOrderLink, setEditingOrderLink] = useState<string | null>(null)
  const [tempOrderLink, setTempOrderLink] = useState('')
  const [jobPhotos, setJobPhotos] = useState<string[]>([])
  const [newMaterialName, setNewMaterialName] = useState('')
  const [newMaterialCost, setNewMaterialCost] = useState('')
  const [showAddMaterial, setShowAddMaterial] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  
  // Quick Actions state
  const [showQuickAddMaterial, setShowQuickAddMaterial] = useState(false)
  const [quickMaterialName, setQuickMaterialName] = useState('')
  const [quickMaterialCost, setQuickMaterialCost] = useState('')
  const [showQuickAddService, setShowQuickAddService] = useState(false)
  const [quickServiceDescription, setQuickServiceDescription] = useState('')
  const [quickServicePrice, setQuickServicePrice] = useState('')
  const [quickServiceTimeEstimate, setQuickServiceTimeEstimate] = useState('')
  const [quickServiceRequiredMaterials, setQuickServiceRequiredMaterials] = useState<string[]>([])
  const [quickServiceMaterialQuantities, setQuickServiceMaterialQuantities] = useState<{ [materialId: string]: number }>({})
  const [quickServiceMaterialCosts, setQuickServiceMaterialCosts] = useState<{ [materialId: string]: number }>({})
  const [hoursPerDay, setHoursPerDay] = useState(10) // Hours per day for payroll calculation
  
  // Modals
  const [showEditStatusModal, setShowEditStatusModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [jobToEdit, setJobToEdit] = useState<TransformedJob | null>(null)
  const [jobToDelete, setJobToDelete] = useState<TransformedJob | null>(null)
  const [newStatus, setNewStatus] = useState<string>('')

  // Fetch jobs from Firestore
  useEffect(() => {
    loadJobs()
    loadMaterials() // Load materials on mount so they're available for Quick Actions
  }, [])

  // Close date range picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showDateRangePicker && !target.closest('.date-range-picker-container')) {
        setShowDateRangePicker(false)
      }
    }

    if (showDateRangePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDateRangePicker])

  // Load materials and employees when drawer opens
  useEffect(() => {
    if (selectedJob && showJobDrawer) {
      loadMaterials()
      loadEmployees()
      loadPhotos()
      // Load selected materials and employees from job
      // Check Cost object first, then top-level fields
      const costData = (selectedJob as any).Cost || {}
      const materialsFromCost = costData.materials || []
      const materialsFromTopLevel = (selectedJob as any).materials || []
      const materialsFromDirect = selectedJob.selectedMaterials || []
      
      // Prefer Cost.materials, then top-level materials, then selectedMaterials
      const materials = materialsFromCost.length > 0 
        ? materialsFromCost 
        : materialsFromTopLevel.length > 0 
        ? materialsFromTopLevel 
        : materialsFromDirect
      
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
      const orderStatusMap: { [materialId: string]: boolean } = {}
      const orderLinksMap: { [materialId: string]: string } = {}
      
      // Load order status and links from existing materials
      if (Array.isArray(materials)) {
        materials.forEach((mat: any) => {
          if (mat.materialId) {
            quantityMap[mat.materialId] = mat.quantity || 1
            orderStatusMap[mat.materialId] = mat.ordered || false
            orderLinksMap[mat.materialId] = mat.orderLink || ''
          }
        })
      }
      
      setMaterialQuantities(quantityMap)
      setMaterialOrderStatus(orderStatusMap)
      setMaterialOrderLinks(orderLinksMap)
      
      // Load employees - check Cost.payroll first, then top-level payroll, then assignedEmployees
      const employeesFromCost = costData.payroll?.map((p: any) => p.employeeId) || []
      const employeesFromTopLevel = (selectedJob as any).payroll?.map((p: any) => p.employeeId) || []
      const employeesFromDirect = selectedJob.assignedEmployees || []
      setSelectedEmployees(
        employeesFromCost.length > 0 
          ? employeesFromCost 
          : employeesFromTopLevel.length > 0 
          ? employeesFromTopLevel 
          : employeesFromDirect
      )
      
      // Load hours per day from job data (default to 10)
      const jobHoursPerDay = (selectedJob as any).hoursPerDay || costData.hoursPerDay || 10
      setHoursPerDay(jobHoursPerDay)
    }
  }, [selectedJob, showJobDrawer])

  // Filter jobs based on filters
  useEffect(() => {
    let filtered = [...jobs]
    
    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'paid') {
        // Filter for paid jobs (regardless of status)
        filtered = filtered.filter(job => job.paid)
      } else {
        filtered = filtered.filter(job => job.status === statusFilter)
      }
    }
    
    // Date range filter
    if (dateRangeStart || dateRangeEnd) {
      filtered = filtered.filter(job => {
        const jobDate = new Date(job.startDate)
        if (dateRangeStart && dateRangeEnd) {
          const startDate = new Date(dateRangeStart)
          const endDate = new Date(dateRangeEnd)
          // Set time to start/end of day for proper comparison
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          return jobDate >= startDate && jobDate <= endDate
        } else if (dateRangeStart) {
          const startDate = new Date(dateRangeStart)
          startDate.setHours(0, 0, 0, 0)
          return jobDate >= startDate
        } else if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd)
          endDate.setHours(23, 59, 59, 999)
          return jobDate <= endDate
        }
        return true
      })
    }
    
    setFilteredJobs(filtered)
  }, [jobs, statusFilter, dateRangeStart, dateRangeEnd])

  const loadJobs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      console.log('🔵 loadJobs: Starting to fetch jobs...')
      const fetchedJobs = await getAllJobs()
      console.log('🔵 loadJobs: Fetched jobs:', fetchedJobs.length)
      
      // Debug: Log cost data for each job
      fetchedJobs.forEach((job, index) => {
        const costData = (job as any).Cost || {}
        console.log(`🔵 Job ${index + 1} (${job.id}):`, {
          name: job.name,
          revenue: job.revenue,
          cost: job.cost,
          profit: job.profit,
          materialsCost: costData.materialsCost ?? (job as any).materialsCost,
          payrollCost: costData.payrollCost ?? (job as any).payrollCost,
          Cost: costData,
          hasCostObject: !!(job as any).Cost,
          topLevelMaterialsCost: (job as any).materialsCost,
          topLevelPayrollCost: (job as any).payrollCost,
        })
      })
      
      setJobs(fetchedJobs)
      console.log('🔵 loadJobs: Jobs set in state')
      
      // If a job drawer is open, update the selected job with fresh data
      if (selectedJob && showJobDrawer) {
        const updatedJob = fetchedJobs.find(j => j.id === selectedJob.id)
        if (updatedJob) {
          console.log('🔵 loadJobs: Updating selected job:', updatedJob.id)
          setSelectedJob(updatedJob)
        }
      }
    } catch (error: any) {
      console.error('❌ Error loading jobs:', error)
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
    inProgress: jobs.filter(j => j.status === 'approved').length,
    outstandingBalance: jobs.filter(j => j.status === 'completed' && !j.paid).length,
    paid: jobs.filter(j => j.paid).length,
  }

  const handlePriorityClick = (filterType: string) => {
    switch (filterType) {
      case 'awaitingApproval':
        setStatusFilter('pending_approval')
        break
      case 'inProgress':
        setStatusFilter('approved')
        break
      case 'outstandingBalance':
        setStatusFilter('completed')
        break
      case 'paid':
        setStatusFilter('paid')
        break
    }
  }

  const handleJobClick = async (job: TransformedJob) => {
    // Reload the job from Firestore to get the latest data including Cost object
    try {
      const jobRef = doc(db, 'jobs', job.id)
      const jobDoc = await getDoc(jobRef)
      if (jobDoc.exists()) {
        const jobData = jobDoc.data()
        // Merge the fresh Firestore data with the transformed job
        const freshJob = {
          ...job,
          ...jobData,
          Cost: jobData.Cost || job.Cost,
          materials: jobData.materials || job.materials || [],
          payroll: jobData.payroll || job.payroll || [],
        }
        setSelectedJob(freshJob as TransformedJob)
      } else {
        setSelectedJob(job)
      }
    } catch (error) {
      console.error('Error loading fresh job data:', error)
      setSelectedJob(job)
    }
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
      // Get existing materials to preserve order status and order links
      const existingCost = (selectedJob as any).Cost || {}
      const existingMaterials = existingCost.materials || []
      
      const materialsWithDetails = selectedMaterials.map(sel => {
        const material = allMaterials.find(mat => mat.id === sel.materialId)
        const unitCost = material ? material.cost : 0
        const totalCost = unitCost * sel.quantity
        
        // Get order status and link from state (user-controlled)
        const ordered = materialOrderStatus[sel.materialId] || false
        const orderLink = materialOrderLinks[sel.materialId] || ''
        
        return {
          materialId: sel.materialId,
          name: material ? material.name : 'Unknown Material',
          quantity: sel.quantity,
          unitCost: unitCost,
          totalCost: totalCost,
          ordered: ordered, // User-controlled order status
          orderLink: orderLink, // User-controlled order link
        }
      })
      const materialsCost = materialsWithDetails.reduce((sum, mat) => sum + mat.totalCost, 0)

      const materialsToSave: { materialId: string; quantity: number }[] = materialsWithDetails.map(m => ({ materialId: m.materialId, quantity: m.quantity }))
      
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
      
      // Reload jobs to get fresh data from Firestore
      await loadJobs()
      
      // Reload the selected job from Firestore to get the latest data
      try {
        const jobRef = doc(db, 'jobs', selectedJob.id)
        const jobDoc = await getDoc(jobRef)
        if (jobDoc.exists()) {
          const jobData = jobDoc.data()
          const updatedJob = {
            ...selectedJob,
            ...jobData,
            Cost: jobData.Cost || newCost,
            materials: jobData.materials || materialsWithDetails,
            materialsCost: jobData.materialsCost || materialsCost,
          }
          setSelectedJob(updatedJob as TransformedJob)
        } else {
          // Fallback to local update if Firestore fetch fails
          const updatedJob = { 
            ...selectedJob, 
            materialsCost, 
            selectedMaterials: materialsToSave,
            materials: materialsWithDetails,
            Cost: newCost
          }
          setSelectedJob(updatedJob)
        }
      } catch (error) {
        console.error('Error reloading job after save:', error)
        // Fallback to local update
        const updatedJob = { 
          ...selectedJob, 
          materialsCost, 
          selectedMaterials: materialsToSave,
          materials: materialsWithDetails,
          Cost: newCost
        }
        setSelectedJob(updatedJob)
      }
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
      const hours = totalDays * hoursPerDay

      const payrollWithDetails = selectedEmployees.map(empId => {
        const employee = allEmployees.find(emp => emp.uid === empId)
        const hourlyRate = employee?.hourlyRate || 0
        const employeeHours = totalDays * hoursPerDay
        return {
          employeeId: empId,
          employeeName: employee?.name || 'Unknown Employee',
          hourlyRate,
          hours: employeeHours,
          totalCost: hourlyRate * employeeHours
        }
      })
      const payrollCost = payrollWithDetails.reduce((sum, emp) => sum + emp.totalCost, 0)

      const existingCost = (selectedJob as any).Cost || {}
      const newCost = {
        ...existingCost,
        hoursPerDay, // Save hours per day in Cost object
        payrollCost,
        payroll: payrollWithDetails,
        totalCost: (existingCost.materialsCost || 0) + payrollCost
      }

      await updateJobData(selectedJob.id, {
        assignedEmployees: selectedEmployees,
        totalDays,
        hoursPerDay, // Save hours per day at top level too
        payrollCost,
        payroll: payrollWithDetails,
        Cost: newCost,
      })
      showToast('Employees and payroll saved successfully', 'success')
      
      // Reload jobs to get fresh data from Firestore
      await loadJobs()
      
      // Reload the selected job from Firestore to get the latest data
      try {
        const jobRef = doc(db, 'jobs', selectedJob.id)
        const jobDoc = await getDoc(jobRef)
        if (jobDoc.exists()) {
          const jobData = jobDoc.data()
          const updatedJob = {
            ...selectedJob,
            ...jobData,
            Cost: jobData.Cost || newCost,
            payroll: jobData.payroll || payrollWithDetails,
            payrollCost: jobData.payrollCost || payrollCost,
            assignedEmployees: jobData.assignedEmployees || selectedEmployees,
          }
          setSelectedJob(updatedJob as TransformedJob)
        } else {
          // Fallback to local update if Firestore fetch fails
          const updatedJob = { 
            ...selectedJob, 
            assignedEmployees: selectedEmployees, 
            totalDays, 
            payrollCost,
            payroll: payrollWithDetails as any,
            Cost: newCost
          }
          setSelectedJob(updatedJob)
        }
      } catch (error) {
        console.error('Error reloading job after save:', error)
        // Fallback to local update
        const updatedJob = { 
          ...selectedJob, 
          assignedEmployees: selectedEmployees, 
          totalDays, 
          payrollCost,
          payroll: payrollWithDetails as any,
          Cost: newCost
        }
        setSelectedJob(updatedJob)
      }
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
          <div className="flex-1 min-w-[200px] relative date-range-picker-container">
            <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
            <Button
              variant="outline"
              onClick={() => setShowDateRangePicker(!showDateRangePicker)}
              className="w-full justify-between"
            >
              {dateRangeStart && dateRangeEnd 
                ? `${new Date(dateRangeStart).toLocaleDateString()} - ${new Date(dateRangeEnd).toLocaleDateString()}`
                : dateRangeStart
                ? `From ${new Date(dateRangeStart).toLocaleDateString()}`
                : dateRangeEnd
                ? `Until ${new Date(dateRangeEnd).toLocaleDateString()}`
                : 'Select Date Range'}
              <Calendar className="h-4 w-4" />
            </Button>
            {showDateRangePicker && (
              <div className="absolute z-50 mt-2 bg-base border border-accent/20 rounded-lg shadow-lg p-4 min-w-[600px] date-range-picker-container">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <DatePicker
                      date={dateRangeStart}
                      onDateChange={(date) => {
                        setDateRangeStart(date)
                        if (date && dateRangeEnd && new Date(date) > new Date(dateRangeEnd)) {
                          setDateRangeEnd('')
                        }
                      }}
                      label="Start Date"
                    />
                  </div>
                  <div className="flex-1">
                    <DatePicker
                      date={dateRangeEnd}
                      onDateChange={(date) => {
                        setDateRangeEnd(date)
                        if (date && dateRangeStart && new Date(date) < new Date(dateRangeStart)) {
                          setDateRangeStart('')
                        }
                      }}
                      label="End Date"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setDateRangeStart('')
                      setDateRangeEnd('')
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDateRangePicker(false)}
                  >
                    Apply
                  </Button>
                </div>
              </div>
            )}
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
          onClick={() => handlePriorityClick('inProgress')}
          className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 hover:bg-blue-500/30 transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-400">In Progress</span>
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{priorityCounts.inProgress}</div>
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
          onClick={() => handlePriorityClick('paid')}
          className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 hover:bg-green-500/30 transition-colors text-left"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-400">Paid</span>
            <CheckCircle2 className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{priorityCounts.paid}</div>
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
                            job.paid && 'bg-purple-500/20 text-purple-400',
                            !job.paid && job.status === 'approved' && 'bg-green-500/20 text-green-400',
                            !job.paid && job.status === 'pending_approval' && 'bg-yellow-500/20 text-yellow-400',
                            !job.paid && job.status === 'in_progress' && 'bg-blue-500/20 text-blue-400',
                            !job.paid && job.status === 'completed' && 'bg-gray-500/20 text-gray-400',
                            !job.paid && job.status === 'draft' && 'bg-gray-500/20 text-gray-400',
                          )}>
                            {job.paid ? 'PAID' : job.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm space-y-1">
                            {(() => {
                              // Get cost data from Cost object or top-level fields
                              const costData = (job as any).Cost || {}
                              const materialsCost = costData.materialsCost !== undefined ? costData.materialsCost : ((job as any).materialsCost !== undefined ? (job as any).materialsCost : 0)
                              const payrollCost = costData.payrollCost !== undefined ? costData.payrollCost : ((job as any).payrollCost !== undefined ? (job as any).payrollCost : 0)
                              
                              // Always calculate actual cost: materials + payroll (no fallback to estimated)
                              const actualCost = materialsCost + payrollCost
                              
                              // Calculate profit: revenue - actual cost
                              const revenue = job.revenue || 0
                              const profit = revenue - actualCost
                              
                              // Debug logging
                              console.log('🟣 Job Table - Cost Calculation:', {
                                jobId: job.id,
                                jobName: job.name,
                                revenue,
                                materialsCost,
                                payrollCost,
                                actualCost,
                                profit,
                                costData,
                                jobCost: job.cost,
                                jobObject: {
                                  hasCost: !!(job as any).Cost,
                                  Cost: (job as any).Cost,
                                  topLevelMaterialsCost: (job as any).materialsCost,
                                  topLevelPayrollCost: (job as any).payrollCost,
                                }
                              })
                              
                              return (
                                <>
                                  <div className="text-foreground">${revenue.toLocaleString()}</div>
                                  <div className="text-foreground/70">${actualCost.toLocaleString()}</div>
                                  <div className={cn(
                                    'font-semibold',
                                    profit > 0 ? 'text-green-400' : profit < 0 ? 'text-red-400' : 'text-foreground/70'
                                  )}>
                                    ${profit.toLocaleString()}
                                  </div>
                                </>
                              )
                            })()}
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
          {selectedJob && showJobDrawer ? (
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
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Cost Breakdown
                      </Button>
                    </>
                  )}
                  {selectedJob.status === 'in_progress' && (
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
            <>
              {/* Quick Actions */}
              <div className="bg-base border border-accent/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {/* Add Material */}
                  <div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowQuickAddMaterial(!showQuickAddMaterial)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Add Material
                    </Button>
                    {showQuickAddMaterial && (
                      <div className="mt-3 p-3 bg-foreground/5 border border-accent/20 rounded-lg space-y-3">
                        <Input
                          label="Material Name"
                          value={quickMaterialName}
                          onChange={(e) => setQuickMaterialName(e.target.value)}
                          placeholder="e.g., Cinder Block"
                        />
                        <Input
                          label="Cost per Unit"
                          type="number"
                          value={quickMaterialCost}
                          onChange={(e) => setQuickMaterialCost(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                              if (!quickMaterialName.trim() || !quickMaterialCost) {
                                showToast('Please fill in all fields', 'error')
                                return
                              }
                              try {
                                const cost = parseFloat(quickMaterialCost)
                                if (isNaN(cost) || cost < 0) {
                                  showToast('Please enter a valid cost', 'error')
                                  return
                                }
                                await addMaterial(quickMaterialName.trim(), cost)
                                showToast('Material added successfully', 'success')
                                setQuickMaterialName('')
                                setQuickMaterialCost('')
                                setShowQuickAddMaterial(false)
                                await loadMaterials()
                              } catch (error: any) {
                                showToast(error.message || 'Failed to add material', 'error')
                              }
                            }}
                          >
                            Add
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowQuickAddMaterial(false)
                              setQuickMaterialName('')
                              setQuickMaterialCost('')
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Add Service */}
                  <div>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => setShowQuickAddService(!showQuickAddService)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Service
                    </Button>
                    {showQuickAddService && (
                      <div className="mt-3 p-3 bg-foreground/5 border border-accent/20 rounded-lg space-y-3">
                        <Input
                          label="Description"
                          value={quickServiceDescription}
                          onChange={(e) => setQuickServiceDescription(e.target.value)}
                          placeholder="e.g., Set single wide"
                        />
                        <Input
                          label="Price"
                          type="number"
                          value={quickServicePrice}
                          onChange={(e) => setQuickServicePrice(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                        />
                        <Input
                          label="Time Estimation (days)"
                          type="text"
                          value={quickServiceTimeEstimate}
                          onChange={(e) => setQuickServiceTimeEstimate(e.target.value)}
                          placeholder="e.g., 3"
                        />
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Required Materials (Optional)
                          </label>
                          <div className="space-y-2 max-h-60 overflow-y-auto border border-accent/20 rounded-lg p-3">
                            {allMaterials.length === 0 ? (
                              <p className="text-sm text-foreground/70">No materials available. Add materials first.</p>
                            ) : (
                              allMaterials.map((material) => {
                                const isSelected = quickServiceRequiredMaterials.includes(material.id)
                                const quantity = quickServiceMaterialQuantities[material.id] || 1
                                const cost = quickServiceMaterialCosts[material.id] !== undefined 
                                  ? quickServiceMaterialCosts[material.id] 
                                  : material.cost
                                
                                return (
                                  <div
                                    key={material.id}
                                    className={cn(
                                      'p-2 rounded border transition-colors',
                                      isSelected ? 'border-accent bg-accent/10' : 'border-accent/20 hover:border-accent/40'
                                    )}
                                  >
                                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setQuickServiceRequiredMaterials(prev => [...prev, material.id])
                                            setQuickServiceMaterialQuantities(prev => ({ ...prev, [material.id]: 1 }))
                                            setQuickServiceMaterialCosts(prev => ({ ...prev, [material.id]: material.cost }))
                                          } else {
                                            setQuickServiceRequiredMaterials(prev => prev.filter(id => id !== material.id))
                                            const newQuantities = { ...quickServiceMaterialQuantities }
                                            delete newQuantities[material.id]
                                            setQuickServiceMaterialQuantities(newQuantities)
                                            const newCosts = { ...quickServiceMaterialCosts }
                                            delete newCosts[material.id]
                                            setQuickServiceMaterialCosts(newCosts)
                                          }
                                        }}
                                        className="rounded border-accent/30 bg-base text-accent"
                                      />
                                      <span className="text-sm font-medium text-foreground flex-1">{material.name}</span>
                                    </label>
                                    {isSelected && (
                                      <div className="mt-2 grid grid-cols-2 gap-2">
                                        <div>
                                          <label className="text-xs text-foreground/70 mb-1 block">Quantity</label>
                                          <Input
                                            type="number"
                                            value={quantity}
                                            onChange={(e) => {
                                              const val = parseFloat(e.target.value) || 1
                                              setQuickServiceMaterialQuantities(prev => ({ ...prev, [material.id]: val }))
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-8 text-sm"
                                            min="1"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-xs text-foreground/70 mb-1 block">Cost per Unit</label>
                                          <Input
                                            type="number"
                                            value={cost}
                                            onChange={(e) => {
                                              const val = parseFloat(e.target.value) || 0
                                              setQuickServiceMaterialCosts(prev => ({ ...prev, [material.id]: val }))
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-8 text-sm"
                                            step="0.01"
                                            min="0"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )
                              })
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={async () => {
                              if (!quickServiceDescription.trim() || !quickServicePrice || !quickServiceTimeEstimate.trim()) {
                                showToast('Please fill in all fields', 'error')
                                return
                              }
                              try {
                                const price = parseFloat(quickServicePrice)
                                if (isNaN(price) || price < 0) {
                                  showToast('Please enter a valid price', 'error')
                                  return
                                }
                                // Prepare materials data with quantity and cost
                                const materialsData = quickServiceRequiredMaterials.map(materialId => ({
                                  materialId,
                                  quantity: quickServiceMaterialQuantities[materialId] || 1,
                                  cost: quickServiceMaterialCosts[materialId] !== undefined 
                                    ? quickServiceMaterialCosts[materialId] 
                                    : allMaterials.find(m => m.id === materialId)?.cost || 0
                                }))
                                
                                await addService(
                                  quickServiceDescription.trim(), 
                                  price, 
                                  quickServiceTimeEstimate.trim(),
                                  quickServiceRequiredMaterials, // Material IDs for backward compatibility
                                  materialsData // Full material data with quantity and cost
                                )
                                showToast('Service added successfully', 'success')
                                setQuickServiceDescription('')
                                setQuickServicePrice('')
                                setQuickServiceTimeEstimate('')
                                setQuickServiceRequiredMaterials([])
                                setQuickServiceMaterialQuantities({})
                                setQuickServiceMaterialCosts({})
                                setShowQuickAddService(false)
                              } catch (error: any) {
                                showToast(error.message || 'Failed to add service', 'error')
                              }
                            }}
                          >
                            Add
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowQuickAddService(false)
                              setQuickServiceDescription('')
                              setQuickServicePrice('')
                              setQuickServiceTimeEstimate('')
                              setQuickServiceRequiredMaterials([])
                              setQuickServiceMaterialQuantities({})
                              setQuickServiceMaterialCosts({})
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Job Detail Drawer */}
      {showJobDrawer && selectedJob && (
        <div className="fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => {
            setShowJobDrawer(false)
            setSelectedJob(null)
          }} />
          <div className="relative z-50 w-full max-w-4xl bg-base border-l border-accent/20 ml-auto h-full overflow-y-auto">
            <div className="sticky top-0 bg-base border-b border-accent/20 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{selectedJob.location || selectedJob.name}</h2>
                <p className="text-foreground/70">{selectedJob.customerName || selectedJob.customerEmail}</p>
              </div>
              <button
                onClick={() => {
                  setShowJobDrawer(false)
                  setSelectedJob(null)
                }}
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
                      const ordered = materialOrderStatus[material.id] || false
                      const orderLink = materialOrderLinks[material.id] || ''
                      const isEditingLink = editingOrderLink === material.id
                      
                      return (
                        <div
                          key={material.id}
                          className={cn(
                            'p-4 border rounded-lg transition-colors',
                            isSelected ? 'border-accent bg-accent/10' : 'border-accent/20 hover:border-accent/40'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleMaterialToggle(material.id)}
                                className="rounded border-accent/30 bg-base text-accent cursor-pointer"
                              />
                              <div className="flex-1">
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
                          
                          {isSelected && (
                            <div className="mt-3 pt-3 border-t border-accent/20 space-y-2">
                              <div className="flex items-center justify-between">
                                <label className="text-sm text-foreground/70 flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={ordered}
                                    onChange={(e) => {
                                      setMaterialOrderStatus(prev => ({
                                        ...prev,
                                        [material.id]: e.target.checked
                                      }))
                                    }}
                                    className="rounded border-accent/30 bg-base text-accent cursor-pointer"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span>Ordered</span>
                                </label>
                                {ordered && (
                                  <span className="text-xs text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Ordered
                                  </span>
                                )}
                              </div>
                              
                              <div className="space-y-1">
                                {isEditingLink ? (
                                  <div className="flex gap-2">
                                    <Input
                                      type="url"
                                      value={tempOrderLink}
                                      onChange={(e) => setTempOrderLink(e.target.value)}
                                      placeholder="https://..."
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 text-sm"
                                    />
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setMaterialOrderLinks(prev => ({
                                          ...prev,
                                          [material.id]: tempOrderLink
                                        }))
                                        setEditingOrderLink(null)
                                        setTempOrderLink('')
                                      }}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setEditingOrderLink(null)
                                        setTempOrderLink('')
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    {orderLink ? (
                                      <a
                                        href={orderLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="text-sm text-accent hover:underline flex items-center gap-1"
                                      >
                                        <ArrowRight className="h-3 w-3" />
                                        Order Link
                                      </a>
                                    ) : (
                                      <span className="text-sm text-foreground/50">No order link</span>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setTempOrderLink(orderLink)
                                        setEditingOrderLink(material.id)
                                      }}
                                      className="text-xs"
                                    >
                                      {orderLink ? 'Edit' : 'Add Link'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
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

                  {/* Hours per Day Setting */}
                  <div className="bg-foreground/5 border border-accent/20 rounded-lg p-4">
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Hours per Day
                    </label>
                    <Input
                      type="number"
                      value={hoursPerDay}
                      onChange={(e) => setHoursPerDay(Math.max(1, parseInt(e.target.value) || 10))}
                      min="1"
                      className="w-32"
                    />
                    <p className="text-xs text-foreground/70 mt-1">
                      Default: 10 hours. This affects payroll calculations for all selected employees.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {allEmployees.map((employee) => {
                      const isSelected = selectedEmployees.includes(employee.uid)
                      const totalDays = selectedJob.jobs?.reduce((sum, job) => sum + (job.timeEstimate || 0), 0) || 0
                      const hours = totalDays * hoursPerDay
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
                        <span className="text-foreground/70">Hours per Day:</span>
                        <span className="text-foreground">{hoursPerDay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-foreground/70">Estimated Payroll:</span>
                        <span className="text-foreground font-semibold">
                          ${selectedEmployees.reduce((sum, empId) => {
                            const emp = allEmployees.find(e => e.uid === empId)
                            const days = selectedJob.jobs?.reduce((s, j) => s + (j.timeEstimate || 0), 0) || 0
                            return sum + (emp ? emp.hourlyRate * days * hoursPerDay : 0)
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
                    <div>
                      <input
                        type="file"
                        id="photo-upload-input"
                        multiple
                        accept="image/*"
                        onChange={(e) => handlePhotoUpload(e.target.files)}
                        className="hidden"
                      />
                      <Button 
                        variant="primary"
                        onClick={() => {
                          const input = document.getElementById('photo-upload-input')
                          if (input) {
                            input.click()
                          }
                        }}
                        disabled={uploadingPhotos}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                      </Button>
                    </div>
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
