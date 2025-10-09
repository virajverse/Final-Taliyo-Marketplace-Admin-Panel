import Layout from '../components/Layout'
import UploadSection from '../components/UploadSection'

const Upload = ({ user }) => {
  if (!user) {
    return null
  }

  return (
    <Layout user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upload Data</h1>
          <p className="text-gray-600 mt-2">
            Upload Excel files to add services, products, and packages to your marketplace.
          </p>
        </div>

        {/* Upload Section */}
        <UploadSection />

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Excel Format Guidelines</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Required Columns:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>title</strong> - Item name</li>
                <li>• <strong>description</strong> - Item description</li>
                <li>• <strong>category</strong> - Item category</li>
                <li>• <strong>price</strong> - Item price (optional)</li>
                <li>• <strong>whatsapp_link</strong> - WhatsApp contact link</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">Sheet Names:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>services</strong> - For service listings</li>
                <li>• <strong>products</strong> - For product listings</li>
                <li>• <strong>packages</strong> - For package deals</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Tip:</strong> Make sure your Excel file has proper headers in the first row. 
              The system will automatically detect the sheet type based on the sheet name.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Upload
