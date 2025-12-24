'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Package, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/lib/toast-context'
import { getAllMaterials, addMaterial, Material } from '@/lib/firebase/materials'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

export default function MaterialsPage() {
  const { showToast } = useToast()
  const [materials, setMaterials] = useState<Material[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newMaterialName, setNewMaterialName] = useState('')
  const [newMaterialCost, setNewMaterialCost] = useState('')

  useEffect(() => {
    loadMaterials()
  }, [])

  const loadMaterials = async () => {
    try {
      setIsLoading(true)
      const materialsData = await getAllMaterials()
      setMaterials(materialsData)
    } catch (error: any) {
      showToast(error.message || 'Failed to load materials', 'error')
    } finally {
      setIsLoading(false)
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
      setShowAddForm(false)
      await loadMaterials()
    } catch (error: any) {
      showToast(error.message || 'Failed to add material', 'error')
    }
  }

  const handleDeleteMaterial = async (materialId: string, materialName: string) => {
    if (!confirm(`Are you sure you want to delete "${materialName}"?`)) {
      return
    }

    try {
      const materialRef = doc(db, 'Materials', materialId)
      await deleteDoc(materialRef)
      showToast('Material deleted successfully', 'success')
      await loadMaterials()
    } catch (error: any) {
      showToast(error.message || 'Failed to delete material', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-foreground/70">Loading materials...</div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <Link href="/admin/suites/admin" className="text-accent hover:underline mb-2 inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin Suite
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
              <Package className="h-8 w-8 text-accent" />
              Materials Management
            </h1>
            <p className="text-foreground/70">Add and manage materials used in jobs</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Material
          </Button>
        </div>
      </div>

      {showAddForm && (
        <div className="bg-base border border-accent/20 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Add New Material</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Material Name"
              value={newMaterialName}
              onChange={(e) => setNewMaterialName(e.target.value)}
              placeholder="e.g., Cinder Block"
            />
            <Input
              label="Cost per Unit"
              type="number"
              value={newMaterialCost}
              onChange={(e) => setNewMaterialCost(e.target.value)}
              placeholder="0.00"
              step="0.01"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="primary" onClick={handleAddMaterial}>
              Add Material
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false)
                setNewMaterialName('')
                setNewMaterialCost('')
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="bg-base border border-accent/20 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-foreground/5 border-b border-accent/20">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Material Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Cost per Unit</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {materials.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-foreground/70">
                    No materials found. Add your first material above.
                  </td>
                </tr>
              ) : (
                materials.map((material) => (
                  <tr key={material.id} className="border-b border-accent/10 hover:bg-foreground/5">
                    <td className="px-4 py-3 text-foreground">{material.name}</td>
                    <td className="px-4 py-3 text-foreground">${material.cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteMaterial(material.id, material.name)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

