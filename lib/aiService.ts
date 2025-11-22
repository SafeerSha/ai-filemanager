import { apiService } from './apiService';

export const callAI = async (userPrompt: string, path?: string) => {
  try {
    const result = await apiService.processAI(userPrompt, path);
    // The backend now handles AI processing and returns the result
    return result;
  } catch (error) {
    console.error('AI call failed:', error);
    return { action: 'unknown' };
  }
};