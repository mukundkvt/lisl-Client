import React, { useState, useEffect } from 'react';
import styles from './DdpiModal.module.css';

const DdpiModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [allOptions, setAllOptions] = useState(false);
  const [options, setOptions] = useState({
    transfer_of_security: false,
    pledging: false,
    mutual_fund_transaction: false,
    tendering_shares: false,
  });

  useEffect(() => {
    if (initialData) {
      setOptions(initialData);
      const allTrue = Object.values(initialData).every(v => v === true);
      setAllOptions(allTrue);
    }
  }, [initialData]);

  const handleAllOptionsChange = (e) => {
    const checked = e.target.checked;
    setAllOptions(checked);
    setOptions({
      transfer_of_security: checked,
      pledging: checked,
      mutual_fund_transaction: checked,
      tendering_shares: checked,
    });
  };

  const handleOptionChange = (key, value) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    const allTrue = Object.values(newOptions).every(v => v === true);
    setAllOptions(allTrue);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button onClick={onClose} className={styles.closeButton}>×</button>
        
        <h3 className={styles.title}>Please Select The DDPI Options</h3>
        
        <div className={styles.allOptionsContainer}>
          <label className={styles.allOptionsLabel}>
            <input 
              type="checkbox" 
              checked={allOptions} 
              onChange={handleAllOptionsChange}
              className={styles.checkbox}
            />
            All Options
          </label>
        </div>

        <div className={styles.optionsList}>
          {[
            { key: 'transfer_of_security', label: 'Transfer of securities' },
            { key: 'pledging', label: 'Pledging/ Re-pledging of securities' },
            { key: 'mutual_fund_transaction', label: 'Mutual Fund transactions' },
            { key: 'tendering_shares', label: 'Tendering shares in open offers' },
          ].map(({ key, label }) => (
            <div key={key} className={styles.optionItem}>
              <span className={styles.optionLabel}>{label}</span>
              <div className={styles.radioGroup}>
                <label className={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name={key} 
                    checked={options[key] === true} 
                    onChange={() => handleOptionChange(key, true)}
                    className={styles.radioInput}
                  /> Yes
                </label>
                <label className={styles.radioLabel}>
                  <input 
                    type="radio" 
                    name={key} 
                    checked={options[key] === false} 
                    onChange={() => handleOptionChange(key, false)}
                    className={styles.radioInput}
                  /> No
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.saveButtonContainer}>
          <button 
            onClick={() => onSave(options)}
            className={styles.saveButton}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default DdpiModal;
