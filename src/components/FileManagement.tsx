import React, { useState } from 'react';
import { FileUp, FileDown, ArrowRight, AlertCircle } from 'lucide-react';

const MenuCard: React.FC = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<boolean>(false);
  
  // Function to handle file download
  const handleDownload = () => {
    try {
      // Using the exact file name as it appears in your public folder
      const filePath = '/Project Performance Template.xlsx'; 
      
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = filePath;
      link.download = 'Project Performance Template.xlsx'; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message briefly
      setDownloadSuccess(true);
      setDownloadError(false);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadError(true);
      setTimeout(() => setDownloadError(false), 3000);
    }
  };
  
  // Function to handle file upload with actual file replacement
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check file extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'xlsx' && fileExtension !== 'xls') {
      alert('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }
    
    setIsUploading(true);
    setUploadError(false);
    
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('file', file); // Make sure this matches the field name in server.js
    
    try {
      console.log('Uploading file:', file.name);
      // Send the file to your server endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type - browser will set it with correct boundary
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        // Handle HTTP errors
        let errorMessage = 'Failed to upload file';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          console.error('Error parsing JSON response:', jsonError);
        }
        throw new Error(errorMessage);
      }
      
      let result;
      try {
        result = await response.json();
        console.log('Upload response:', result);
      } catch (jsonError) {
        console.warn('Could not parse response as JSON, continuing anyway');
        result = { success: true };
      }
      
      setIsUploading(false);
      // Use the result to determine upload success
      if (result && result.success !== false) {
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        setUploadError(true);
        setErrorMessage(result?.message || 'Server returned an unsuccessful response');
        setTimeout(() => setUploadError(false), 5000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload file');
      setTimeout(() => setUploadError(false), 5000);
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full max-w-md">
        <div className="bg-gradient-to-r from-teal-400 to-cyan-500 p-6">
          <h2 className="text-2xl font-bold text-white">Project Performance</h2>
          <p className="text-teal-50">Excel File Management</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Download Card */}
          <div className="group bg-white border border-teal-100 hover:border-teal-300 rounded-lg p-4 transition-all cursor-pointer shadow-sm hover:shadow-md" onClick={handleDownload}>
            <div className="flex items-center">
              <div className="bg-teal-50 p-3 rounded-full">
                <FileDown className="h-6 w-6 text-teal-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-medium text-gray-800">Download Excel Template</h3>
                <p className="text-sm text-gray-500">Get the latest project performance template</p>
              </div>
              <ArrowRight className="h-5 w-5 text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {downloadSuccess && (
              <div className="mt-2 text-sm text-green-600 animate-pulse">
                Download started successfully!
              </div>
            )}
            {downloadError && (
              <div className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" /> Unable to download file. Please try again.
              </div>
            )}
          </div>
          
          {/* Upload Card */}
          <div className="relative bg-white border border-amber-100 hover:border-amber-300 rounded-lg p-4 transition-all shadow-sm hover:shadow-md">
            <div className="flex items-center">
              <div className="bg-amber-50 p-3 rounded-full">
                <FileUp className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-4 flex-1">
                <h3 className="font-medium text-gray-800">Upload Excel File</h3>
                <p className="text-sm text-gray-500">Replace the existing file in public folder</p>
              </div>
              <label className="cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xlsx,.xls" 
                  onChange={handleUpload}
                  disabled={isUploading}
                  title="Upload a file"
                />
                <ArrowRight className="h-5 w-5 text-amber-500" />
              </label>
            </div>
            {isUploading && (
              <div className="mt-2 text-sm text-amber-600 animate-pulse">
                Uploading file...
              </div>
            )}
            {uploadSuccess && (
              <div className="mt-2 text-sm text-green-600 animate-pulse">
                File uploaded and replaced successfully!
              </div>
            )}
            {uploadError && (
              <div className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" /> {errorMessage || "Failed to upload file."}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-gray-50 px-6 py-3">
          <p className="text-xs text-gray-500 text-center">
            FM Projects Financial Analytics Dashboard
          </p>
        </div>
      </div>
    </div>
  );
};

export default MenuCard;