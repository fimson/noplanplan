import { useEffect, useRef } from 'react';

function CustomModal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  const modalRef = useRef(null);
  
  // Prevent scrolling of the body when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Close on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  // Close when clicking outside the modal content
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  const sizeClass = {
    sm: 'custom-modal-sm',
    md: 'custom-modal-md',
    lg: 'custom-modal-lg',
    xl: 'custom-modal-xl'
  }[size] || 'custom-modal-md';
  
  return (
    <div className="custom-modal-backdrop" onClick={handleBackdropClick}>
      <div className={`custom-modal ${sizeClass}`} ref={modalRef}>
        <div className="custom-modal-header">
          <h5 className="custom-modal-title">{title}</h5>
          <button className="custom-modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="custom-modal-body">
          {children}
        </div>
        
        {footer && (
          <div className="custom-modal-footer">
            {footer}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .custom-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
        }
        
        .custom-modal {
          background-color: #343a40;
          border-radius: 4px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
          max-height: calc(100vh - 40px);
          display: flex;
          flex-direction: column;
          max-width: 95%;
        }
        
        .custom-modal-sm { width: 300px; }
        .custom-modal-md { width: 500px; }
        .custom-modal-lg { width: 800px; }
        .custom-modal-xl { width: 1140px; }
        
        .custom-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #495057;
        }
        
        .custom-modal-title {
          margin: 0;
          font-size: 1.25rem;
        }
        
        .custom-modal-close {
          background: none;
          border: none;
          font-size: 1.5rem;
          font-weight: bold;
          color: #adb5bd;
          cursor: pointer;
        }
        
        .custom-modal-close:hover {
          color: #fff;
        }
        
        .custom-modal-body {
          padding: 1rem;
          overflow-y: auto;
          flex: 1;
        }
        
        .custom-modal-footer {
          padding: 1rem;
          border-top: 1px solid #495057;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}

export default CustomModal; 