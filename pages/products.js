import { useEffect, useState } from 'react'
import ModernLayout from '../components/ModernLayout'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  X,
  Upload,
  Download,
  Grid,
  List,
  Star,
  TrendingUp,
  DollarSign,
  Users,
  MoreVertical,
  Image as ImageIcon,
  FileText,
  Calendar,
  Tag
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const Products = ({ user }) => {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [showAddForm, setShowAddForm] = useState(false)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedProducts, setSelectedProducts] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    revenue: 0
  })
  const [sortBy, setSortBy] = useState('newest') // newest | price_low | price_high
  const [validation, setValidation] = useState({})
  const [dragIndex, setDragIndex] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [bulkFile, setBulkFile] = useState(null)
  const [bulkUploading, setBulkUploading] = useState(false)
  const [bulkResult, setBulkResult] = useState(null)
  const [bulkAssets, setBulkAssets] = useState(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: 'service',
    price_min: '',
    price_max: '',
    price_type: 'fixed',
    images: [],
    provider_name: '',
    location: '',
    is_remote: false,
    duration_minutes: '',
    tags: ''
  })

  useEffect(() => {
    if (user) {
      loadProducts()
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('products_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services' }, () => {
        loadProducts()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        loadProducts()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const id = setInterval(() => loadProducts(), 10000)
    return () => clearInterval(id)
  }, [user])

  useEffect(() => {
    applyFilters()
    calculateStats()
  }, [products, searchQuery, typeFilter, statusFilter, sortBy])

  const loadProducts = async () => {
    try {
      let data = []
      // Prefer services
      try {
        const res = await fetch('/api/admin/services')
        const json = await res.json()
        if (res.ok && Array.isArray(json?.data)) {
          data = json.data.map(service => ({ ...service, source: 'services' }))
        }
      } catch {}

      // Fallback to items if no services
      if (data.length === 0) {
        try {
          const res = await fetch('/api/admin/items')
          const json = await res.json()
          if (res.ok && Array.isArray(json?.data)) {
            data = json.data.map(item => ({
              ...item,
              source: 'items',
              price_min: item.price,
              price_max: item.price,
              is_active: item.is_active !== false
            }))
          }
        } catch {}
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  // Image upload handlers (Supabase Storage: service-images bucket)
  const handleImageSelect = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const current = Array.isArray(formData.images) ? formData.images.length : 0
    const capacity = Math.max(0, 6 - current)
    if (capacity === 0) {
      setError('You can upload up to 6 images')
      if (event?.target) event.target.value = ''
      return
    }
    const toUpload = files.slice(0, capacity)
    setUploadingImages(true)
    try {
      const newUrls = []
      for (const file of toUpload) {
        const body = new FormData()
        body.append('file', file)
        const res = await fetch('/api/admin/storage/upload', { method: 'POST', body })
        const json = await res.json()
        if (res.ok && json?.url) newUrls.push(json.url)
      }
      if (newUrls.length) {
        setFormData(prev => ({
          ...prev,
          images: [
            ...(Array.isArray(prev.images) ? prev.images : []),
            ...newUrls
          ]
        }))
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload one or more images')
    } finally {
      setUploadingImages(false)
      if (event?.target) event.target.value = ''
    }
  }

  const removeImage = (url) => {
    setFormData(prev => ({
      ...prev,
      images: (Array.isArray(prev.images) ? prev.images : []).filter(u => u !== url)
    }))
  }

  const handleDropReorder = (targetIdx) => {
    setFormData(prev => {
      const arr = Array.isArray(prev.images) ? [...prev.images] : []
      if (dragIndex == null || dragIndex === targetIdx || dragIndex < 0 || dragIndex >= arr.length) return prev
      const [moved] = arr.splice(dragIndex, 1)
      arr.splice(targetIdx, 0, moved)
      return { ...prev, images: arr }
    })
    setDragIndex(null)
  }

  const calculateStats = () => {
    const total = products.length
    const active = products.filter(p => p.is_active).length
    const inactive = total - active
    const revenue = products.reduce((sum, p) => sum + (p.price_min || 0), 0)

    setStats({ total, active, inactive, revenue })
  }

  const applyFilters = () => {
    let filtered = products

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.provider_name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(product => product.type === typeFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active'
      filtered = filtered.filter(product => product.is_active === isActive)
    }

    // Sort
    let sorted = [...filtered]
    if (sortBy === 'price_low') {
      sorted.sort((a, b) => (a.price_min ?? Infinity) - (b.price_min ?? Infinity))
    } else if (sortBy === 'price_high') {
      sorted.sort((a, b) => (b.price_min ?? -Infinity) - (a.price_min ?? -Infinity))
    } else {
      // newest by created_at desc
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    setFilteredProducts(sorted)
  }

  const handleSyncToServices = async () => {
    try {
      setSyncing(true)
      setError('')
      setSuccess('')
      const res = await fetch('/api/admin/sync-items-to-services', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Sync failed')
      setSuccess(`Synced: ${data.created} created, ${data.updated} updated`)
      await loadProducts()
    } catch (err) {
      setError('Sync failed: ' + (err?.message || 'Unknown error'))
    } finally {
      setSyncing(false)
    }
  }

  const handleBulkFileChange = (e) => {
    const file = e.target?.files?.[0] || null
    setBulkFile(file)
    setBulkResult(null)
  }

  const handleBulkAssetsChange = (e) => {
    const file = e.target?.files?.[0] || null
    setBulkAssets(file)
  }

  const handleBulkUpload = async () => {
    if (!bulkFile) {
      setError('Please choose a CSV/XLSX file')
      return
    }
    setBulkUploading(true)
    setError('')
    setSuccess('')
    try {
      const body = new FormData()
      body.append('file', bulkFile)
      if (bulkAssets) body.append('assets', bulkAssets)
      const res = await fetch('/api/admin/services/bulk-upload', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || json?.error || 'Upload failed')
      setBulkResult(json)
      setSuccess(`Uploaded ${json.created} of ${json.totalRows}`)
      await loadProducts()
    } catch (err) {
      setError('Bulk upload failed: ' + (err?.message || 'Unknown error'))
    } finally {
      setBulkUploading(false)
    }
  }

  const validateForm = () => {
    const v = {}
    if (!formData.title?.trim()) v.title = 'Title is required'
    const min = formData.price_min !== '' ? Number(formData.price_min) : null
    const max = formData.price_max !== '' ? Number(formData.price_max) : null
    if (formData.price_min !== '' && Number.isNaN(min)) v.price_min = 'Min price must be a number'
    if (formData.price_max !== '' && Number.isNaN(max)) v.price_max = 'Max price must be a number'
    if (min != null && max != null && !Number.isNaN(min) && !Number.isNaN(max) && max < min) {
      v.price_max = 'Max price must be greater than or equal to Min price'
    }
    setValidation(v)
    return Object.keys(v).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!validateForm()) {
      setError('Please fix the highlighted fields')
      return
    }

    try {
      const baseService = {
        title: formData.title,
        description: formData.description,
        category_id: null,
        subcategory_id: null,
        type: formData.type,
        price_min: formData.price_min ? parseFloat(formData.price_min) : null,
        price_max: formData.price_max ? parseFloat(formData.price_max) : null,
        price_type: formData.price_type,
        provider_name: formData.provider_name,
        location: formData.location,
        is_remote: formData.is_remote,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        is_active: true,
        images: Array.isArray(formData.images) ? formData.images : []
      }

      if (editingProduct) {
        if (editingProduct.source === 'items') {
          // Minimal update mapping for legacy items
          const body = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            type: formData.type,
            price: formData.price_min ? parseFloat(formData.price_min) : null,
            is_active: true
          }
          const res = await fetch(`/api/admin/items/${editingProduct.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json?.message || json?.error || 'Update failed')
          setProducts(products.map(p => (p.id === editingProduct.id ? { ...json.data, source: 'items', price_min: json.data.price, price_max: json.data.price } : p)))
        } else {
          const res = await fetch(`/api/admin/services/${editingProduct.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(baseService)
          })
          const json = await res.json()
          if (!res.ok) throw new Error(json?.message || json?.error || 'Update failed')
          setProducts(products.map(p => (p.id === editingProduct.id ? { ...json.data, source: 'services' } : p)))
        }
        setSuccess('Product updated successfully')
      } else {
        // Create new service
        const res = await fetch('/api/admin/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...baseService, created_at: new Date().toISOString() })
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || json?.error || 'Create failed')
        setProducts([{ ...json.data, source: 'services' }, ...products])
        setSuccess('Product created successfully')
      }

      // Reset form
      resetForm()
    } catch (error) {
      console.error('Error saving product:', error)
      setError('Failed to save product: ' + error.message)
    }
  }

  const resetForm = (close = true) => {
    setFormData({
      title: '',
      description: '',
      category: '',
      type: 'service',
      price_min: '',
      price_max: '',
      price_type: 'fixed',
      images: [],
      provider_name: '',
      location: '',
      is_remote: false,
      duration_minutes: '',
      tags: ''
    })
    if (close) setShowAddForm(false)
    setEditingProduct(null)
  }

  const handleEdit = (product) => {
    setFormData({
      title: product.title || '',
      description: product.description || '',
      category: product.category || '',
      type: product.type || 'service',
      price_min: product.price_min || '',
      price_max: product.price_max || '',
      price_type: product.price_type || 'fixed',
      images: product.images ? (Array.isArray(product.images) ? product.images : JSON.parse(product.images)) : [],
      provider_name: product.provider_name || '',
      location: product.location || '',
      is_remote: product.is_remote || false,
      duration_minutes: product.duration_minutes || '',
      tags: ''
    })
    setEditingProduct(product)
    setShowAddForm(true)
  }

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      const product = products.find(p => p.id === productId)
      const url = product?.source === 'items' ? `/api/admin/items/${productId}` : `/api/admin/services/${productId}`
      const res = await fetch(url, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || json?.error || 'Delete failed')
      setProducts(products.filter(product => product.id !== productId))
      setSuccess('Product deleted successfully')
    } catch (error) {
      console.error('Error deleting product:', error)
      setError('Failed to delete product')
    }
  }

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      const product = products.find(p => p.id === productId)
      const url = product?.source === 'items' ? `/api/admin/items/${productId}` : `/api/admin/services/${productId}`
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || json?.error || 'Update failed')
      setProducts(products.map(product => (
        product.id === productId ? { ...json.data, source: product.source } : product
      )))
      setSuccess(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating product status:', error)
      setError('Failed to update product status')
    }
  }

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Product Image */}
      <div className="relative h-48 bg-gradient-to-br from-blue-50 to-purple-50">
        {product.images && product.images.length > 0 ? (
          <img 
            src={Array.isArray(product.images) ? product.images[0] : JSON.parse(product.images)[0]} 
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={48} className="text-gray-300" />
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            product.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {product.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3">
          <div className="flex space-x-1">
            <button
              onClick={() => toggleProductStatus(product.id, product.is_active)}
              className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
              title={product.is_active ? 'Deactivate' : 'Activate'}
            >
              {product.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={() => handleEdit(product)}
              className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all"
              title="Edit"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDelete(product.id)}
              className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all text-red-600"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {(Array.isArray(product.images) ? product.images.length : (product.images ? JSON.parse(product.images).length : 0)) > 1 && (
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
            <ImageIcon size={12} />
            <span>{Array.isArray(product.images) ? product.images.length : (product.images ? JSON.parse(product.images).length : 0)}</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2">{product.title}</h3>
          <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
            product.type === 'service' 
              ? 'bg-blue-100 text-blue-800'
              : product.type === 'product'
              ? 'bg-green-100 text-green-800'
              : 'bg-purple-100 text-purple-800'
          }`}>
            {product.type}
          </span>
        </div>

        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {product.description || 'No description available'}
        </p>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>{product.category || 'Uncategorized'}</span>
          <span>{new Date(product.created_at).toLocaleDateString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm font-bold text-gray-900">
            {product.price_min && product.price_max && product.price_min !== product.price_max
              ? `₹${product.price_min} - ₹${product.price_max}`
              : product.price_min
              ? `₹${product.price_min}`
              : 'Price on request'
            }
          </div>
          {product.provider_name && (
            <span className="text-xs text-gray-500 truncate ml-2">
              by {product.provider_name}
            </span>
          )}
        </div>
      </div>
    </div>
  )

  if (!user) {
    return null
  }

  return (
    <ModernLayout user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Products & Services</h1>
            <p className="text-gray-600 mt-1">
              Manage your marketplace inventory with advanced tools
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowBulkUpload(true)}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Upload size={16} className="mr-2" />
              Bulk Upload
            </button>
            <button
              onClick={handleSyncToServices}
              disabled={syncing}
              className={`flex items-center px-4 py-2 border border-gray-300 rounded-lg transition-colors ${syncing ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <Download size={16} className="mr-2" />
              {syncing ? 'Syncing…' : 'Sync to Database'}
            </button>
            <button
              onClick={() => {
                setEditingProduct(null)
                resetForm(false)
                setShowAddForm(true)
              }}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
            >
              <Plus size={16} className="mr-2" />
              Add Product
            </button>
          </div>

        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle size={20} className="text-red-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-red-800">{error}</span>
              <button onClick={() => setError('')} className="ml-auto text-red-600">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle size={20} className="text-green-600 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-green-800">{success}</span>
              <button onClick={() => setSuccess('')} className="ml-auto text-green-600">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white/90 backdrop-blur rounded-xl shadow-sm border border-gray-200 p-6 sticky top-16 z-20">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, categories, providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="service">Services</option>
                <option value="product">Products</option>
                <option value="package">Packages</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low → High</option>
                <option value="price_high">Price: High → Low</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setTypeFilter('all'); setStatusFilter('all'); }}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Products ({filteredProducts.length})
              </h2>
              {selectedProducts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedProducts.length} selected
                  </span>
                  <button className="px-3 py-1 bg-red-100 text-red-800 rounded-lg text-sm">
                    Delete Selected
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading products...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                          {(Array.isArray(product.images) ? product.images.length : (product.images ? JSON.parse(product.images).length : 0)) > 0 ? (
                            <img
                              src={Array.isArray(product.images) ? product.images[0] : JSON.parse(product.images)[0]}
                              alt={product.title}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <ImageIcon size={20} className="text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{product.title}</h3>
                          <p className="text-sm text-gray-600">{product.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">
                          {product.price_min ? `₹${product.price_min}` : 'N/A'}
                        </span>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={product.is_active}
                            onChange={() => toggleProductStatus(product.id, product.is_active)}
                            className="h-4 w-8 appearance-none bg-gray-300 rounded-full relative outline-none cursor-pointer transition-all"
                            style={{ backgroundColor: product.is_active ? '#86efac' : undefined }}
                          />
                          <span>{product.is_active ? 'Active' : 'Inactive'}</span>
                        </label>
                        <div className="flex space-x-2">
                          <button onClick={() => handleEdit(product)} className="text-blue-600">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => handleDelete(product.id)} className="text-red-600">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No products found</p>
                <p className="text-gray-400 text-sm">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${validation.title ? 'border-red-500' : 'border-gray-300'}`}
                        required
                      />
                      {validation.title && (
                        <p className="text-xs text-red-600 mt-1">{validation.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows={4}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                        <select
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="service">Service</option>
                          <option value="product">Product</option>
                          <option value="package">Package</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Details */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Pricing & Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
                        <input
                          type="number"
                          value={formData.price_min}
                          onChange={(e) => setFormData({ ...formData, price_min: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${validation.price_min ? 'border-red-500' : 'border-gray-300'}`}
                          step="0.01"
                          min="0"
                        />
                        {validation.price_min && (
                          <p className="text-xs text-red-600 mt-1">{validation.price_min}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                        <input
                          type="number"
                          value={formData.price_max}
                          onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${validation.price_max ? 'border-red-500' : 'border-gray-300'}`}
                          step="0.01"
                          min="0"
                        />
                        {validation.price_max && (
                          <p className="text-xs text-red-600 mt-1">{validation.price_max}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Provider Name</label>
                      <input
                        type="text"
                        value={formData.provider_name}
                        onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_remote"
                        checked={formData.is_remote}
                        onChange={(e) => setFormData({ ...formData, is_remote: e.target.checked })}
                        className="mr-2"
                      />
                      <label htmlFor="is_remote" className="text-sm text-gray-700">
                        Remote service available
                      </label>
                    </div>
                  </div>
                </div>

                {/* Images */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900">Images</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input id="image-upload" type="file" accept="image/*" multiple onChange={handleImageSelect} disabled={uploadingImages} className="hidden" />
                    <label htmlFor="image-upload" className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 cursor-pointer">
                      <ImageIcon size={16} className="mr-2 text-gray-600" /> Browse images
                    </label>
                    <p className="text-xs text-gray-500 mt-2">JPG/PNG up to 5MB each. You can select multiple. Max 6 images.</p>
                    {uploadingImages && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
                  </div>
                  {Array.isArray(formData.images) && formData.images.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                      {formData.images.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative border rounded overflow-hidden cursor-move"
                          draggable
                          onDragStart={() => setDragIndex(idx)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => handleDropReorder(idx)}
                          title="Drag to reorder"
                        >
                          <img src={url} alt="product" className="h-24 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(url)}
                            className="absolute top-1 right-1 bg-white/90 text-red-600 px-2 py-0.5 rounded text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-2xl">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Bulk Upload Products</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="text-center">
                  <Upload size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-600 mb-4">Upload CSV or Excel file with product data</p>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      className="hidden"
                      id="bulk-upload"
                      onChange={handleBulkFileChange}
                      disabled={bulkUploading}
                    />
                    <label
                      htmlFor="bulk-upload"
                      className="cursor-pointer flex flex-col items-center"
                    >
                      <FileText size={32} className="text-gray-400 mb-2" />
                      <span className="text-blue-600 hover:text-blue-800">
                        Choose file or drag and drop
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        CSV, XLSX files up to 10MB
                      </span>
                    </label>
                    {bulkFile && (
                      <div className="mt-3 text-sm text-gray-700">
                        Selected: <span className="font-medium">{bulkFile.name}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mt-4">
                    <input
                      type="file"
                      accept=".zip"
                      className="hidden"
                      id="bulk-assets"
                      onChange={handleBulkAssetsChange}
                      disabled={bulkUploading}
                    />
                    <label
                      htmlFor="bulk-assets"
                      className="cursor-pointer inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50"
                    >
                      <ImageIcon size={16} className="mr-2 text-gray-600" /> Choose images.zip (optional)
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      If provided, the <code>images</code> column can list filenames (e.g. <code>photo1.jpg, banner.png</code>) and they will be uploaded from this ZIP to storage.
                    </p>
                    {bulkAssets && (
                      <div className="mt-2 text-sm text-gray-700">
                        Selected assets: <span className="font-medium">{bulkAssets.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Required Columns:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• title (required)</li>
                    <li>• description</li>
                    <li>• category</li>
                    <li>• type (service/product/package)</li>
                    <li>• price_min, price_max</li>
                    <li>• provider_name</li>
                  </ul>
                </div>

                {bulkResult && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                    <div><span className="font-semibold">Result:</span> Created {bulkResult.created} of {bulkResult.totalRows}</div>
                    {Array.isArray(bulkResult.errors) && bulkResult.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="font-semibold">Errors ({bulkResult.errors.length}):</div>
                        <ul className="list-disc pl-5 mt-1 space-y-1 max-h-32 overflow-auto">
                          {bulkResult.errors.slice(0, 10).map((e, idx) => (
                            <li key={idx} className="text-red-700">
                              Row {e.row}: {e.message}
                            </li>
                          ))}
                          {bulkResult.errors.length > 10 && (
                            <li className="text-gray-600">...and {bulkResult.errors.length - 10} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowBulkUpload(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkUpload}
                    disabled={bulkUploading || !bulkFile}
                    className={`px-6 py-2 rounded-lg text-white transition-colors ${bulkUploading || !bulkFile ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {bulkUploading ? 'Uploading...' : 'Upload Products'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  )
}

export default Products