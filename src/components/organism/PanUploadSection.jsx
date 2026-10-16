import React, { useState, useRef, useEffect } from 'react';
import styles from './PanUploadSection.module.css';
import toast from 'react-hot-toast';

const PanUploadSection = ({ onUploadSuccess, panFile, panNumber, panName, error }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [currentPanFile, setCurrentPanFile] = useState(panFile || null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setCurrentPanFile(panFile || null);
  }, [panFile]);

  const handleFile = (file) => {
    setUploadError('');
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
    ];

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(file.name);

    if (!isPdf && !isImage) {
      setUploadError('Please upload only Image (JPG, JPEG, PNG) or PDF files');
      toast.error('Invalid file format. Only Image or PDF files are allowed.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit');
      toast.error('File size cannot exceed 10MB');
      return;
    }

    setSelectedFile(file);

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview('pdf');
    }

    // Trigger upload directly
    uploadPanDocument(file);
  };

  const uploadPanDocument = async (fileToUpload) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUploadError('Session expired. Please log in again.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('pan_file', fileToUpload);

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/upload_pan_proof`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload PAN document');
      }

      const uploadedPath = data?.data?.PAN_file;
      setCurrentPanFile(uploadedPath);
      toast.success('Your PAN is uploaded!');

      if (onUploadSuccess) {
        onUploadSuccess(uploadedPath);
      }
    } catch (err) {
      console.error('Error uploading PAN document:', err);
      setUploadError(err.message || 'Failed to upload PAN document. Please try again.');
      toast.error(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleChangeFile = async () => {
    const token = localStorage.getItem('authToken');
    // If there is an existing file, delete it from MinIO first
    if (token && currentPanFile) {
      try {
        await fetch(`${process.env.REACT_APP_API_URL}/api/delete_pan_proof`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.error('Error deleting previous PAN document:', err);
      }
    }

    setCurrentPanFile(null);
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError('');

    if (onUploadSuccess) {
      onUploadSuccess(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const getDisplayFileName = () => {
    if (selectedFile?.name) return selectedFile.name;
    if (currentPanFile) {
      const parts = currentPanFile.split('/');
      return parts[parts.length - 1];
    }
    return '';
  };

  const displayPanName =
    typeof panName === 'string'
      ? panName
      : panName?.fullName ||
        [panName?.firstName, panName?.middleName, panName?.lastName]
          .filter(Boolean)
          .join(' ') ||
        '';

  const displayPanNumber =
    typeof panNumber === 'string' ? panNumber : String(panNumber || '');

  return (
    <div className={styles.panSectionWrapper}>
      <div className={styles.sectionHeader}>
        <div className={styles.titleRow}>
          <svg
            className={styles.idIcon}
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="4" width="18" height="16" rx="3" />
            <circle cx="9" cy="10" r="2" />
            <line x1="15" y1="8" x2="17" y2="8" />
            <line x1="15" y1="12" x2="17" y2="12" />
            <line x1="7" y1="16" x2="17" y2="16" />
          </svg>
          <span className={styles.sectionTitle}>
            PAN Card Document Verification
            <span className={styles.requiredAsterisk}>*</span>
          </span>
        </div>
        <p className={styles.sectionSubtitle}>
          PAN document is required to proceed. Please upload your PAN card copy (Image or PDF).
        </p>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className={styles.hiddenFileInput}
        accept=".pdf,image/jpeg,image/png,image/jpg,image/webp"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {currentPanFile ? (
        <div className={styles.uploadedCard}>
          <div className={styles.uploadedLeft}>
            <div className={styles.successCheckIcon}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div className={styles.uploadedInfo}>
              <div className={styles.uploadedTitle}>Your PAN is uploaded</div>
              <div className={styles.uploadedSubtitle}>
                {displayPanNumber && (
                  <span className={styles.panBadge}>PAN: {displayPanNumber}</span>
                )}
                {displayPanName && (
                  <span className={styles.panBadge}>Name: {displayPanName}</span>
                )}
                <span className={styles.fileNameText}>
                  File: {getDisplayFileName()}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.changeFileBtn}
            onClick={handleChangeFile}
            disabled={isUploading}
            title="Delete current PAN and choose a new file"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '4px' }}
            >
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
            Change
          </button>
        </div>
      ) : (
        <div
          className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''} ${
            error || uploadError ? styles.dropZoneError : ''
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >

          {isUploading ? (
            <div className={styles.uploadingState}>
              <div className={styles.spinner} />
              <p className={styles.uploadingText}>
                Converting & Uploading PAN to secure storage...
              </p>
            </div>
          ) : filePreview && filePreview !== 'pdf' ? (
            <div className={styles.previewState}>
              <img src={filePreview} alt="PAN preview" className={styles.imgPreview} />
              <p className={styles.fileSelectedText}>
                {selectedFile?.name} ({(selectedFile?.size / 1024).toFixed(1)} KB)
              </p>
              <button
                type="button"
                className={styles.reselectBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeFile();
                }}
              >
                Choose another file
              </button>
            </div>
          ) : filePreview === 'pdf' ? (
            <div className={styles.previewState}>
              <div className={styles.pdfBadge}>PDF</div>
              <p className={styles.fileSelectedText}>{selectedFile?.name}</p>
              <button
                type="button"
                className={styles.reselectBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  handleChangeFile();
                }}
              >
                Choose another file
              </button>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.cloudIconWrapper}>
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                  <polyline points="16 16 12 12 8 16" />
                </svg>
              </div>
              <p className={styles.dropText}>
                <strong>Click to browse</strong> or drag & drop your PAN card here
              </p>
              <p className={styles.formatHint}>
                Supports: JPG, JPEG, PNG, or PDF (Max 10MB)
              </p>
            </div>
          )}
        </div>
      )}

      {(uploadError || error) && (
        <div className={styles.errorMessage}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{uploadError || error}</span>
        </div>
      )}
    </div>
  );
};

export default PanUploadSection;
