
import React from 'react';
import type { CuttingList } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface CuttingListProps {
  cuttingList: CuttingList | null;
  isLoading: boolean;
}

const Placeholder: React.FC = () => (
    <div className="w-full h-64 bg-gray-200/80 rounded-2xl flex items-center justify-center">
        <LoadingSpinner />
    </div>
);


export const CuttingListDisplay: React.FC<CuttingListProps> = ({ cuttingList, isLoading }) => {
  const containerClass = "bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-sky-200";
  
  if (isLoading) {
    return (
        <div className={containerClass}>
            <h2 className="text-2xl font-bold text-sky-800 mb-4 text-center">Calculating the materials...</h2>
            <Placeholder />
        </div>
    );
  }

  if (!cuttingList) {
    return null;
  }

  return (
    <div className={`${containerClass} animate-fade-in`}>
      <h2 className="text-2xl font-bold text-sky-800 mb-2 text-center">{cuttingList.houseName}</h2>
      <p className="text-center text-gray-600 mb-6 italic">"{cuttingList.description}"</p>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">Materials and cutting list for {cuttingList.houseName}</caption>
          <thead>
            <tr className="bg-sky-200/50">
              <th scope="col" className="p-3 text-lg font-semibold text-sky-900 rounded-tl-lg">Material</th>
              <th scope="col" className="p-3 text-lg font-semibold text-sky-900">Quantity</th>
              <th scope="col" className="p-3 text-lg font-semibold text-sky-900 rounded-tr-lg">Dimensions</th>
            </tr>
          </thead>
          <tbody>
            {cuttingList.materials.map((item, index) => (
              <tr key={index} className="border-b border-sky-200 last:border-b-0">
                <th scope="row" className="p-3 text-gray-700 font-medium">{item.name}</th>
                <td className="p-3 text-gray-700">{item.quantity}</td>
                <td className="p-3 text-gray-700">{item.dimensions}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
