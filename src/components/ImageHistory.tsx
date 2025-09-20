'use client'

import { useState, useEffect } from 'react'
import { Download, Heart, Share2, Trash2, Search, Filter, Grid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

interface ImageHistoryProps {
  authToken?: string
}

interface GeneratedImage {
  id: string
  prompt: string
  image_url: string
  thumbnail_url: string
  size: string
  style: string
  quality: string
  created_at: string
  is_favorite: boolean
  tokens_used: number
  cost: number
}

export default function ImageHistory({ authToken }: ImageHistoryProps) {
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [filteredImages, setFilteredImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [filterBy, setFilterBy] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (authToken) {
      fetchImages()
    }
  }, [authToken])

  useEffect(() => {
    applyFiltersAndSort()
  }, [images, searchTerm, sortBy, filterBy])

  const fetchImages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      const result = await response.json()
      if (result.success) {
        setImages(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch image history:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...images]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(img => 
        img.prompt.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply category filter
    switch (filterBy) {
      case 'favorites':
        filtered = filtered.filter(img => img.is_favorite)
        break
      case 'hd':
        filtered = filtered.filter(img => img.quality === 'hd')
        break
      case 'recent':
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(img => new Date(img.created_at) > weekAgo)
        break
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'cost':
        filtered.sort((a, b) => b.cost - a.cost)
        break
      case 'prompt':
        filtered.sort((a, b) => a.prompt.localeCompare(b.prompt))
        break
    }

    setFilteredImages(filtered)
  }

  const handleFavorite = async (imageId: string) => {
    try {
      const response = await fetch(`/api/history/${imageId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      
      if (response.ok) {
        setImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, is_favorite: !img.is_favorite } : img
        ))
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error)
    }
  }

  const handleDownload = async (imageUrl: string, imageId: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `monet-ai-${imageId}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleShare = async (image: GeneratedImage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Generated Art',
          text: `Check out this amazing AI art: "${image.prompt}"`,
          url: window.location.origin
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${window.location.origin} - "${image.prompt}"`)
    }
  }

  const handleSelectImage = (imageId: string) => {
    const newSelected = new Set(selectedImages)
    if (newSelected.has(imageId)) {
      newSelected.delete(imageId)
    } else {
      newSelected.add(imageId)
    }
    setSelectedImages(newSelected)
  }

  const handleBulkDownload = async () => {
    const selectedImagesList = filteredImages.filter(img => selectedImages.has(img.id))
    
    for (const image of selectedImagesList) {
      await handleDownload(image.image_url, image.id)
      // Add delay to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setSelectedImages(new Set())
  }

  const handleDeleteSelected = async () => {
    if (window.confirm(`Delete ${selectedImages.size} selected images?`)) {
      // Implementation for bulk delete
      console.log('Bulk delete:', Array.from(selectedImages))
      setSelectedImages(new Set())
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 rounded-xl h-64"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Images</SelectItem>
              <SelectItem value="favorites">Favorites</SelectItem>
              <SelectItem value="hd">HD Quality</SelectItem>
              <SelectItem value="recent">Recent (7 days)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="cost">Highest Cost</SelectItem>
              <SelectItem value="prompt">Alphabetical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedImages.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-900 font-medium">
              {selectedImages.size} image{selectedImages.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleBulkDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download All
              </Button>
              <Button variant="outline" size="sm" onClick={handleDeleteSelected}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedImages(new Set())}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>{filteredImages.length} of {images.length} images</span>
        <span>Total cost: ${images.reduce((sum, img) => sum + img.cost, 0).toFixed(2)}</span>
      </div>

      {/* Images Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredImages.map((image) => (
            <div 
              key={image.id} 
              className={`group relative bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
                selectedImages.has(image.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="aspect-square relative">
                <img
                  src={image.thumbnail_url || image.image_url}
                  alt={image.prompt}
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSelectImage(image.id)
                      }}
                      className={`p-2 rounded-full transition-colors ${
                        selectedImages.has(image.id) 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/40'
                      }`}
                    >
                      <div className="w-4 h-4 border-2 border-current rounded"></div>
                    </button>
                  </div>
                  
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      onClick={() => handleFavorite(image.id)}
                      className={`p-2 rounded-full transition-colors ${
                        image.is_favorite 
                          ? 'bg-red-500 text-white' 
                          : 'bg-white/20 text-white hover:bg-white/40'
                      }`}
                    >
                      <Heart className="w-4 h-4" fill={image.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      onClick={() => handleDownload(image.image_url, image.id)}
                      className="p-2 bg-white/20 text-white rounded-full hover:bg-white/40 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleShare(image)}
                      className="p-2 bg-white/20 text-white rounded-full hover:bg-white/40 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                <p className="text-sm text-gray-800 line-clamp-2 mb-2">{image.prompt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(image.created_at)}</span>
                  <div className="flex gap-1">
                    <Badge variant="secondary">{image.size}</Badge>
                    {image.quality === 'hd' && <Badge variant="secondary">HD</Badge>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredImages.map((image) => (
            <div 
              key={image.id} 
              className={`flex items-center gap-4 p-4 bg-white rounded-xl shadow transition-all duration-300 hover:shadow-lg ${
                selectedImages.has(image.id) ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <img
                src={image.thumbnail_url || image.image_url}
                alt={image.prompt}
                className="w-16 h-16 object-cover rounded-lg"
              />
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{image.prompt}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">{formatDate(image.created_at)}</span>
                  <Badge variant="secondary">{image.size}</Badge>
                  {image.quality === 'hd' && <Badge variant="secondary">HD</Badge>}
                  <span className="text-sm text-gray-500">${image.cost.toFixed(3)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSelectImage(image.id)}
                  className={`p-2 rounded-full transition-colors ${
                    selectedImages.has(image.id) 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <div className="w-4 h-4 border-2 border-current rounded"></div>
                </button>
                <button
                  onClick={() => handleFavorite(image.id)}
                  className={`p-2 rounded-full transition-colors ${
                    image.is_favorite 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className="w-4 h-4" fill={image.is_favorite ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => handleDownload(image.image_url, image.id)}
                  className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare(image)}
                  className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredImages.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-lg font-medium mb-2">No images found</p>
          <p>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  )
}