// Utils index - shared utility functions

/**
 * Brand names and special words that have specific capitalization
 * Add new entries as needed
 */
const SPECIAL_WORDS: Record<string, string> = {
  'youtube': 'YouTube',
  'iphone': 'iPhone',
  'ipad': 'iPad',
  'imac': 'iMac',
  'ios': 'iOS',
  'macos': 'macOS',
  'tiktok': 'TikTok',
  'linkedin': 'LinkedIn',
  'facebook': 'Facebook',
  'instagram': 'Instagram',
  'twitter': 'Twitter',
  'whatsapp': 'WhatsApp',
  'chatgpt': 'ChatGPT',
  'openai': 'OpenAI',
  'ai': 'AI',
  'seo': 'SEO',
  'usa': 'USA',
  'uk': 'UK',
  'diy': 'DIY',
  'pdf': 'PDF',
  'html': 'HTML',
  'css': 'CSS',
  'api': 'API',
  'url': 'URL',
  'wifi': 'WiFi',
  'tv': 'TV',
  'vr': 'VR',
  'ar': 'AR',
  '3d': '3D',
  '2d': '2D',
};

/**
 * Convert string to Title Case with special word handling
 * "youtube algorithm" → "YouTube Algorithm"
 * "iphone tips" → "iPhone Tips"
 */
export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => {
      // Check if it's a special word
      const special = SPECIAL_WORDS[word];
      if (special) return special;
      // Otherwise capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}
