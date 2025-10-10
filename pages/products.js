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
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    revenue: 0
  })

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
    applyFilters()
    calculateStats()
  }, [products, searchQuery, typeFilter, statusFilter])

  const loadProducts = async () => {
    try {
      // Try to load from services table first, then items table
      let data = []
      
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (!servicesError && servicesData) {
          data = servicesData.map(service => ({
            ...service,
            source: 'services'
          }))
        }
      } catch (error) {
        console.log('Services table not accessible')
      }

      // If no services data, try items table
      if (data.length === 0) {
        try {
          const { data: itemsData, error: itemsError } = await supabase
            .from('items')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (!itemsError && itemsData) {
            data = itemsData.map(item => ({
              ...item,
              source: 'items',
              price_min: item.price,
              price_max: item.price,
              is_active: item.is_active !== false
            }))
          }
        } catch (error) {
          console.log('Items table not accessible')
        }
      }

      setProducts(data || [])
    } catch (error) {
      console.error('Error loading products:', error)
      setError('Failed to load products')
    } finally {
      setLoading(false)
    }
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

    setFilteredProducts(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const productData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        type: formData.type,
        price_min: formData.price_min ? parseFloat(formData.price_min) : null,
        price_max: formData.price_max ? parseFloat(formData.price_max) : null,
        price_type: formData.price_type,
        provider_name: formData.provider_name,
        location: formData.location,
        is_remote: formData.is_remote,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        is_active: true,
        updated_at: new Date().toISOString()
      }

      // Handle images
      if (formData.images.length > 0) {
        productData.images = JSON.stringify(formData.images)
      }

      const tableName = 'services' // Default to services table

      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from(tableName)
          .update(productData)
          .eq('id', editingProduct.id)

        if (error) throw error

        setProducts(products.map(product => 
          product.id === editingProduct.id 
            ? { ...product, ...productData }
            : product
        ))
        setSuccess('Product updated successfully')
      } else {
        // Create new product
        productData.created_at = new Date().toISOString()
        
        const { data, error } = await supabase
          .from(tableName)
          .insert([productData])
          .select()
          .single()

        if (error) throw error

        setProducts([{ ...data, source: 'services' }, ...products])
        setSuccess('Product created successfully')
      }

      // Reset form
      resetForm()
    } catch (error) {
      console.error('Error saving product:', error)
      setError('Failed to save product: ' + error.message)
    }
  }

  const resetForm = () => {
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
    setShowAddForm(false)
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
      const tableName = product?.source === 'items' ? 'items' : 'services'

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', productId)

      if (error) throw error

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
      const tableName = product?.source === 'items' ? 'items' : 'services'

      const { error } = await supabase
        .from(tableName)
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error

      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, is_active: !currentStatus }
          : product
      ))
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
              onClick={() => {
                setShowAddForm(true)
                setEditingProduct(null)
                resetForm()
              }}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-sm"
            >
              <Plus size={16} className="mr-2" />
              Add Product
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive</p>
                <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <EyeOff size={24} className="text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-purple-600">₹{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign size={24} className="text-purple-600" />
              </div>
            </div>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{product.title}</h3>
                        <p className="text-sm text-gray-600">{product.category}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium">
                          {product.price_min ? `₹${product.price_min}` : 'N/A'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
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
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
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
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.01"
                          min="0"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
                        <input
                          type="number"
                          value={formData.price_max}
                          onChange={(e) => setFormData({ ...formData, price_max: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          step="0.01"
                          min="0"
                        />
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

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowBulkUpload(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Upload Products
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