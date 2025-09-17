import { GoogleGenAI, Type } from "@google/genai";
import type { CuttingList, ImageView, EditPreferences } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- START: API Retry Logic ---

/**
 * Checks if an error is a rate-limit or quota-related error.
 * @param error The error to check.
 * @returns True if the error is a rate-limit error, false otherwise.
 */
const isRateLimitError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Google AI SDKs can throw errors with status codes like 429
    return message.includes('quota') || message.includes('rate limit') || message.includes('429');
  }
  return false;
};

/**
 * A wrapper function to call a Gemini API function with automatic retries on rate limit errors.
 * Uses exponential backoff with jitter to space out retries.
 * @param apiCall The function that makes the API call.
 * @param maxRetries Maximum number of retries.
 * @param initialDelay The initial delay in milliseconds before the first retry.
 * @returns The result of the API call.
 */
const callApiWithRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> => {
  let attempt = 0;
  while (true) {
    try {
      return await apiCall();
    } catch (error) {
      attempt++;
      if (attempt >= maxRetries || !isRateLimitError(error)) {
        // Re-throw the error if we've exhausted retries or it's not a rate limit error
        throw error;
      }
      // Calculate delay with exponential backoff and a random jitter
      const delay = initialDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.warn(`API rate limit hit. Retrying in ${Math.round(delay)}ms... (Attempt ${attempt}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// --- END: API Retry Logic ---

/**
 * Runs an array of promise-returning functions in batches to avoid rate limiting.
 * @param promiseFactories An array of functions that each return a Promise.
 * @param batchSize The number of promises to run concurrently in each batch.
 * @returns An array of results from all promises.
 */
async function runPromisesInBatches<T>(
  promiseFactories: Array<() => Promise<T>>,
  batchSize: number
): Promise<T[]> {
  let results: T[] = [];
  for (let i = 0; i < promiseFactories.length; i += batchSize) {
    const batchFactories = promiseFactories.slice(i, i + batchSize);
    const batchPromises = batchFactories.map(factory => factory());
    const batchResults = await Promise.all(batchPromises);
    results = results.concat(batchResults);
  }
  return results;
}


const cuttingListSchema = {
  type: Type.OBJECT,
  properties: {
    houseName: {
      type: Type.STRING,
      description: "A fun and creative name for the miniature house.",
    },
    description: {
      type: Type.STRING,
      description: "A short, one-sentence description of the house design.",
    },
    materials: {
      type: Type.ARRAY,
      description: "A list of simple craft materials needed to build the house.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "The name of the material (e.g., Cardboard, Craft Stick, Bottle Cap).",
          },
          quantity: {
            type: Type.INTEGER,
            description: "The number of pieces of this material needed.",
          },
          dimensions: {
            type: Type.STRING,
            description: "The size of each piece (e.g., '10cm x 15cm', '5cm long', 'Standard size').",
          },
        },
        required: ["name", "quantity", "dimensions"],
      },
    },
  },
  required: ["houseName", "description", "materials"],
};

const VIEWS = ['Front view', 'Back view', 'Left side view', 'Right side view', 'Top-down view'];

// Result types for image generation to differentiate them after batching
type ViewImageResult = { type: 'view'; label: string; base64: string | null };
type SketchImageResult = { type: 'sketch'; base64: string | null };
type ImageResult = ViewImageResult | SketchImageResult;


async function generateAssetsFromDescription(detailedDescription: string) {
  // Create an array of "factories" (functions that return a promise).
  // This prevents all API calls from firing at once when the array is created.
  const imagePromiseFactories: Array<() => Promise<ImageResult>> = [
    ...VIEWS.map(view => (): Promise<ViewImageResult> =>
      callApiWithRetry(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A photorealistic 3D architectural render of a miniature dollhouse for kids. The design is based on this detailed description: "${detailedDescription}". Show the ${view} of the house. The style is cute, playful, and looks like a real, buildable model. White background.`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      })).then(res => ({
        type: 'view' as const,
        label: view,
        base64: res.generatedImages?.[0]?.image?.imageBytes ?? null
      }))
    ),
    (): Promise<SketchImageResult> => callApiWithRetry(() => ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `A simple black and white blueprint-style line drawing of the miniature house based on this detailed description: "${detailedDescription}". The sketch must include clear, simple measurement labels for key parts like walls, roof, door, and windows. The style should be a clean, technical drawing on a white background.`,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
        }
    })).then(res => ({
        type: 'sketch' as const,
        base64: res.generatedImages?.[0]?.image?.imageBytes ?? null
    }))
  ];
  
  const cuttingListPromise = callApiWithRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Based on the following detailed description, create a simple cutting list for a miniature house that a child could build with adult help. Description: "${detailedDescription}"`,
    config: {
      systemInstruction: "You are a helpful and creative assistant for kids who designs simple, buildable miniature houses. Based on the provided detailed description, generate a descriptive name for the house and a simple cutting list of materials. The materials should be common craft supplies like cardboard, craft sticks, or foam board. The dimensions should be easy for a child to measure and cut with adult supervision. Keep the design simple, fun, and use a maximum of 5 material types.",
      responseMimeType: "application/json",
      responseSchema: cuttingListSchema,
    },
  }));

  // Run image generation in batches to avoid hitting API rate limits.
  // Batch size of 3 is a safe number for most free-tier plans.
  const imageBatchPromise = runPromisesInBatches(imagePromiseFactories, 3);

  const [allImageResults, cuttingListResponse] = await Promise.all([
    imageBatchPromise,
    cuttingListPromise
  ]);

  // Process the results from the image batches
  const imageViews = allImageResults
    .filter((result): result is ViewImageResult => result.type === 'view' && !!result.base64)
    .map(result => ({
      label: result.label,
      url: `data:image/jpeg;base64,${result.base64!}`
    }));
    
  const sketchResult = allImageResults.find((r): r is SketchImageResult => r.type === 'sketch');
  const sketchUrl = sketchResult?.base64 ? `data:image/jpeg;base64,${sketchResult.base64}` : null;

  let cuttingList: CuttingList | null = null;
  try {
    const jsonText = cuttingListResponse.text.trim();
    if(jsonText) {
      cuttingList = JSON.parse(jsonText) as CuttingList;
    }
  } catch(e) {
    console.error("Failed to parse cutting list JSON", e);
  }

  return { 
    imageViews: imageViews.length > 0 ? imageViews : null, 
    sketchUrl, 
    cuttingList,
    detailedDescription
  };
}


export async function generateHouseDesign(prompt: string): Promise<{ 
    imageViews: ImageView[] | null; 
    sketchUrl: string | null;
    cuttingList: CuttingList | null;
    detailedDescription: string | null;
}> {
  // Step 1: Generate a detailed, consistent description from the user's prompt to use as a single source of truth.
  const descriptionGeneratorResponse = await callApiWithRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Based on the user's idea, create a detailed and consistent architectural description for a miniature house. This description will be used to generate multiple 3D views, so it must be very specific about colors, shapes, materials, windows, doors, and unique features. User's idea: "${prompt}"`,
    config: {
      systemInstruction: "You are an imaginative architect for kids' toys. Your task is to expand a simple idea into a detailed, concrete description of a miniature house. Be creative but precise. Do not use markdown.",
    },
  }));

  const detailedDescription = descriptionGeneratorResponse.text.trim();
  
  if (!detailedDescription) {
    throw new Error("Could not generate a detailed description for the house.");
  }

  // Step 2: Generate assets from the new description.
  return generateAssetsFromDescription(detailedDescription);
}

export async function editHouseDesign(
  originalDescription: string,
  edits: EditPreferences
): Promise<{ 
    imageViews: ImageView[] | null; 
    sketchUrl: string | null;
    cuttingList: CuttingList | null;
    detailedDescription: string | null;
}> {
  // Construct a prompt for the edit.
  let editPrompt = "Based on this original house description, please generate a new, complete architectural description that incorporates the following changes. Do not just list the changes, provide the full, updated description.\n\n";
  editPrompt += `Original Description: "${originalDescription}"\n\n`;
  editPrompt += "Requested Changes:\n";
  if (edits.primaryColor) editPrompt += `- Change the primary color to ${edits.primaryColor}.\n`;
  if (edits.secondaryColor) editPrompt += `- Change the secondary color to ${edits.secondaryColor}.\n`;
  if (edits.roofMaterial) editPrompt += `- Change the roof to be made of or look like ${edits.roofMaterial}.\n`;
  if (edits.featureHighlights) editPrompt += `- Also, incorporate this request: ${edits.featureHighlights}.\n`;
  
  // Step 1: Generate a NEW detailed description.
  const newDescriptionGeneratorResponse = await callApiWithRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: editPrompt,
    config: {
      systemInstruction: "You are an imaginative architect for kids' toys. Your task is to revise an existing description of a miniature house based on user feedback. Integrate the changes seamlessly into a new, complete description. Do not use markdown.",
    },
  }));

  const newDetailedDescription = newDescriptionGeneratorResponse.text.trim();
  
  if (!newDetailedDescription) {
    throw new Error("Could not generate an updated description for the house.");
  }

  // Step 2: Generate assets from the new description.
  return generateAssetsFromDescription(newDetailedDescription);
}