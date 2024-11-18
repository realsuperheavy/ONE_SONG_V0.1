import React from "react";

interface SpinnerProps {
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ className = '' }) => (
  <div className={`animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-200 ${className}`} />
);

export default Spinner; 