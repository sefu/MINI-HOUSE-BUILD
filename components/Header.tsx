import React from 'react';
import { HouseIcon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="w-full text-center mb-8">
      <div className="inline-flex items-center gap-4">
        <HouseIcon className="w-12 h-12 text-yellow-500" />
        <h1 className="text-4xl sm:text-5xl font-bold text-sky-800 tracking-tight">
          afrikbitech Mini House Dream builder
        </h1>
        <HouseIcon className="w-12 h-12 text-teal-500" />
      </div>
    </header>
  );
};