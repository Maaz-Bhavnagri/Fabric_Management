'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Plus,
  Edit,
  Trash2,
  Tag,
  Sparkles,
  Upload,
  Download,
  Search,
  Check,
  X,
} from 'lucide-react'

interface StitchType {
  id: string
  name: string
  isPopular: boolean
  createdAt: string
}

export default function StitchTypesManagement() {
  const { toast } = useToast()
  const [stitchTypes, setStitchTypes] = useState<StitchType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingStitchType, setEditingStitchType] = useState<StitchType | null>(null)
  const [bulkAddText, setBulkAddText] = useState('')
  const [bulkAddPopular, setBulkAddPopular] = useState(false)

  // Fetch stitch types
  useEffect(() => {
    fetchStitchTypes()
  }, [])

  const fetchStitchTypes = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/stitch-types')
      const data = await response.json()
      if (data.success) {
        setStitchTypes(data.data)
      } else {
        toast({
          title: 'Failed to fetch stitch types',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load stitch types',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter stitch types based on search
  const filteredStitchTypes = stitchTypes.filter(type =>
    type.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handle bulk add
  const handleBulkAdd = async () => {
    const lines = bulkAddText.split('\n').filter(line => line.trim())
    const stitchTypesToAdd = lines.map(line => ({
      name: line.trim(),
      isPopular: bulkAddPopular
    }))

    try {
      const response = await fetch('/api/stitch-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stitchTypes: stitchTypesToAdd })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Success',
          description: `Added ${data.data.length} stitch types successfully`,
        })
        setBulkAddText('')
        setBulkAddPopular(false)
        setShowBulkAddDialog(false)
        fetchStitchTypes() // Refresh list
      } else {
        toast({
          title: 'Failed to add stitch types',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add stitch types',
        variant: 'destructive'
      })
    }
  }

  // Handle edit
  const handleEdit = (stitchType: StitchType) => {
    setEditingStitchType(stitchType)
    setShowEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!editingStitchType) return

    try {
      const response = await fetch('/api/stitch-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingStitchType)
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Stitch type updated successfully',
        })
        setShowEditDialog(false)
        setEditingStitchType(null)
        fetchStitchTypes() // Refresh list
      } else {
        toast({
          title: 'Failed to update',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update stitch type',
        variant: 'destructive'
      })
    }
  }

  // Handle delete
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/stitch-types?id=${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Stitch type deleted successfully',
        })
        fetchStitchTypes() // Refresh list
      } else {
        toast({
          title: 'Failed to delete',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete stitch type',
        variant: 'destructive'
      })
    }
  }

  // Handle toggle popular
  const handleTogglePopular = async (stitchType: StitchType) => {
    try {
      const response = await fetch('/api/stitch-types', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...stitchType,
          isPopular: !stitchType.isPopular
        })
      })

      const data = await response.json()
      if (data.success) {
        toast({
          title: 'Success',
          description: `Stitch type marked as ${!stitchType.isPopular ? 'popular' : 'regular'}`,
        })
        fetchStitchTypes() // Refresh list
      } else {
        toast({
          title: 'Failed to update',
          description: data.error,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update stitch type',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Stitch Types Management</h1>
        <p className="text-muted-foreground">
          Manage stitch types for tailoring orders. Popular types appear as quick-select options in the order form.
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search stitch types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={showBulkAddDialog} onOpenChange={setShowBulkAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Bulk Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Multiple Stitch Types</DialogTitle>
              <DialogDescription>
                Add multiple stitch types at once. Enter one type per line.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Stitch Types (one per line)
                </label>
                <textarea
                  placeholder="Shirt&#10;Pant&#10;Suit&#10;Lehenga&#10;Jacket"
                  value={bulkAddText}
                  onChange={(e) => setBulkAddText(e.target.value)}
                  className="w-full h-32 p-3 border border-border rounded-lg resize-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bulkPopular"
                  checked={bulkAddPopular}
                  onCheckedChange={(c) => setBulkAddPopular(c === true)}
                />
                <label htmlFor="bulkPopular" className="text-sm">
                  Mark all as popular
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleBulkAdd} disabled={!bulkAddText.trim()}>
                  Add All Types
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowBulkAddDialog(false)
                    setBulkAddText('')
                    setBulkAddPopular(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Tag className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stitchTypes.length}</p>
              <p className="text-sm text-muted-foreground">Total Types</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stitchTypes.filter(t => t.isPopular).length}
              </p>
              <p className="text-sm text-muted-foreground">Popular Types</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <Check className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {stitchTypes.length - stitchTypes.filter(t => t.isPopular).length}
              </p>
              <p className="text-sm text-muted-foreground">Regular Types</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stitch Types List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-border">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold">All Stitch Types</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading stitch types...</p>
          </div>
        ) : filteredStitchTypes.length === 0 ? (
          <div className="p-8 text-center">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No stitch types found matching your search.' : 'No stitch types found.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredStitchTypes.map((stitchType) => (
              <div
                key={stitchType.id}
                className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                      <Tag className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">{stitchType.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {stitchType.isPopular && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium rounded-full">
                            <Sparkles className="w-3 h-3" />
                            Popular
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          Created {new Date(stitchType.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleTogglePopular(stitchType)}
                      className="h-8 px-2"
                    >
                      {stitchType.isPopular ? (
                        <Sparkles className="w-4 h-4 text-amber-500" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-dashed border-muted-foreground rounded" />
                      )}
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(stitchType)}
                      className="h-8 px-2"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(stitchType.id, stitchType.name)}
                      className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stitch Type</DialogTitle>
            <DialogDescription>
              Update the stitch type details.
            </DialogDescription>
          </DialogHeader>
          {editingStitchType && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Stitch Type Name
                </label>
                <Input
                  value={editingStitchType.name}
                  onChange={(e) => setEditingStitchType({
                    ...editingStitchType,
                    name: e.target.value
                  })}
                  placeholder="e.g., Shirt"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editPopular"
                  checked={editingStitchType.isPopular}
                  onCheckedChange={(checked) => setEditingStitchType({
                    ...editingStitchType,
                    isPopular: checked === true
                  })}
                />
                <label htmlFor="editPopular" className="text-sm">
                  Mark as popular (shows as quick option in order form)
                </label>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdate}>
                  Update Stitch Type
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditDialog(false)
                    setEditingStitchType(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
