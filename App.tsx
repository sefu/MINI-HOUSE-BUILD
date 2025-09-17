
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { PromptInput } from './components/PromptInput';
import { HouseDisplay } from './components/HouseDisplay';
import { CuttingListDisplay } from './components/CuttingListDisplay';
import { SketchDisplay } from './components/SketchDisplay';
import { EditForm } from './components/EditForm';
import { generateHouseDesign, editHouseDesign } from './services/geminiService';
import type { CuttingList, ImageView, EditPreferences } from './types';
import { ConstructionIcon, EditIcon } from './components/icons';

type ActiveView = 'design' | 'sketch';

const getFriendlyErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Invalid API Key
    if (message.includes('api key not valid') || message.includes('api_key_invalid') || message.includes('permission denied')) {
      return "There's a problem with the connection to the creative engine. Please ask an adult to check the API Key configuration.";
    }

    // Quota Exceeded
    if (message.includes('quota')) {
      return "The Dream Builder is very popular right now and has run out of creative energy for the moment. Please try again later!";
    }

    // Content safety issues
    if (message.includes('safety') || message.includes('blocked')) {
      return "Your idea is super creative, but the Dream Builder couldn't process it. Could you try describing your house in a different way?";
    }

    // A more specific generic error for other cases
    return `The blueprint machine had a little hiccup: ${error.message}. Please try again.`;
  }

  // The most generic fallback for non-Error types
  return 'Oh no! The blueprint machine got stuck. Please try a different idea.';
};


const App: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imageViews, setImageUrls] = useState<ImageView[] | null>(null);
  const [sketchUrl, setSketchUrl] = useState<string | null>(null);
  const [cuttingList, setCuttingList] = useState<CuttingList | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('design');
  const [detailedDescription, setDetailedDescription] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const clearContent = () => {
    setImageUrls(null);
    setSketchUrl(null);
    setCuttingList(null);
    setDetailedDescription(null);
    setError(null);
    setIsEditing(false);
  };

  const handleGenerationResult = (result: {
    imageViews: ImageView[] | null;
    sketchUrl: string | null;
    cuttingList: CuttingList | null;
    detailedDescription: string | null;
  }) => {
      if (result.imageViews) setImageUrls(result.imageViews);
      if (result.sketchUrl) setSketchUrl(result.sketchUrl);
      if (result.cuttingList) setCuttingList(result.cuttingList);
      if (result.detailedDescription) setDetailedDescription(result.detailedDescription);
  };

  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrls(null);
    setSketchUrl(null);
    setCuttingList(null);
    setDetailedDescription(null);
    setIsEditing(false);
    setActiveView('design');

    try {
      const result = await generateHouseDesign(prompt);
      handleGenerationResult(result);
    } catch (e) {
      console.error(e);
      setError(getFriendlyErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);
  
  const handleEditSubmit = useCallback(async (preferences: EditPreferences) => {
    if (!detailedDescription || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrls(null);
    setSketchUrl(null);
    setCuttingList(null);
    setIsEditing(false);
    setActiveView('design');
    
    try {
      const result = await editHouseDesign(detailedDescription, preferences);
      handleGenerationResult(result);
    } catch (e) {
      console.error(e);
      setError(getFriendlyErrorMessage(e));
    } finally {
      setIsLoading(false);
    }
  }, [detailedDescription, isLoading]);


  const handleUndo = useCallback(() => {
    clearContent();
  }, []);

  const TabButton: React.FC<{ view: ActiveView; label: string }> = ({ view, label }) => (
    <button
      id={`${view}-tab`}
      role="tab"
      aria-selected={activeView === view}
      aria-controls={`${view}-panel`}
      onClick={() => setActiveView(view)}
      disabled={isLoading}
      className={`px-6 py-3 text-lg font-bold rounded-t-lg transition-colors duration-300 ${
        activeView === view
          ? 'bg-white/80 backdrop-blur-sm text-sky-700'
          : 'bg-sky-600/50 text-white hover:bg-sky-600/80'
      }`}
    >
      {label}
    </button>
  );

  const hasContent = imageViews || sketchUrl || cuttingList;

  return (
    <div className="min-h-screen font-sans text-gray-800 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <Header />
      <main className="w-full max-w-6xl mx-auto flex flex-col items-center gap-8">
        {/* Visually hidden assertive live region for screen readers */}
        {isLoading && <div className="sr-only" role="status">Generating your amazing house design, please wait.</div>}

        {isEditing ? (
          <EditForm
            onUpdate={handleEditSubmit}
            onCancel={() => setIsEditing(false)}
            isLoading={isLoading}
          />
        ) : (
          <div className="w-full max-w-3xl text-center bg-white/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-sky-200">
            <p className="text-xl text-sky-700 mb-4" id="prompt-heading">
              What does your dream mini house look like?
            </p>
            <p className="text-gray-500 mb-6">
              Describe it below! For example, "a cozy mushroom cottage with a round door" or "a futuristic space station house".
            </p>
            <PromptInput
              prompt={prompt}
              setPrompt={setPrompt}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onUndo={handleUndo}
              hasContent={!!hasContent}
            />
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md w-full max-w-3xl" role="alert">
            <p className="font-bold">Oops!</p>
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !hasContent && !error && (
           <div className="text-center text-sky-600 p-8 w-full max-w-3xl">
             <ConstructionIcon className="w-24 h-24 mx-auto text-sky-300" aria-hidden="true" />
             <p className="mt-4 text-lg">Your amazing designs will appear here!</p>
          </div>
        )}
        
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="w-full">
                {hasContent && !isLoading && !isEditing && (
                    <div role="tablist" aria-label="Design and Sketch views" className="flex items-end gap-2">
                        {imageViews && <TabButton view="design" label="3D Design" />}
                        {sketchUrl && <TabButton view="sketch" label="Assembly Sketch" />}
                        <button
                            onClick={() => setIsEditing(true)}
                            className="ml-auto mb-1 flex items-center gap-2 px-4 py-2 text-md font-semibold text-sky-700 bg-white/80 rounded-lg shadow-sm hover:bg-yellow-100 transition-colors duration-300 border border-sky-200"
                            aria-label="Edit Design"
                        >
                            <EditIcon className="w-5 h-5" aria-hidden="true" />
                            Edit Design
                        </button>
                    </div>
                )}
                <div id="design-panel" role="tabpanel" aria-labelledby="design-tab" hidden={activeView !== 'design'}>
                    <HouseDisplay imageViews={imageViews} isLoading={isLoading} />
                </div>
                 <div id="sketch-panel" role="tabpanel" aria-labelledby="sketch-tab" hidden={activeView !== 'sketch'}>
                    <SketchDisplay sketchUrl={sketchUrl} isLoading={isLoading} />
                </div>
            </div>
            <CuttingListDisplay cuttingList={cuttingList} isLoading={isLoading} />
        </div>
      </main>
    </div>
  );
};

export default App;
