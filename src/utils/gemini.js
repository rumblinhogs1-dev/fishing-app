const API_KEY_STORAGE = 'fishing-log-gemini-key';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const MAX_SIZE = 1024;

/**
 * Returns the Gemini API key from env var or localStorage fallback.
 */
export function getApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) return envKey;
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

/**
 * Returns true if the key comes from the env var (not user-entered).
 */
export function hasEnvKey() {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
}

/**
 * Saves a user-provided API key to localStorage.
 */
export function saveApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key);
}

/**
 * Resize an image File to a max dimension and return a JPEG base64 data URL.
 */
export function resizeImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read the image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load the image. The file may be corrupted.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          } else {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Send an image to Gemini for fish identification.
 * @param {string} imageDataUrl - base64 data URL of the image
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<object>} - parsed identification result
 */
export async function identifyFish(imageDataUrl, apiKey) {
  if (!apiKey?.trim()) {
    throw new Error('API key is required. Set VITE_GEMINI_API_KEY in your .env file or enter it manually.');
  }
  if (!imageDataUrl) {
    throw new Error('No image provided.');
  }

  const base64 = imageDataUrl.split(',')[1];
  if (!base64) {
    throw new Error('Invalid image data.');
  }

  const body = {
    contents: [
      {
        parts: [
          {
            text: `You are a fish species identification expert and experienced angler. Analyze this image and identify the fish species. Also estimate the fish's size and weight based on visual cues in the photo (hands, lures, boat features, etc. for scale). Infer the most likely weather conditions and geographic location where this fish was caught based on the species, surroundings, lighting, vegetation, water color, and any other contextual clues in the image.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{"species": "Common Name", "scientificName": "Latin name", "confidence": 85, "estimatedLength": "18-20 inches", "estimatedWeight": "3-4 lbs", "weather": "Partly cloudy, approx 72°F, light breeze", "location": "Freshwater lake, likely southeastern United States", "description": "Brief 1-2 sentence description of key identifying features you see.", "habitat": "Brief typical habitat info.", "funFact": "One interesting fact about this species."}

If no fish is visible, respond with:
{"species": "No fish detected", "scientificName": "", "confidence": 0, "estimatedLength": "", "estimatedWeight": "", "weather": "", "location": "", "description": "No fish could be identified in this image.", "habitat": "", "funFact": ""}

The confidence should be 0-100 representing how certain you are of the identification. For estimatedLength and estimatedWeight, give a range if exact estimation is difficult. For weather, describe conditions you can infer from lighting, sky, clothing, etc. For location, be as specific as possible based on species range, terrain, water type, and any visible landmarks or vegetation.`,
          },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64,
            },
          },
        ],
      },
    ],
  };

  let res;
  try {
    res = await fetch(`${API_URL}?key=${apiKey.trim()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    if (!navigator.onLine) {
      throw new Error('You appear to be offline. Please check your internet connection.');
    }
    throw new Error('Network error. Could not reach the Gemini API. Please try again.');
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    const msg = errData?.error?.message || '';

    if (res.status === 400) {
      throw new Error(msg.includes('API key') ? 'Invalid API key. Please check your Gemini API key.' : `Bad request: ${msg || 'The image could not be processed.'}`);
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error('Invalid or unauthorized API key. Please check your Gemini API key.');
    }
    if (res.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    if (res.status >= 500) {
      throw new Error('Gemini API is temporarily unavailable. Please try again later.');
    }
    throw new Error(msg || `API request failed (${res.status}).`);
  }

  const data = await res.json();

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const finishReason = data.candidates?.[0]?.finishReason;
    if (finishReason === 'SAFETY') {
      throw new Error('The image was blocked by safety filters. Please try a different photo.');
    }
    throw new Error('No response received from Gemini. Please try a different photo.');
  }

  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.species !== 'string' || typeof parsed.confidence !== 'number') {
      throw new Error('Unexpected response format.');
    }
    return parsed;
  } catch {
    throw new Error('Could not parse the AI response. Please try again with a clearer photo.');
  }
}
