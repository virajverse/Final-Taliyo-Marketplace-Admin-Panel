import { useState } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react'
import { parseExcelFile, validateServiceData, formatDataForSupabase } from '../lib/excelUtils'
import { supabase } from '../lib/supabaseClient'

const UploadSection = () => {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [errors, setErrors] = useState([])
  const [success, setSuccess] = useState('')

  const handleFileSelect = async (event) => {
    const selectedFile = event.target.files[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setErrors(['Please select a valid Excel file (.xlsx or .xls)'])
      return
    }

    setFile(selectedFile)
    setErrors([])
    setSuccess('')

    try {
      const parsedData = await parseExcelFile(selectedFile)
      setPreview(parsedData)
    } catch (error) {
      setErrors([`Failed to parse Excel file: ${error.message}`])
    }
  }

  const handleUpload = async () => {
    if (!preview) return

    setUploading(true)
    setErrors([])
    setSuccess('')

    try {
      let totalInserted = 0

      // Process each sheet
      for (const [sheetName, data] of Object.entries(preview)) {
        if (data.length === 0) continue

        // Determine data type based on sheet name
        let dataType = 'service'
        if (sheetName.includes('product')) dataType = 'product'
        else if (sheetName.includes('package')) dataType = 'package'

        // Validate data
        const validationErrors = validateServiceData(data)
        if (validationErrors.length > 0) {
          setErrors(prev => [...prev, ...validationErrors])
          continue
        }

        // Format data for Supabase
        const formattedData = formatDataForSupabase(data, dataType)

        // Insert into database
        const { data: insertedData, error } = await supabase
          .from('items')
          .insert(formattedData)
          .select()

        if (error) {
          setErrors(prev => [...prev, `Failed to insert ${sheetName}: ${error.message}`])
        } else {
          totalInserted += insertedData.length
        }
      }

      if (totalInserted > 0) {
        setSuccess(`Successfully uploaded ${totalInserted} items!`)
        setFile(null)
        setPreview(null)
        // Reset file input
        document.getElementById('file-upload').value = ''
      }
    } catch (error) {
      setErrors([`Upload failed: ${error.message}`])
    } finally {
      setUploading(false)
    }
  }

  const clearPreview = () => {
    setFile(null)
    setPreview(null)
    setErrors([])
    setSuccess('')
    document.getElementById('file-upload').value = ''
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Excel Data</h2>
        
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
          <FileSpreadsheet size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Excel File</h3>
          <p className="text-gray-500 mb-4">
            Supports .xlsx and .xls files with sheets for services, products, and packages
          </p>
          
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <label
            htmlFor="file-upload"
            className="btn-primary cursor-pointer inline-flex items-center"
          >
            <Upload size={16} className="mr-2" />
            Choose File
          </label>
        </div>

        {/* File Info */}
        {file && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileSpreadsheet size={20} className="text-blue-500 mr-2" />
                <span className="text-sm text-blue-800">{file.name}</span>
              </div>
              <button
                onClick={clearPreview}
                className="text-blue-500 hover:text-blue-700"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Data Preview</h3>
            
            {Object.entries(preview).map(([sheetName, data]) => (
              <div key={sheetName} className="mb-6">
                <h4 className="text-md font-medium text-gray-700 mb-2 capitalize">
                  {sheetName} ({data.length} items)
                </h4>
                
                {data.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(data[0]).slice(0, 5).map((key) => (
                            <th key={key} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.slice(0, 3).map((item, index) => (
                          <tr key={index} className="border-t">
                            {Object.values(item).slice(0, 5).map((value, i) => (
                              <td key={i} className="px-4 py-2 text-sm text-gray-900">
                                {String(value).slice(0, 50)}
                                {String(value).length > 50 && '...'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.length > 3 && (
                      <p className="text-sm text-gray-500 mt-2">
                        And {data.length - 3} more items...
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Upload Button */}
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className={`btn-primary ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploading ? (
                  <>
                    <div className="loading-spinner mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={16} className="mr-2" />
                    Upload Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Alerts */}
        {errors.length > 0 && (
          <div className="mt-4 alert-error">
            <div className="flex items-start">
              <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium">Upload Errors:</h4>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-4 alert-success">
            <div className="flex items-center">
              <CheckCircle size={20} className="mr-2" />
              {success}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default UploadSection
