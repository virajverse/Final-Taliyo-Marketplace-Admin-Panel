import * as XLSX from 'xlsx'

export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = e.target.result
        const workbook = XLSX.read(data, { type: 'array' })
        
        const result = {}
        
        // Parse each sheet
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          if (jsonData.length > 0) {
            const headers = jsonData[0]
            const rows = jsonData.slice(1)
            
            result[sheetName.toLowerCase()] = rows.map(row => {
              const obj = {}
              headers.forEach((header, index) => {
                if (header && row[index] !== undefined) {
                  obj[header.toLowerCase().replace(/\s+/g, '_')] = row[index]
                }
              })
              return obj
            }).filter(obj => Object.keys(obj).length > 0)
          }
        })
        
        resolve(result)
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

export const validateServiceData = (data) => {
  const requiredFields = ['title', 'description', 'category']
  const errors = []
  
  data.forEach((item, index) => {
    requiredFields.forEach(field => {
      if (!item[field] || item[field].toString().trim() === '') {
        errors.push(`Row ${index + 2}: Missing ${field}`)
      }
    })
  })
  
  return errors
}

export const formatDataForSupabase = (data, type) => {
  return data.map(item => ({
    ...item,
    type,
    whatsapp_link: item.whatsapp_link || '',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
}
