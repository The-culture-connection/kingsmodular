# Job Suite Feature Implementation Checklist

This document outlines all features in the Job Suite page that need functional implementation.

## 🔴 Critical Core Features (Must Have)

### 1. Data Fetching & State Management
- [ ] **Fetch jobs from Firestore**
  - Query all jobs from the `Jobs` collection or appropriate collection
  - Handle loading states
  - Handle error states
  - Real-time updates (optional: use Firestore listeners)

- [ ] **Job Data Structure**
  - Map Firestore job documents to the Job interface
  - Handle missing/optional fields gracefully
  - Transform data types (dates, numbers, booleans)

### 2. Priority Strip Functionality
- [ ] **Calculate Real Counts**
  - Jobs Awaiting Approval: Count jobs with `status === 'pending_approval'`
  - Outstanding Balance: Count approved jobs where `paid === false`
  - Ready to Close: Count in-progress jobs with all close-out criteria met
  - Missing Photos: Count in-progress jobs where `photosUploaded === false`

- [ ] **Priority Card Click Actions**
  - Filter jobs by the clicked priority category
  - Update status filter state
  - Scroll to job table

### 3. Job Table Features
- [ ] **Table Data Population**
  - Display real jobs from Firestore
  - Handle empty state (no jobs found)
  - Handle loading state with skeleton/spinner

- [ ] **Job Row Click Handler**
  - Open job detail drawer
  - Load full job details
  - Set selected job state

- [ ] **Status Filter**
  - Filter jobs by selected status
  - Update URL query params (optional for shareable links)
  - Persist filter state

- [ ] **Date Range Filter**
  - Filter jobs by start/end date range
  - Update job list dynamically

- [ ] **Customer/Job Name Search**
  - Real-time search/filter as user types
  - Search in job name, site, customer name
  - Debounce search input

- [ ] **Table Actions (MoreVertical menu)**
  - View job details
  - Edit job
  - Delete job (with confirmation)
  - Duplicate job
  - Export job data

### 4. Job Detail Drawer
- [ ] **Drawer State Management**
  - Open/close drawer
  - Handle escape key to close
  - Handle backdrop click to close
  - Prevent body scroll when open

- [ ] **Tab Navigation**
  - Switch between tabs (Overview, Financials, Materials, Payroll, Photos, Activity)
  - Persist selected tab in state
  - Load tab-specific data on selection

- [ ] **Overview Tab**
  - Display job basic info (name, site, status, dates, customer)
  - Show job description/notes
  - Display assigned crew members
  - Show job location with map link (optional)

- [ ] **Financials Tab**
  - Revenue breakdown by line items
  - Cost breakdown (materials, labor, overhead)
  - Profit margin visualization (chart/graph)
  - Expense tracking with categories
  - Payment history/status
  - Invoice generation/download

- [ ] **Materials Tab**
  - List of materials required
  - Material costs
  - Purchase orders
  - Delivery status
  - Add/edit/remove materials

- [ ] **Payroll Tab**
  - Assigned employees/crew
  - Hours worked per employee
  - Payroll costs
  - Pay status (paid/pending)
  - Payroll calculations

- [ ] **Photos Tab**
  - Display uploaded photos in grid/gallery
  - Upload new photos
  - Delete photos
  - Photo organization (categories/tags)
  - Photo metadata (date, location, description)

- [ ] **Activity Tab**
  - Timeline of job events/updates
  - Status changes history
  - Comments/notes
  - File uploads
  - User actions log

### 5. Job Actions Panel (Right Sidebar)
- [ ] **Contextual Actions Based on Job Status**

  - [ ] **If Status = 'approved':**
    - Schedule Job → Navigate to schedule page or open scheduling modal
    - Assign Crew → Open crew assignment modal/interface

  - [ ] **If Status = 'in_progress':**
    - Upload Photos → Open photo upload interface
    - View Cost Breakdown → Show detailed cost breakdown modal/page
    - Track Expenses → Open expense tracking interface

  - [ ] **If Ready to Close (all criteria met):**
    - Finalize Price → Open price finalization form/modal
    - Generate Invoice → Trigger invoice generation
    - Close Job → Execute job closure workflow

- [ ] **Action Button Handlers**
  - Each button needs actual functionality
  - Show loading states during actions
  - Show success/error feedback
  - Update job state after actions

### 6. Financial Snapshot Panel
- [ ] **Calculate Financial Metrics**
  - Revenue: Sum of job line items
  - Expenses: Sum of costs (materials, payroll, overhead)
  - Profit: Revenue - Expenses
  - Margin: (Profit / Revenue) * 100

- [ ] **Health Color Coding**
  - Green: Profit > 20% margin or positive profit
  - Yellow: Profit 0-20% margin
  - Red: Negative profit or losses

- [ ] **Real-time Updates**
  - Update when expenses are added/modified
  - Update when revenue changes
  - Recalculate on job updates

### 7. Close-Out Checklist
- [ ] **Checklist Item States**
  - Photos Uploaded: Check if photos exist for job
  - Materials Finalized: Check if materials are marked as finalized
  - Payroll Complete: Check if payroll is processed
  - Invoice Drafted: Check if invoice exists

- [ ] **Checklist Actions**
  - Click on incomplete items → Navigate to relevant section
  - Mark items as complete (if user has permission)
  - Visual indicators (checkmarks, pending icons)

- [ ] **Finalize Job Button**
  - Enable only when all checklist items are complete
  - Execute job closure workflow
  - Generate final invoice
  - Update job status to 'completed'
  - Show confirmation modal before closing

### 8. Schedule Preview
- [ ] **Schedule Display**
  - Show mini calendar view
  - Highlight current job dates
  - Show other jobs on timeline (optional)
  - Display date conflicts if any

- [ ] **View Full Schedule Link**
  - Navigate to full schedule page
  - Pass current job context

### 9. Header Actions
- [ ] **Create Job Button**
  - Open job creation form/modal
  - Or navigate to job creation page
  - Handle form submission
  - Create job in Firestore
  - Update job list after creation

- [ ] **Upload Photos Button**
  - Open photo upload interface
  - Handle multiple file uploads
  - Upload to Firebase Storage
  - Associate photos with jobs
  - Show upload progress

## 🟡 Important Secondary Features (Should Have)

### 10. Job Status Management
- [ ] **Update Job Status**
  - Change status workflow (draft → pending_approval → approved → in_progress → completed)
  - Status change validation (ensure prerequisites are met)
  - Status change history tracking
  - Notifications on status changes (optional)

- [ ] **Approve/Deny Jobs**
  - Approve pending jobs
  - Deny/reject jobs with reason
  - Update approval status

### 11. Job Editing
- [ ] **Edit Job Details**
  - Open edit form/modal
  - Update job information
  - Save changes to Firestore
  - Validate required fields
  - Handle concurrent edits (optional)

### 12. Job Deletion
- [ ] **Delete Job**
  - Confirmation modal
  - Soft delete (mark as deleted) or hard delete
  - Handle related data (photos, invoices, etc.)
  - Update job list

### 13. Bulk Operations
- [ ] **Multi-select Jobs**
  - Select multiple jobs via checkboxes
  - Bulk status updates
  - Bulk export
  - Bulk delete (with confirmation)

### 14. Sorting & Pagination
- [ ] **Table Sorting**
  - Sort by column (name, date, revenue, status)
  - Toggle ascending/descending
  - Visual sort indicators

- [ ] **Pagination**
  - Handle large job lists
  - Page navigation
  - Items per page selector
  - Virtual scrolling (optional for performance)

### 15. Export/Reporting
- [ ] **Export Jobs**
  - Export to CSV/Excel
  - Export to PDF
  - Filter exported data by current filters
  - Include selected columns only

### 16. Notifications/Alerts
- [ ] **Real-time Updates**
  - Show notifications for job status changes
  - Alert on priority items
  - Toast notifications for actions

## 🟢 Nice-to-Have Features (Optional Enhancements)

### 17. Advanced Filtering
- [ ] **Multi-filter Support**
  - Combine status + date + customer filters
  - Save filter presets
  - Clear all filters button

### 18. Drag & Drop
- [ ] **Reorder Jobs**
  - Drag jobs to reorder (if priority-based ordering)
  - Drag photos to reorder in gallery

### 19. Keyboard Shortcuts
- [ ] **Shortcut Support**
  - Esc to close drawer
  - Cmd/Ctrl+K for search
  - Arrow keys for table navigation

### 20. Advanced Search
- [ ] **Full-text Search**
  - Search across all job fields
  - Search suggestions/autocomplete
  - Search history

### 21. Analytics/Dashboard Integration
- [ ] **Job Metrics**
  - Total revenue/cost/profit across all jobs
  - Job completion rate
  - Average job duration
  - Top performing jobs

### 22. Integration Features
- [ ] **Calendar Integration**
  - Sync with Google Calendar
  - Export schedule to calendar

- [ ] **Email Integration**
  - Send job updates via email
  - Email invoices

### 23. Mobile Optimization
- [ ] **Responsive Design**
  - Mobile-friendly table (cards on small screens)
  - Touch-friendly interactions
  - Mobile drawer behavior

## 📋 Data Model Requirements

### Job Document Structure (Firestore)
```typescript
interface Job {
  id: string
  name: string
  description?: string
  site?: string
  customerId: string
  customerName?: string
  status: 'draft' | 'pending_approval' | 'approved' | 'in_progress' | 'completed'
  revenue: number
  cost: number
  profit: number
  startDate: string // ISO date string
  endDate: string // ISO date string
  approved: boolean
  paid: boolean
  photosUploaded: boolean
  materialsFinalized: boolean
  payrollPending: boolean
  invoiceDrafted: boolean
  assignedCrew?: string[] // User IDs
  location?: {
    address: string
    city: string
    state: string
    zip: string
    coordinates?: { lat: number, lng: number }
  }
  materials?: Material[]
  expenses?: Expense[]
  photos?: Photo[]
  invoices?: Invoice[]
  createdAt: Timestamp
  updatedAt: Timestamp
  createdBy: string // User ID
}
```

### Related Collections/Subcollections
- [ ] `jobs/{jobId}/materials` - Materials subcollection
- [ ] `jobs/{jobId}/expenses` - Expenses subcollection
- [ ] `jobs/{jobId}/photos` - Photos subcollection
- [ ] `jobs/{jobId}/invoices` - Invoices subcollection
- [ ] `jobs/{jobId}/activity` - Activity log subcollection

## 🔧 Technical Implementation Notes

### API Routes Needed
- [ ] `GET /api/admin/jobs` - Fetch all jobs with filters
- [ ] `GET /api/admin/jobs/[id]` - Fetch single job details
- [ ] `POST /api/admin/jobs` - Create new job
- [ ] `PATCH /api/admin/jobs/[id]` - Update job
- [ ] `DELETE /api/admin/jobs/[id]` - Delete job
- [ ] `POST /api/admin/jobs/[id]/photos` - Upload photos
- [ ] `POST /api/admin/jobs/[id]/close` - Close job
- [ ] `POST /api/admin/jobs/[id]/approve` - Approve job
- [ ] `GET /api/admin/jobs/[id]/financials` - Get financial breakdown
- [ ] `GET /api/admin/jobs/[id]/export` - Export job data

### Firebase Storage
- [ ] Photo storage path: `jobs/{jobId}/photos/{photoId}`
- [ ] File upload handling
- [ ] Image optimization/thumbnail generation

### Real-time Updates
- [ ] Consider Firestore listeners for real-time job updates
- [ ] Debounce frequent updates
- [ ] Handle offline scenarios

## 🎯 Priority Order for Implementation

1. **Phase 1: Core Data & Display**
   - Fetch jobs from Firestore
   - Display jobs in table
   - Basic filtering
   - Job detail drawer (Overview tab)

2. **Phase 2: Job Management**
   - Create job
   - Update job status
   - Edit job details
   - Job actions (approve, schedule, assign crew)

3. **Phase 3: Financial & Close-Out**
   - Financial calculations
   - Financial snapshot
   - Close-out checklist
   - Invoice generation

4. **Phase 4: Advanced Features**
   - Photo uploads
   - Materials management
   - Payroll integration
   - Activity logging

5. **Phase 5: Polish & Enhancement**
   - Sorting & pagination
   - Export functionality
   - Advanced filtering
   - Mobile optimization

