import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export const createElevenLabsClient = () => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is not set in environment variables');
  }
  
  return new ElevenLabsClient({
    apiKey,
  });
};

// For use in components that might be prerendered
export const getElevenLabsClientSafe = () => {
  // Only create client if we're not in build time
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    return null;
  }
  
  return createElevenLabsClient();
};