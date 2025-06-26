import React from 'react';

interface LoadingOverlayProps {
  visible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  if (!visible) return null;
  return (
    <div className="loading-overlay" role="status" aria-label="Loading">
      <div className="spinner" />
    </div>
  );
};

export default LoadingOverlay; 