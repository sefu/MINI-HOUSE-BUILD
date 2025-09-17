
import React, { useState } from 'react';
import type { EditPreferences } from '../types';
import { SparklesIcon } from './icons';

interface EditFormProps {
  onUpdate: (preferences: EditPreferences) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const EditForm: React.FC<EditFormProps> = ({ onUpdate, onCancel, isLoading }) => {
  const [preferences, setPreferences] = useState<EditPreferences>({
    primaryColor: '',
    secondaryColor: '',
    roofMaterial: '',
    featureHighlights: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(preferences);
  };

  const inputClass = "w-full p-3 text-lg bg-white border-2 border-sky-300 rounded-xl focus:ring-4 focus:ring-yellow-300 focus:border-yellow-500 transition-all duration-300";
  const labelClass = "block mb-2 text-lg font-semibold text-sky-800";

  return (
    <div className="w-full max-w-3xl bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-sky-200 animate-fade-in">
      <h2 className="text-3xl font-bold text-sky-800 text-center mb-6">Edit Your Design</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="primaryColor" className={labelClass}>Primary Color</label>
            <input
              type="text"
              id="primaryColor"
              name="primaryColor"
              value={preferences.primaryColor}
              onChange={handleChange}
              placeholder="like a big, red strawberry"
              className={inputClass}
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="secondaryColor" className={labelClass}>Secondary Color</label>
            <input
              type="text"
              id="secondaryColor"
              name="secondaryColor"
              value={preferences.secondaryColor}
              onChange={handleChange}
              placeholder="like a fluffy white cloud"
              className={inputClass}
              disabled={isLoading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="roofMaterial" className={labelClass}>Roof Material / Style</label>
          <input
            type="text"
            id="roofMaterial"
            name="roofMaterial"
            value={preferences.roofMaterial}
            onChange={handleChange}
            placeholder="made of shiny chocolate tiles"
            className={inputClass}
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="featureHighlights" className={labelClass}>Add or Change Features</label>
          <textarea
            id="featureHighlights"
            name="featureHighlights"
            value={preferences.featureHighlights}
            onChange={handleChange}
            placeholder="add a secret trap door!"
            className={`${inputClass} h-24 resize-none`}
            disabled={isLoading}
          />
        </div>
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 text-lg font-bold text-gray-600 bg-gray-200 rounded-xl hover:bg-gray-300 transition-colors duration-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="w-auto flex-shrink-0 bg-yellow-400 text-sky-900 font-bold text-lg px-8 py-3 rounded-xl shadow-md hover:bg-yellow-500 transform hover:scale-105 transition-all duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span role="status" className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-sky-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              <>
                <SparklesIcon className="w-6 h-6" aria-hidden="true" />
                Update Design
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
