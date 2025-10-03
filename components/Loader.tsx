
import React from 'react';

interface LoaderProps {
  message: string;
}

const Loader: React.FC<LoaderProps> = ({ message }) => (
  <div className="flex flex-col items-center justify-center text-center p-8 bg-gray-800/50 rounded-lg">
    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400"></div>
    <p className="mt-4 text-white text-lg font-medium">{message}</p>
  </div>
);

export default Loader;
