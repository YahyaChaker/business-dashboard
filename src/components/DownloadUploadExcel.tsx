import React, { useState } from 'react';
import styles from './ui/DownloadUploadExcel.module.css';
import { FileDown, FileUp, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

const ExcelCard = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showButtons, setShowButtons] = useState(true);
  
  // Toggle buttons visibility
  const toggleButtonsVisibility = () => {
    setShowButtons(!showButtons);
  };
  
  // Direct download from public folder - fixes corruption issue
  const handleDownload = () => {
    try {
      // Create a direct link to the file in the public directory
      const link = document.createElement('a');
      link.href = '/Project Performance Template.xlsx'; // Direct path to the file in public
      link.download = 'Project Performance Template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setIsUploading(true);
      setUploadError(false);
      setUploadSuccess(false);
      
      const file = event.target.files[0];
      
      // Validate file type
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        setErrorMessage('Please upload only Excel files (.xlsx or .xls)');
        setUploadError(true);
        setIsUploading(false);
        return;
      }
      
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          setUploadSuccess(true);
          setTimeout(() => setUploadSuccess(false), 3000);
        } else {
          setErrorMessage(result.message || 'Error uploading file');
          setUploadError(true);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        setErrorMessage('Network error while uploading');
        setUploadError(true);
      } finally {
        setIsUploading(false);
        setTimeout(() => setUploadError(false), 5000);
      }
    }
  };

  return (
    <div className={styles.container}>
        <div className={styles.card}>
        <div className={styles.header}>
            <h3 className={styles.title}>Project Performance Template</h3>
            <div className={styles.toggleContainer}>
              <label className={styles.toggleLabel}>
                <input 
                  type="checkbox" 
                  checked={showButtons}
                  onChange={toggleButtonsVisibility}
                  className={styles.toggleCheckbox}
                />
                <span className={styles.toggleText}>
                  {showButtons ? (
                    <>
                      <Eye size={16} className={styles.toggleIcon} /> Hide Buttons
                    </>
                  ) : (
                    <>
                      <EyeOff size={16} className={styles.toggleIcon} /> Show Buttons
                    </>
                  )}
                </span>
              </label>
            </div>
        </div>
        
        <p className={styles.subtitle}>Download or upload project data</p>
        
        {showButtons && (
          <div className={styles.actions}>
            <div className={styles.actionItem}>
              <button 
                onClick={handleDownload} 
                disabled={isUploading}
                className={styles.downloadButton}
              >
                <FileDown size={20} />
                Download Excel Template
              </button>
              {downloadSuccess && (
                <div className={styles.successMessage}>
                  <CheckCircle size={16} />
                  Downloaded successfully!
                </div>
              )}
            </div>
            
            <div className={styles.actionItem}>
              <label htmlFor="excelUpload" className={styles.uploadButton}>
                <FileUp size={20} />
                Upload Updated Excel
                <input 
                  id="excelUpload" 
                  type="file" 
                  accept=".xlsx,.xls" 
                  onChange={handleUpload} 
                  disabled={isUploading}
                  className={styles.fileInput}
                />
              </label>
              
              {isUploading && <div className={styles.uploadingMessage}>Uploading...</div>}
              
              {uploadSuccess && (
                <div className={styles.successMessage}>
                  <CheckCircle size={16} />
                  File uploaded successfully!
                </div>
              )}
              
              {uploadError && (
                <div className={styles.errorMessage}>
                  <AlertCircle size={16} />
                  {errorMessage || 'Error uploading file'}
                </div>
              )}
            </div>
          </div>
        )}
        </div>
    </div>
  );
};

export default ExcelCard;