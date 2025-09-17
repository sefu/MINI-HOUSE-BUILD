import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface SketchDisplayProps {
  sketchUrl: string | null;
  isLoading: boolean;
}

const Placeholder: React.FC = () => (
    <div className="w-full aspect-square bg-gray-200/80 rounded-2xl flex items-center justify-center">
        <LoadingSpinner />
    </div>
);

export const SketchDisplay: React.FC<SketchDisplayProps> = ({ sketchUrl, isLoading }) => {
  const containerClass = "bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-b-2xl rounded-tl-2xl shadow-lg border border-sky-200";

  if (isLoading) {
    return (
        <div className={containerClass}>
            <h2 className="text-2xl font-bold text-sky-800 mb-4 text-center">Drafting the blueprints...</h2>
            <Placeholder />
        </div>
    );
  }

  if (!sketchUrl) {
    return null;
  }

  return (
    <div className={`${containerClass} animate-fade-in`}>
      <h2 className="text-2xl font-bold text-sky-800 mb-4 text-center">Assembly Sketch</h2>
      <div className="aspect-square w-full overflow-hidden rounded-2xl border bg-white">
        <img src={sketchUrl} alt="Generated assembly sketch with measurements" className="w-full h-full object-contain" />
      </div>
    </div>
  );
};