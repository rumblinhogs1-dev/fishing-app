/**
 * Client-side content moderation filter.
 * Layer 1: Blocks obvious profanity/slurs before content reaches Firestore.
 * Layer 2: Server-side Gemini moderation catches what slips through.
 */

// Common profanity/slurs — kept minimal to avoid false positives on fishing terms.
// Each entry is lowercased. We match whole-word and common evasion patterns.
const BLOCKED_WORDS = [
  'fuck', 'shit', 'ass', 'bitch', 'dick', 'cock', 'pussy', 'cunt',
  'damn', 'bastard', 'whore', 'slut', 'piss',
  'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded',
  'kike', 'spic', 'chink', 'wetback', 'beaner',
  'kill yourself', 'kys',
];

// Allowlist — fishing terms that could false-positive
const ALLOWED_WORDS = [
  'bass', 'crappie', 'dam', 'cockle', 'cocktail',
  'shitepoke', 'assfish', 'assassin', 'classic', 'grass',
  'pass', 'mass', 'class', 'compass', 'bypass',
];

// Build regex patterns that handle common evasion: l33t speak, spacing, special chars
function buildPattern(word) {
  const escaped = word
    .replace(/a/g, '[a@4àáâãäå]')
    .replace(/e/g, '[e3èéêë€]')
    .replace(/i/g, '[i1!|ìíîï]')
    .replace(/o/g, '[o0òóôõö]')
    .replace(/s/g, '[s$5]')
    .replace(/t/g, '[t7+]')
    .replace(/l/g, '[l1|]')
    .replace(/u/g, '[uùúûü]');
  // Allow optional separators between chars (spaces, dots, dashes, underscores)
  const spaced = escaped.split('').join('[\\s._-]*');
  return new RegExp(`\\b${spaced}\\b`, 'i');
}

const BLOCKED_PATTERNS = BLOCKED_WORDS.map((word) => ({
  word,
  regex: buildPattern(word),
}));

/**
 * Check if text contains blocked content.
 * @param {string} text
 * @returns {{ blocked: boolean, reason: string|null, matches: string[] }}
 */
export function checkContent(text) {
  if (!text || typeof text !== 'string') {
    return { blocked: false, reason: null, matches: [] };
  }

  const lower = text.toLowerCase();

  // Quick check: skip if text is in allowed words
  const words = lower.split(/\s+/);
  const onlyAllowed = words.every((w) =>
    ALLOWED_WORDS.some((a) => w === a || w.includes(a))
  );
  if (onlyAllowed && words.length <= 3) {
    return { blocked: false, reason: null, matches: [] };
  }

  const matches = [];
  for (const { word, regex } of BLOCKED_PATTERNS) {
    if (regex.test(text)) {
      // Verify it's not an allowed word false positive
      const isAllowed = ALLOWED_WORDS.some((a) => {
        const aRegex = new RegExp(`\\b${a}\\b`, 'i');
        return aRegex.test(text);
      });

      // Re-check: remove allowed words and test again
      if (isAllowed) {
        let cleaned = lower;
        for (const a of ALLOWED_WORDS) {
          cleaned = cleaned.replace(new RegExp(`\\b${a}\\b`, 'gi'), '');
        }
        if (regex.test(cleaned)) {
          matches.push(word);
        }
      } else {
        matches.push(word);
      }
    }
  }

  if (matches.length > 0) {
    return {
      blocked: true,
      reason: 'Your message contains inappropriate language. Please keep it family-friendly.',
      matches,
    };
  }

  return { blocked: false, reason: null, matches: [] };
}

/**
 * Sanitize text by replacing blocked words with asterisks.
 * Use this as a softer alternative to blocking entirely.
 */
export function censorText(text) {
  if (!text) return text;
  let result = text;
  for (const { regex, word } of BLOCKED_PATTERNS) {
    result = result.replace(regex, '*'.repeat(word.length));
  }
  return result;
}
