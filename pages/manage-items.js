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
  X
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const ManageItems = ({ user }) => {
  const [items, setItems] = useState([])
  const [filteredItems, setFilteredItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    type: 'service',
    price: '',
    whatsapp_link: ''
  })

  useEffect(() => {
    if (user) {
      loadItems()
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('manage_items_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        loadItems()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    const id = setInterval(() => loadItems(), 10000)
    return () => clearInterval(id)
  }, [user])

  useEffect(() => {
    applyFilters()
  }, [items, searchQuery, typeFilter])

  const loadItems = async () => {
    try {
      const res = await fetch('/api/admin/items')
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || json?.error || 'Failed to load items')
      setItems(json?.data || [])
    } catch (error) {
      console.error('Error loading items:', error)
      setError('Failed to load items')
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = items

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter)
    }

    setFilteredItems(filtered)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const itemData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : null,
        is_active: true,
        updated_at: new Date().toISOString()
      }

      if (editingItem) {
        // Update existing item
        const res = await fetch(`/api/admin/items/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || json?.error || 'Update failed')

        setItems(items.map(item => (
          item.id === editingItem.id ? json.data : item
        )))
        setSuccess('Item updated successfully')
      } else {
        // Create new item
        itemData.created_at = new Date().toISOString()
        const res = await fetch('/api/admin/items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(itemData)
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.message || json?.error || 'Create failed')

        setItems([json.data, ...items])
        setSuccess('Item created successfully')
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        type: 'service',
        price: '',
        whatsapp_link: ''
      })
      setShowAddForm(false)
      setEditingItem(null)
    } catch (error) {
      console.error('Error saving item:', error)
      setError('Failed to save item')
    }
  }

  const handleEdit = (item) => {
    setFormData({
      title: item.title,
      description: item.description || '',
      category: item.category || '',
      type: item.type,
      price: item.price || '',
      whatsapp_link: item.whatsapp_link || ''
    })
    setEditingItem(item)
    setShowAddForm(true)
  }

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return
    }

    try {
      const res = await fetch(`/api/admin/items/${itemId}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || json?.error || 'Delete failed')

      setItems(items.filter(item => item.id !== itemId))
      setSuccess('Item deleted successfully')
    } catch (error) {
      console.error('Error deleting item:', error)
      setError('Failed to delete item')
    }
  }

  const toggleItemStatus = async (itemId, currentStatus) => {
    try {
      const res = await fetch(`/api/admin/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentStatus })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || json?.error || 'Update failed')

      setItems(items.map(item => (
        item.id === itemId ? json.data : item
      )))
      setSuccess(`Item ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating item status:', error)
      setError('Failed to update item status')
    }
  }

  if (!user) {
    return null
  }

  return (
    <ModernLayout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Items</h1>
            <p className="text-gray-600 mt-2">
              Create, edit, and manage services, products, and packages.
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true)
              setEditingItem(null)
              setFormData({
                title: '',
                description: '',
                category: '',
                type: 'service',
                price: '',
                whatsapp_link: ''
              })
            }}
            className="btn-primary flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Item
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert-error">
            <div className="flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
              <button onClick={() => setError('')} className="ml-auto">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="alert-success">
            <div className="flex items-start">
              <CheckCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <span>{success}</span>
              <button onClick={() => setSuccess('')} className="ml-auto">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Filter size={16} className="text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="form-input w-auto"
              >
                <option value="all">All Types</option>
                <option value="service">Services</option>
                <option value="product">Products</option>
                <option value="package">Packages</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Items ({filteredItems.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Loading items...</p>
              </div>
            ) : filteredItems.length > 0 ? (
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div>
                          <div className="font-medium">{item.title}</div>
                          <div className="text-sm text-gray-500">
                            {item.description?.slice(0, 50)}
                            {item.description?.length > 50 && '...'}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.type === 'service' 
                            ? 'bg-blue-100 text-blue-800'
                            : item.type === 'product'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {item.type}
                        </span>
                      </td>
                      <td>{item.category || 'Uncategorized'}</td>
                      <td>
                        {item.price ? `₹${item.price}` : 'Not set'}
                      </td>
                      <td>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          item.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleItemStatus(item.id, item.is_active)}
                            className="text-blue-600 hover:text-blue-800"
                            title={item.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {item.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-green-600 hover:text-green-800"
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center">
                <Package size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No items found</p>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="form-input"
                        required
                      >
                        <option value="service">Service</option>
                        <option value="product">Product</option>
                        <option value="package">Package</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="form-input"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div>
                      <label className="form-label">Price</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="form-input"
                        step="0.01"
                        min="0"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">WhatsApp Link</label>
                    <input
                      type="url"
                      value={formData.whatsapp_link}
                      onChange={(e) => setFormData({ ...formData, whatsapp_link: e.target.value })}
                      className="form-input"
                      placeholder="https://wa.me/..."
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingItem(null)
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingItem ? 'Update Item' : 'Create Item'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModernLayout>
  )
}

export default ManageItems
