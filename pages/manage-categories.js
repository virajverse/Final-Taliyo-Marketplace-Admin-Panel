import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const ManageCategories = ({ user }) => {
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false)
  const [showAddSubcategoryForm, setShowAddSubcategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [expandedCategories, setExpandedCategories] = useState(new Set())
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    icon: '',
    slug: '',
    sort_order: 0
  })

  const [subcategoryFormData, setSubcategoryFormData] = useState({
    category_id: '',
    name: '',
    slug: ''
  })

  useEffect(() => {
    if (user) {
      loadCategories()
      loadSubcategories()
    }
  }, [user])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      setError('Failed to load categories')
    }
  }

  const loadSubcategories = async () => {
    try {
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          categories (name)
        `)
        .order('name', { ascending: true })

      if (error) throw error
      setSubcategories(data || [])
    } catch (error) {
      console.error('Error loading subcategories:', error)
      setError('Failed to load subcategories')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  }

  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const categoryData = {
        ...categoryFormData,
        slug: categoryFormData.slug || generateSlug(categoryFormData.name),
        sort_order: parseInt(categoryFormData.sort_order) || 0,
        updated_at: new Date().toISOString()
      }

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id)

        if (error) throw error

        setCategories(categories.map(cat => 
          cat.id === editingCategory.id 
            ? { ...cat, ...categoryData }
            : cat
        ))
        setSuccess('Category updated successfully')
      } else {
        // Create new category
        categoryData.created_at = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('categories')
          .insert([categoryData])
          .select()
          .single()

        if (error) throw error

        setCategories([...categories, data])
        setSuccess('Category created successfully')
      }

      // Reset form
      setCategoryFormData({
        name: '',
        description: '',
        icon: '',
        slug: '',
        sort_order: 0
      })
      setShowAddCategoryForm(false)
      setEditingCategory(null)
    } catch (error) {
      console.error('Error saving category:', error)
      setError('Failed to save category: ' + error.message)
    }
  }

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const subcategoryData = {
        ...subcategoryFormData,
        slug: subcategoryFormData.slug || generateSlug(subcategoryFormData.name),
        created_at: new Date().toISOString()
      }

      if (editingSubcategory) {
        // Update existing subcategory
        const { error } = await supabase
          .from('subcategories')
          .update(subcategoryData)
          .eq('id', editingSubcategory.id)

        if (error) throw error

        loadSubcategories() // Reload to get updated data with category name
        setSuccess('Subcategory updated successfully')
      } else {
        // Create new subcategory
        const { data, error } = await supabase
          .from('subcategories')
          .insert([subcategoryData])
          .select()
          .single()

        if (error) throw error

        loadSubcategories() // Reload to get updated data with category name
        setSuccess('Subcategory created successfully')
      }

      // Reset form
      setSubcategoryFormData({
        category_id: '',
        name: '',
        slug: ''
      })
      setShowAddSubcategoryForm(false)
      setEditingSubcategory(null)
    } catch (error) {
      console.error('Error saving subcategory:', error)
      setError('Failed to save subcategory: ' + error.message)
    }
  }

  const handleEditCategory = (category) => {
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || '',
      slug: category.slug,
      sort_order: category.sort_order || 0
    })
    setEditingCategory(category)
    setShowAddCategoryForm(true)
  }

  const handleEditSubcategory = (subcategory) => {
    setSubcategoryFormData({
      category_id: subcategory.category_id,
      name: subcategory.name,
      slug: subcategory.slug
    })
    setEditingSubcategory(subcategory)
    setShowAddSubcategoryForm(true)
  }

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all its subcategories and may affect services.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      setCategories(categories.filter(cat => cat.id !== categoryId))
      setSubcategories(subcategories.filter(sub => sub.category_id !== categoryId))
      setSuccess('Category deleted successfully')
    } catch (error) {
      console.error('Error deleting category:', error)
      setError('Failed to delete category: ' + error.message)
    }
  }

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', subcategoryId)

      if (error) throw error

      setSubcategories(subcategories.filter(sub => sub.id !== subcategoryId))
      setSuccess('Subcategory deleted successfully')
    } catch (error) {
      console.error('Error deleting subcategory:', error)
      setError('Failed to delete subcategory: ' + error.message)
    }
  }

  const toggleCategoryStatus = async (categoryId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ 
          is_active: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', categoryId)

      if (error) throw error

      setCategories(categories.map(cat => 
        cat.id === categoryId 
          ? { ...cat, is_active: !currentStatus }
          : cat
      ))
      setSuccess(`Category ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating category status:', error)
      setError('Failed to update category status')
    }
  }

  const toggleSubcategoryStatus = async (subcategoryId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('subcategories')
        .update({ 
          is_active: !currentStatus,
        })
        .eq('id', subcategoryId)

      if (error) throw error

      setSubcategories(subcategories.map(sub => 
        sub.id === subcategoryId 
          ? { ...sub, is_active: !currentStatus }
          : sub
      ))
      setSuccess(`Subcategory ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
    } catch (error) {
      console.error('Error updating subcategory status:', error)
      setError('Failed to update subcategory status')
    }
  }

  const toggleCategoryExpansion = (categoryId) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getSubcategoriesForCategory = (categoryId) => {
    return subcategories.filter(sub => sub.category_id === categoryId)
  }

  if (!user) {
    return null
  }

  return (
    <Layout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Categories</h1>
            <p className="text-gray-600 mt-2">
              Organize your services with categories and subcategories.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setShowAddSubcategoryForm(true)
                setEditingSubcategory(null)
                setSubcategoryFormData({
                  category_id: '',
                  name: '',
                  slug: ''
                })
              }}
              className="btn-secondary flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add Subcategory
            </button>
            <button
              onClick={() => {
                setShowAddCategoryForm(true)
                setEditingCategory(null)
                setCategoryFormData({
                  name: '',
                  description: '',
                  icon: '',
                  slug: '',
                  sort_order: 0
                })
              }}
              className="btn-primary flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Add Category
            </button>
          </div>
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

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input pl-10"
            />
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Categories ({filteredCategories.length})
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-gray-600">Loading categories...</p>
              </div>
            ) : filteredCategories.length > 0 ? (
              filteredCategories.map((category) => {
                const categorySubcategories = getSubcategoriesForCategory(category.id)
                const isExpanded = expandedCategories.has(category.id)
                
                return (
                  <div key={category.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <button
                          onClick={() => toggleCategoryExpansion(category.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </button>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-medium text-gray-900">
                              {category.name}
                            </h3>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              category.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {categorySubcategories.length} subcategories
                            </span>
                          </div>
                          {category.description && (
                            <p className="text-gray-600 mt-1">{category.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>Slug: {category.slug}</span>
                            <span>Order: {category.sort_order}</span>
                            {category.icon && <span>Icon: {category.icon}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleCategoryStatus(category.id, category.is_active)}
                          className="text-blue-600 hover:text-blue-800"
                          title={category.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {category.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-green-600 hover:text-green-800"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Subcategories */}
                    {isExpanded && categorySubcategories.length > 0 && (
                      <div className="mt-4 ml-8 space-y-2">
                        {categorySubcategories.map((subcategory) => (
                          <div key={subcategory.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <span className="font-medium text-gray-900">{subcategory.name}</span>
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                  subcategory.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {subcategory.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                Slug: {subcategory.slug}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleSubcategoryStatus(subcategory.id, subcategory.is_active)}
                                className="text-blue-600 hover:text-blue-800"
                                title={subcategory.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {subcategory.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                              
                              <button
                                onClick={() => handleEditSubcategory(subcategory)}
                                className="text-green-600 hover:text-green-800"
                                title="Edit"
                              >
                                <Edit size={14} />
                              </button>
                              
                              <button
                                onClick={() => handleDeleteSubcategory(subcategory.id)}
                                className="text-red-600 hover:text-red-800"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="p-8 text-center">
                <FolderOpen size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500">No categories found</p>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Category Form Modal */}
        {showAddCategoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        value={categoryFormData.name}
                        onChange={(e) => {
                          const name = e.target.value
                          setCategoryFormData({ 
                            ...categoryFormData, 
                            name,
                            slug: categoryFormData.slug || generateSlug(name)
                          })
                        }}
                        className="form-input"
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Slug *</label>
                      <input
                        type="text"
                        value={categoryFormData.slug}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, slug: e.target.value })}
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Description</label>
                    <textarea
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                      className="form-input"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Icon</label>
                      <input
                        type="text"
                        value={categoryFormData.icon}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, icon: e.target.value })}
                        className="form-input"
                        placeholder="e.g., web, design, marketing"
                      />
                    </div>

                    <div>
                      <label className="form-label">Sort Order</label>
                      <input
                        type="number"
                        value={categoryFormData.sort_order}
                        onChange={(e) => setCategoryFormData({ ...categoryFormData, sort_order: e.target.value })}
                        className="form-input"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCategoryForm(false)
                        setEditingCategory(null)
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingCategory ? 'Update Category' : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Subcategory Form Modal */}
        {showAddSubcategoryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
                </h2>
                
                <form onSubmit={handleSubcategorySubmit} className="space-y-4">
                  <div>
                    <label className="form-label">Category *</label>
                    <select
                      value={subcategoryFormData.category_id}
                      onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, category_id: e.target.value })}
                      className="form-input"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.filter(cat => cat.is_active).map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      value={subcategoryFormData.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setSubcategoryFormData({ 
                          ...subcategoryFormData, 
                          name,
                          slug: subcategoryFormData.slug || generateSlug(name)
                        })
                      }}
                      className="form-input"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Slug *</label>
                    <input
                      type="text"
                      value={subcategoryFormData.slug}
                      onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, slug: e.target.value })}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddSubcategoryForm(false)
                        setEditingSubcategory(null)
                      }}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn-primary">
                      {editingSubcategory ? 'Update Subcategory' : 'Create Subcategory'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ManageCategories