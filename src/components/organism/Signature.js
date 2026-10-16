import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { useNavigate } from 'react-router-dom';
import { useKyc } from '../../context/KycContext';
import RejectionBanner from '../RejectionBanner';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './Signature.module.css';

const Signature = () => {
  const navigate = useNavigate();
  const { navigateToNextStep, refreshKycStatus } = useKyc();
  const [signatureMode, setSignatureMode] = useState('draw');
  const [uploadedSignature, setUploadedSignature] = useState(null);
  const [signatureError, setSignatureError] = useState('');
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState({
    unit: '%',
    x: 0,
    y: 0,
    width: 100,
    height: 100
  });
  const [isCropping, setIsCropping] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);
  
  const signatureRef = useRef(null);
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const fileInputRef = useRef(null);

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: width - 4,
          height: 200
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  const handleModeChange = (mode) => {
    setSignatureMode(mode);
    setSignatureError('');
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
    setUploadedSignature(null);
    setIsCropping(false);
    setOriginalImage(null);
    setCrop({
      unit: '%',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    if (signatureMode === 'draw' && signatureRef.current) {
      signatureRef.current.clear();
    } else {
      setUploadedSignature(null);
      setOriginalImage(null);
      setIsCropping(false);
      setCrop({
        unit: '%',
        x: 0,
        y: 0,
        width: 100,
        height: 100
      });
    }
    setSignatureError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg'];
      if (validTypes.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setOriginalImage(e.target.result);
          setUploadedSignature(e.target.result); 
          setIsCropping(true);
          setCrop({
            unit: '%',
            x: 0,
            y: 0,
            width: 100,
            height: 100
          });
          setSignatureError('');
        };
        reader.readAsDataURL(file);
      } else {
        setSignatureError('Please upload only JPG/JPEG files');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  // const handleChooseFile = () => {
  //   handleClear();
  //   if (fileInputRef.current) {
  //     fileInputRef.current.click();
  //   }
  // };

  const getCroppedImg = async (image, crop) => {
    return new Promise((resolve, reject) => {
      if (!image || !crop.width || !crop.height) {
        reject(new Error('Invalid crop parameters'));
        return;
      }

      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = Math.floor(crop.width * scaleX);
      canvas.height = Math.floor(crop.height * scaleY);

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('No 2d context'));
        return;
      }

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.onerror = () => {
            reject(new Error('Error reading blob'));
          };
        },
        'image/jpeg',
        1
      );
    });
  };

  const handleCropChange = (newCrop) => {
    setCrop(newCrop);
  };

  const handleCropComplete = async (newCrop) => {
    try {
      if (imgRef.current && newCrop.width && newCrop.height) {
        if (newCrop.width !== 100 || newCrop.height !== 100 || newCrop.x !== 0 || newCrop.y !== 0) {
          const croppedImage = await getCroppedImg(imgRef.current, newCrop);
          setUploadedSignature(croppedImage);
        }
      }
    } catch (error) {
      console.error('Error cropping image:', error);
      setSignatureError('Error cropping image. Please try again.');
    }
  };

  const handleCropSave = () => {
    setIsCropping(false);
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      let signatureImage;
      
      if (signatureMode === 'draw') {
        if (!signatureRef.current || signatureRef.current.isEmpty()) {
          setSignatureError('Please draw your signature');
          return;
        }
        signatureImage = signatureRef.current.toDataURL();
      } else {
        if (!uploadedSignature) {
          setSignatureError('Please upload and crop your signature');
          return;
        }
        signatureImage = uploadedSignature;
      }

      setIsLoading(true);
      setSignatureError('');

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/signature/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ signature: signatureImage }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit signature');
      }

      const data = await response.json();
      console.log('Signature submitted successfully:', data);
      
      if (refreshKycStatus) await refreshKycStatus();
      if (navigateToNextStep) {
        navigateToNextStep('/signature');
      } else {
        navigate('/esign');
      }
    } catch (error) {
      setSignatureError(error.message || 'Failed to submit signature. Please try again.');
      console.error('Error submitting signature:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <RejectionBanner section="signature" />
      <h1 className={styles.title}>Signature Upload</h1>
      <p className={styles.subtitle}>Please provide your signature by drawing or uploading an image</p>

      <div className={styles.modeSelector}>
        <button
          className={`${styles.modeButton} ${signatureMode === 'draw' ? styles.active : ''}`}
          onClick={() => handleModeChange('draw')}
        >
          Draw Signature
        </button>
        <button
          className={`${styles.modeButton} ${signatureMode === 'upload' ? styles.active : ''}`}
          onClick={() => handleModeChange('upload')}
        >
          Upload Signature
        </button>
      </div>

      <div className={styles.signatureArea}>
        {signatureMode === 'draw' ? (
          <div className={styles.drawArea} ref={containerRef}>
            {canvasSize.width > 0 && (
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: styles.signatureCanvas,
                  width: canvasSize.width,
                  height: canvasSize.height
                }}
                backgroundColor="rgb(247, 248, 249)"
                dotSize={2}
                minWidth={2}
                maxWidth={3}
                throttle={16}
                velocityFilterWeight={0.7}
              />
            )}
          </div>
        ) : (
          <div className={styles.uploadArea}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg"
              onChange={handleUpload}
              style={{ display: 'none' }}
              id="signature-upload"
            />
            <button 
              className={styles.uploadButton}
              onClick={() => fileInputRef.current?.click()}
            >
              Choose File
            </button>
            <p className={styles.uploadText}>Please upload only JPG/JPEG files</p>
            
            {isCropping && originalImage && (
              <div className={styles.cropContainer}>
                <p className={styles.cropText}>Drag to crop your signature</p>
                <ReactCrop
                  crop={crop}
                  onChange={handleCropChange}
                  onComplete={handleCropComplete}
                  style={{ maxWidth: '100%' }}
                >
                  <img
                    ref={imgRef}
                    src={originalImage}
                    alt="Signature to crop"
                    className={styles.cropImage}
                    style={{ maxWidth: '100%', width: 'auto', height: 'auto' }}
                  />
                </ReactCrop>
                <button 
                  className={styles.cropButton}
                  onClick={handleCropSave}
                >
                  Save Crop
                </button>
              </div>
            )}

            {!isCropping && uploadedSignature && (
              <div className={styles.previewArea}>
                <img
                  src={uploadedSignature}
                  alt="Uploaded signature"
                  className={styles.signaturePreview}
                  style={{ maxWidth: '100%', width: 'auto' }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {signatureError && <p className={styles.error}>{signatureError}</p>}

      <div className={styles.buttonGroup}>
        <button className={styles.clearButton} onClick={handleClear} disabled={isLoading}>
          Clear
        </button>
        <button className={styles.submitButton} onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Submit'}
        </button>
      </div>

      {isLoading && (
        <div className={styles.loaderModal}>
          <div className={styles.loaderContent}>
            <div className={styles.loaderSpinner}></div>
            <p className={styles.loaderText}>Uploading signature...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signature;