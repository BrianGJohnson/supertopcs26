/**
 * Phrase Filtering Utilities
 * 
 * This module contains language detection and date-based filtering logic
 * for keyword phrases. Extracted from FilterToolbar for reusability and testability.
 */

// =============================================================================
// LANGUAGE DETECTION
// =============================================================================

// Language detection patterns - keyword and native script detection
export const LANGUAGE_PATTERNS: Record<string, RegExp> = {
    hindi: /\b(hindi|हिंदी)\b/i,
    tamil: /\b(tamil|தமிழ்)\b/i,
    telugu: /\b(telugu|తెలుగు)\b/i,
    malayalam: /\b(malayalam|മലയാളം)\b/i,
    bengali: /\b(bengali|bangla|বাংলা)\b/i,
    kannada: /\b(kannada|ಕನ್ನಡ)\b/i,
    marathi: /\b(marathi|मराठी)\b/i,
    gujarati: /\b(gujarati|ગુજરાતી)\b/i,
    punjabi: /\b(punjabi|ਪੰਜਾਬੀ)\b/i,
    urdu: /\b(urdu|اردو)\b/i,
    arabic: /\b(arabic|العربية)\b/i,
    spanish: /\b(español|spanish|en español)\b/i,
    portuguese: /\b(portuguese|português)\b/i,
    french: /\b(french|français)\b/i,
    german: /\b(german|deutsch)\b/i,
    russian: /\b(russian|русский)\b/i,
    japanese: /\b(japanese|日本語)\b/i,
    korean: /\b(korean|한국어)\b/i,
    chinese: /\b(chinese|中文|mandarin)\b/i,
    vietnamese: /\b(vietnamese|tiếng việt)\b/i,
    thai: /\b(thai|ไทย)\b/i,
    indonesian: /\b(indonesian|bahasa)\b/i,
    turkish: /\b(turkish|türkçe)\b/i,
    italian: /\b(italian|italiano)\b/i,
    dutch: /\b(dutch|nederlands)\b/i,
    polish: /\b(polish|polski)\b/i,
    amharic: /\b(amharic|አማርኛ)\b/i,
    // Additional languages
    uzbek: /\b(uzbek|tilida|tili|o'zbek)\b/i,  // Uzbek - "tilida" means "in [language]"
    malay: /\b(malay|melayu)\b/i,
    swahili: /\b(swahili|kiswahili)\b/i,
    hebrew: /\b(hebrew|עברית)\b/i,
    greek: /\b(greek|ελληνικά)\b/i,
    // Catch translated query patterns - "month" after month name indicates non-English
    monthPattern: /\b(january|february|march|april|june|july|august|september|october|november|december)\s+month\b/i,
};

// Romanized/transliterated word patterns for major languages
// These detect non-English words written in Latin script
export const ROMANIZED_PATTERNS: Record<string, RegExp[]> = {
    // Hindi/Urdu - common words in Romanized form
    hindiUrdu: [
        /\b(kaise|kare|karna|karen)\b/i,              // how, do, to do
        /\b(kya|kab|kahan|kyun|kaun)\b/i,             // what, when, where, why, who
        /\b(hai|hain|ho|hoga|hota|hoti)\b/i,          // is, are, be, will be, happens
        /\b(mein|par|se|ke|ka|ki)\b/i,                // in, on, from, of (possessive markers)
        /\b(aur|ya|lekin|par)\b/i,                    // and, or, but
        /\b(gaya|gayi|diya|liya)\b/i,                 // went, gave, took (past tense markers)
        /\b(bare|jankari|tarike|tarika)\b/i,          // about, information, methods
        /\b(sabse|sab|bahut|zyada)\b/i,               // most, all, very, more
        /\b(pata|samajh|dekh|suno)\b/i,               // know, understand, see, listen
        /\b(chahiye|chahte|chahta)\b/i,               // want, need
    ],

    // Spanish - common words
    spanish: [
        /\b(como|que|para|por|con|sin)\b/i,           // how, that, for, by, with, without
        /\b(donde|cuando|porque|quien)\b/i,           // where, when, because, who
        /\b(hacer|hace|hecho|haciendo)\b/i,           // to do, does, done, doing
        /\b(mejor|mas|muy|mucho)\b/i,                 // better, more, very, much
        /\b(todo|todos|todas|nada)\b/i,               // all, everything, nothing
    ],

    // Portuguese - common words
    portuguese: [
        /\b(como|que|para|por|com|sem)\b/i,           // how, that, for, by, with, without
        /\b(onde|quando|porque|quem)\b/i,             // where, when, because, who
        /\b(fazer|faz|feito|fazendo)\b/i,             // to do, does, done, doing
        /\b(melhor|mais|muito|muitos)\b/i,            // better, more, very, many
        /\b(tudo|todos|todas|nada)\b/i,               // all, everything, nothing
    ],

    // French - common words
    french: [
        /\b(comment|pour|avec|sans|dans)\b/i,         // how, for, with, without, in
        /\b(faire|fait|faisant)\b/i,                  // to do, does, doing
        /\b(meilleur|plus|tres|beaucoup)\b/i,         // better, more, very, much
        /\b(tout|tous|toutes|rien)\b/i,               // all, everything, nothing
    ],

    // German - common words
    german: [
        /\b(wie|mit|ohne|durch|uber)\b/i,             // how, with, without, through, over
        /\b(machen|macht|gemacht)\b/i,                // to do, does, done
        /\b(besser|mehr|sehr|viel)\b/i,               // better, more, very, much
        /\b(alles|alle|nichts)\b/i,                   // all, everything, nothing
    ],

    // Turkish - common words
    turkish: [
        /\b(nasil|icin|ile|olmadan)\b/i,              // how, for, with, without
        /\b(yapmak|yapma|yapti|yapiyor)\b/i,          // to do, don't do, did, doing
        /\b(daha|cok|en)\b/i,                         // more, very, most
    ],

    // Indonesian - common words
    indonesian: [
        /\b(bagaimana|untuk|dengan|tanpa)\b/i,        // how, for, with, without
        /\b(membuat|buat|dibuat)\b/i,                 // to make, make, made
        /\b(lebih|sangat|paling)\b/i,                 // more, very, most
        /\b(semua|tidak|ada)\b/i,                     // all, not, there is
    ],
};

/**
 * Check if a phrase contains non-English language indicators
 * Uses both keyword/native script detection AND Romanized word detection
 * 
 * @param phrase - The phrase to check
 * @returns true if phrase appears to be non-English
 */
export function hasNonEnglishIndicator(phrase: string): boolean {
    // Check 1: Language name keywords and native scripts
    if (Object.values(LANGUAGE_PATTERNS).some(pattern => pattern.test(phrase))) {
        return true;
    }

    // Check 2: Romanized/transliterated words
    // Require 2+ matches from the same language to reduce false positives
    for (const patterns of Object.values(ROMANIZED_PATTERNS)) {
        let matchCount = 0;
        for (const pattern of patterns) {
            if (pattern.test(phrase)) {
                matchCount++;
                if (matchCount >= 2) {
                    return true; // Found 2+ words from this language
                }
            }
        }
    }

    return false;
}

// =============================================================================
// DATE-BASED FILTERING
// =============================================================================

// Month names for date detection
export const MONTHS = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
] as const;

// Evergreen terms that should never be filtered
export const EVERGREEN_TERMS = [
    'summer', 'fall', 'winter', 'spring', 'autumn',
    'christmas', 'holiday', 'holidays',
    'latest', 'new', 'update', 'updates', 'current', 'recent',
    'today', 'tomorrow', 'upcoming', 'future'
];

export interface ExtractedDate {
    original: string;  // Original matched text
    year?: number;     // Extracted year
    month?: number;    // Extracted month (0-11, JavaScript Date convention)
}

/**
 * Check if phrase contains evergreen terms that should never be filtered
 */
export function hasEvergreenTerm(phrase: string): boolean {
    const lowerPhrase = phrase.toLowerCase();
    return EVERGREEN_TERMS.some(term => lowerPhrase.includes(term));
}

/**
 * Extract all dates from a phrase (years, months, month+year combinations)
 * Exported for testing purposes
 * 
 * @param phrase - The phrase to extract dates from
 * @returns Array of extracted dates
 */
export function extractDates(phrase: string): ExtractedDate[] {
    const dates: ExtractedDate[] = [];
    const lowerPhrase = phrase.toLowerCase();

    // Extract month + year combinations (e.g., "September 2025", "June 2024")
    const monthYearPattern = /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(20\d{2})\b/gi;
    let match;
    while ((match = monthYearPattern.exec(lowerPhrase)) !== null) {
        const monthName = match[1].toLowerCase();
        const year = parseInt(match[2], 10);
        const month = MONTHS.indexOf(monthName as typeof MONTHS[number]);
        dates.push({
            original: match[0],
            year,
            month: month !== -1 ? month : undefined,
        });
    }

    // Extract standalone years (e.g., "2024", "2023")
    // Only match years not already captured in month+year
    const yearPattern = /\b(20\d{2})\b/g;
    const capturedYears = new Set(dates.map(d => d.year));
    while ((match = yearPattern.exec(lowerPhrase)) !== null) {
        const year = parseInt(match[1], 10);
        if (!capturedYears.has(year)) {
            dates.push({
                original: match[0],
                year,
            });
            capturedYears.add(year);
        }
    }

    return dates;
}

/**
 * Check if a phrase is outdated based on current date and seed phrase context
 * 
 * Rules:
 * - Past years (< current year) are filtered unless in seed phrase
 * - Past months in current year are filtered unless in seed phrase
 * - Current month and future dates are kept
 * - Evergreen terms (summer, latest, etc.) are always kept
 * 
 * @param phrase - The phrase to check
 * @param seedPhrase - The seed phrase from the session (for context awareness)
 * @returns true if phrase should be filtered (is outdated)
 */
export function isOutdatedPhrase(phrase: string, seedPhrase: string): boolean {
    // Check for evergreen terms first
    if (hasEvergreenTerm(phrase)) {
        return false;
    }

    // Get current date
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed (December = 11)

    // Extract dates from phrase
    const dates = extractDates(phrase);

    // If no dates found, don't filter
    if (dates.length === 0) {
        return false;
    }

    // Check each date
    for (const date of dates) {
        // If seed phrase contains this exact date string, don't filter (user intent)
        const lowerSeed = seedPhrase.toLowerCase();
        if (lowerSeed.includes(date.original.toLowerCase())) {
            continue; // Skip this date, check others
        }

        // Check if past year (e.g., 2024 when current is 2025)
        if (date.year && date.year < currentYear) {
            return true; // Filter - past year
        }

        // Check if past month in current year (e.g., "September 2025" when current is "December 2025")
        if (date.year === currentYear && date.month !== undefined && date.month < currentMonth) {
            return true; // Filter - past month in current year
        }
    }

    return false; // Don't filter
}
