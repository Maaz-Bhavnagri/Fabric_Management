'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  X,
  Plus,
  Search,
  Tag,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react'      

interface StitchTypeOption {
  id: string
  name: string
  isPopular: boolean
}

interface StitchTypesSelectorProps {
  selectedTypes: string[]
  availableTypes: StitchTypeOption[]
  onChange: (types: string[]) => void
  disabled?: boolean
  placeholder?: string
}

export default function StitchTypesSelector({
  selectedTypes,
  availableTypes,
  onChange,
  disabled = false,
  placeholder = 'Select stitch types...',
}: StitchTypesSelectorProps) {
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setIsCreatingNew(false)
        setNewTypeName('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter available types based on search query
  const filteredTypes = useMemo(() => {
    if (!searchQuery.trim()) return availableTypes
    
    const query = searchQuery.toLowerCase()
    return availableTypes.filter(type => 
      type.name.toLowerCase().includes(query)
    )
  }, [availableTypes, searchQuery])

  // Separate popular and regular types
  const { popularTypes, regularTypes } = useMemo(() => {
    const popular = filteredTypes.filter(type => type.isPopular)
    const regular = filteredTypes.filter(type => !type.isPopular)
    return { popularTypes: popular, regularTypes: regular }
  }, [filteredTypes])

  // Check if a type is selected
  const isTypeSelected = (typeId: string) => selectedTypes.includes(typeId)

  // Get selected type names for display
  const selectedTypeNames = useMemo(() => {
    return selectedTypes.map(typeId => {
      const type = availableTypes.find(t => t.id === typeId)
      return type?.name || typeId
    })
  }, [selectedTypes, availableTypes])

  // Toggle type selection
  const toggleType = (typeId: string) => {
    if (disabled) return
    
    if (isTypeSelected(typeId)) {
      onChange(selectedTypes.filter(id => id !== typeId))
    } else {
      onChange([...selectedTypes, typeId])
    }
  }

  // Remove selected type
  const removeType = (typeId: string) => {
    if (disabled) return
    onChange(selectedTypes.filter(id => id !== typeId))
  }

  // Create new stitch type
  const createNewType = async () => {
    const trimmedName = newTypeName.trim()
    if (!trimmedName) return

    try {
      const response = await fetch('/api/stitch-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName })
      })

      const data = await response.json()
      if (data.success) {
        // Add the new type to selection
        onChange([...selectedTypes, data.data.id])
        setNewTypeName('')
        setIsCreatingNew(false)
        setSearchQuery('')
        
        toast({
          title: 'Stitch type created',
          description: `"${trimmedName}" has been added to your stitch types.`,
        })
      } else {
        toast({
          title: 'Failed to create stitch type',
          description: data.error || 'Something went wrong',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Failed to create stitch type',
        description: 'Network error occurred',
        variant: 'destructive'
      })
    }
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchQuery('')
      setIsCreatingNew(false)
      setNewTypeName('')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected types display */}
      <div className="min-h-[42px] p-2 border border-border rounded-xl bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        {selectedTypes.length === 0 ? (
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(true)}
            disabled={disabled}
            className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            {placeholder}
          </button>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {selectedTypeNames.map((name, index) => (
              <div
                key={selectedTypes[index]}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary rounded-lg text-sm font-medium"
              >
                <Tag className="w-3 h-3" />
                <span>{name}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeType(selectedTypes[index])}
                    className="ml-0.5 hover:bg-primary/20 rounded p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {!disabled && (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-border rounded-lg transition-colors"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            )}
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-900 border border-border rounded-xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stitch types..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 h-9 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Popular types */}
          {popularTypes.length > 0 && (
            <div className="p-3 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Popular</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {popularTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isTypeSelected(type.id)
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/50'
                    }`}
                  >
                    {isTypeSelected(type.id) && <Check className="w-3 h-3" />}
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Regular types */}
          <div className="max-h-48 overflow-y-auto">
            {regularTypes.length > 0 ? (
              <div className="p-2">
                {regularTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => toggleType(type.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isTypeSelected(type.id)
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{type.name}</span>
                      {isTypeSelected(type.id) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  No stitch types found for "{searchQuery}"
                </p>
                {!isCreatingNew ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCreatingNew(true)}
                    className="h-8 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Create "{searchQuery}"
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Input
                      placeholder="New stitch type name..."
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') createNewType()
                        if (e.key === 'Escape') {
                          setIsCreatingNew(false)
                          setNewTypeName('')
                        }
                      }}
                      className="h-8 text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={createNewType}
                        className="h-8 text-xs"
                        disabled={!newTypeName.trim()}
                      >
                        Create
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsCreatingNew(false)
                          setNewTypeName('')
                        }}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No stitch types available
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
