
import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { ImageView } from '../types';

interface HouseDisplayProps {
  imageViews: ImageView[] | null;
  isLoading: boolean;
}

const Placeholder: React.FC = () => (
    <div className="w-full aspect-square bg-gray-200/80 rounded-2xl flex items-center justify-center">
        <LoadingSpinner />
    </div>
);

export const HouseDisplay: React.FC<HouseDisplayProps> = ({ imageViews, isLoading }) => {
  const [mainImage, setMainImage] = useState<ImageView | null>(imageViews ? imageViews[0] : null);

  React.useEffect(() => {
    if (imageViews && imageViews.length > 0) {
      setMainImage(imageViews[0]);
    } else {
      setMainImage(null);
    }
  }, [imageViews]);

  const containerClass = "bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-b-2xl rounded-tr-2xl shadow-lg border border-sky-200";

  if (isLoading) {
    return (
        <div className={containerClass}>
            <h2 className="text-2xl font-bold text-sky-800 mb-4 text-center">Conceptualizing the 3D model...</h2>
            <Placeholder />
        </div>
    );
  }

  if (!imageViews || imageViews.length === 0) {
    return null;
  }

  return (
    <div className={`${containerClass} animate-fade-in`}>
      <h2 className="text-2xl font-bold text-sky-800 mb-4 text-center" id="gallery-heading">Your 3D House Design!</h2>
      
      {mainImage && (
        <div className="mb-4">
            <figure role="group" aria-labelledby="gallery-heading">
                <div className="aspect-square w-full overflow-hidden rounded-2xl shadow-inner">
                  <img src={mainImage.url} alt={`Generated miniature house design - ${mainImage.label}`} className="w-full h-full object-cover" />
                </div>
                <figcaption className="text-center font-semibold text-sky-700 mt-2">{mainImage.label}</figcaption>
            </figure>
        </div>
      )}
      
      <div className="grid grid-cols-5 gap-2" role="group" aria-label="Image view controls">
        {imageViews.map((view, index) => (
            <button 
              key={index} 
              onClick={() => setMainImage(view)} 
              aria-label={`View ${view.label}`}
              aria-pressed={mainImage?.url === view.url}
              className={`aspect-square w-full overflow-hidden rounded-lg border-4 transition-colors duration-200 ${mainImage?.url === view.url ? 'border-yellow-400' : 'border-transparent hover:border-sky-300'}`}
            >
                <img src={view.url} alt={`Thumbnail of ${view.label}`} className="w-full h-full object-cover" />
            </button>
        ))}
      </div>
    </div>
  );
};
