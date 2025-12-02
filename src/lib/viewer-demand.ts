/**
 * Viewer Demand Scoring System
 * 
 * Scores seed phrases 0-100 based on autocomplete signals that indicate
 * genuine viewer interest (people wanting to learn, understand, solve, vent).
 * 
 * Philosophy: "Built for the Viewer" - we detect signals that real humans
 * use when looking for content, not SEO metrics.
 * 
 * @see docs/brand-voice-guide.md - No search/ranking language
 */

// =============================================================================
// TYPES
// =============================================================================

export interface DemandScore {
  score: number;                    // 0-100
  tier: DemandTier;
  label: string;
  description: string;
  
  // Breakdown
  suggestionCount: number;          // Raw count of autocomplete results
  totalSignals: number;             // Sum of all topic signals found
  signalDensity: number;            // Signals per suggestion (0-3+)
  semanticFocus: number;            // 0-100, how focused vs scattered
  
  // Details
  signalBreakdown: SignalBreakdown;
  suggestions: string[];
}

export type DemandTier = 'exceptional' | 'strong' | 'moderate' | 'light' | 'niche';

export interface SignalBreakdown {
  learning: number;
  question: number;
  timely: number;
  emotional: number;
  actionable: number;
  comparison: number;
  problem: number;
  specificity: number;
}

// =============================================================================
// TOPIC SIGNAL DICTIONARY (500+ signals)
// =============================================================================

/**
 * LEARNING & EDUCATIONAL SIGNALS
 * People trying to understand, learn, or get educated on a topic
 */
const LEARNING_SIGNALS: string[] = [
  // Core learning words
  'explain', 'explained', 'explaining', 'explainer', 'explains',
  'tutorial', 'tutorials',
  'guide', 'guides', 'guided',
  'learn', 'learning', 'learner', 'learners',
  'understand', 'understanding',
  'teach', 'teaching', 'teacher',
  'lesson', 'lessons',
  'course', 'courses',
  'class', 'classes',
  'training', 'trainer',
  'education', 'educational', 'educate',
  'study', 'studying',
  'master', 'mastering', 'mastery',
  
  // Introductory
  'introduction', 'intro', 'introducing',
  'basics', 'basic',
  'fundamentals', 'fundamental',
  'essentials', 'essential',
  'foundations', 'foundation',
  'principles', 'principle',
  '101', '102', '201',
  'abc', 'abcs',
  'primer',
  
  // Deep learning
  'walkthrough', 'walkthroughs',
  'breakdown', 'breakdowns',
  'overview', 'overviews',
  'summary', 'summarize', 'summarized',
  'recap', 'recapped',
  'review', 'reviewed', 'reviewing', 'reviews',
  'analysis', 'analyze', 'analyzed', 'analyzing',
  'deep dive', 'deepdive',
  'in depth', 'indepth', 'in-depth',
  'comprehensive',
  'complete', 'completely',
  'full', 'fully',
  'detailed', 'details', 'detail',
  'thorough', 'thoroughly',
  'crash course',
  'bootcamp', 'boot camp',
  'masterclass', 'master class',
  'workshop',
  
  // Skill levels
  'beginner', 'beginners', 'beginnner', 'beginers',
  'newbie', 'newbies', 'noob', 'noobs', 'n00b',
  'starter', 'starters', 'starting',
  'first time', 'firsttime', 'first-time',
  'from scratch',
  'from zero',
  'from nothing',
  'never done',
  'new to',
  'getting started',
  'start here',
  'intermediate',
  'advanced', 'advancing',
  'expert', 'experts',
  'pro', 'pros', 'professional',
  'experienced',
  
  // Process
  'step by step', 'stepbystep', 'step-by-step',
  'step 1', 'step 2', 'step 3',
  'phase', 'phases',
  'stage', 'stages',
  'process', 'processes',
  'method', 'methods', 'methodology',
  'approach', 'approaches',
  'framework', 'frameworks',
  'system', 'systems',
  'formula', 'formulas',
  'template', 'templates',
  'blueprint', 'blueprints',
  'roadmap', 'roadmaps',
  'path', 'pathway',
  'journey',
];

/**
 * QUESTION SIGNALS
 * Direct questions indicating information-seeking behavior
 */
const QUESTION_SIGNALS: string[] = [
  // Primary question words
  'how', 'how to', 'howto', 'how do', 'how does', 'how can', 'how should', 'how would',
  'why', 'why do', 'why does', 'why is', 'why are', 'why would', 'why should',
  'what', 'what is', 'whats', "what's", 'what are', 'what does', 'what do', 'what if',
  'when', 'when to', 'when should', 'when do', 'when does', 'when is',
  'where', 'where to', 'where do', 'where does', 'where is', 'where can',
  'which', 'which is', 'which are', 'which one', 'which ones',
  'who', 'who is', 'whos', "who's", 'who are', 'who does', 'who can',
  
  // Auxiliary questions
  'does', 'do', 'did',
  'is', 'are', 'was', 'were',
  'can', 'could', 'can i', 'can you', 'can we',
  'should', 'should i', 'should you', 'should we',
  'would', 'would i', 'would you',
  'will', 'will it', 'will this',
  'has', 'have', 'had',
  'might', 'may',
  
  // Question phrases
  'meaning of',
  'definition of',
  'difference between',
  'difference of',
  'is it possible',
  'is there',
  'are there',
  'do you need',
  'do i need',
  'worth it',
  'supposed to',
  'meant to',
];

/**
 * TIMELY/CURRENT SIGNALS
 * Indicates interest in recent, updated, or current information
 */
const TIMELY_SIGNALS: string[] = [
  // Will be supplemented by year regex
  'new', 'newer', 'newest',
  'latest', 'late',
  'recent', 'recently',
  'update', 'updated', 'updates', 'updating',
  'change', 'changed', 'changes', 'changing',
  'current', 'currently',
  'now', 'right now',
  'today', 'todays', "today's",
  'this week',
  'this month',
  'this year',
  'modern', 'contemporary',
  'fresh',
  'breaking',
  'just released',
  'just announced',
  'just dropped',
  'coming soon',
  'upcoming',
  'future', 'futures',
  'next', 'next gen', 'next generation',
  'version', 'v2', 'v3', '2.0', '3.0',
  'patch', 'patched',
  'hotfix',
  'revision', 'revised',
  'revamp', 'revamped',
  'overhaul', 'overhauled',
  'rework', 'reworked',
  'rebrand', 'rebranded',
  'relaunch', 'relaunched',
  'comeback',
  'return', 'returning', 'returns',
  'back', 'is back',
  'again',
  'still', 'still works', 'still working',
  'anymore', 'any more',
  'dead', 'dying', 'alive',
];

/**
 * EMOTIONAL SIGNALS
 * Strong opinions, venting, enthusiasm - indicates engagement
 */
const EMOTIONAL_POSITIVE: string[] = [
  // Superlatives
  'best', 'greatest', 'top', 'ultimate', 'perfect',
  'amazing', 'awesome', 'incredible', 'insane', 'unbelievable',
  'mind blowing', 'mindblowing', 'mind-blowing',
  'game changer', 'gamechanger', 'game-changer',
  'life changing', 'lifechanging', 'life-changing',
  'revolutionary', 'groundbreaking',
  
  // Enthusiasm
  'love', 'loving', 'loved', 'loves',
  'favorite', 'favourite', 'fav', 'favs',
  'obsessed', 'obsession',
  'addicted', 'addiction', 'addicting',
  'hooked',
  'brilliant', 'genius',
  'masterpiece',
  'legendary', 'legend',
  'iconic', 'icon',
  'elite',
  'goat', 'goated', 'the goat',
  'god tier', 'godtier', 's tier', 's-tier',
  
  // Slang positive
  'fire', 'lit', 'bussin', 'slaps', 'hits different',
  'peak', 'based', 'valid', 'w', 'dub',
  'clutch', 'cracked', 'goated', 'insane',
  'sick', 'dope', 'epic', 'killer',
  'underrated', 'slept on', 'hidden gem',
  'must have', 'must see', 'must watch', 'must try',
  'worth it', 'worth every',
  'changed my life',
  'blew my mind',
  'saved my',
];

const EMOTIONAL_NEGATIVE: string[] = [
  // Strong negative
  'worst', 'terrible', 'horrible', 'awful', 'trash', 'garbage',
  'sucks', 'sucked', 'suck', 'sucky',
  'hate', 'hated', 'hating', 'hates', 'hatred',
  'stupid', 'dumb', 'idiotic', 'ridiculous', 'absurd',
  'useless', 'pointless', 'worthless', 'waste',
  'scam', 'scammy', 'ripoff', 'rip off', 'rip-off',
  'overrated', 'overhyped', 'overpriced',
  'disappointing', 'disappointed', 'disappointment',
  'frustrating', 'frustrated', 'frustration',
  'annoying', 'annoyed',
  'boring', 'bored',
  
  // Broken/Dead
  'broken', 'broke', 'breaks',
  'dead', 'dying', 'died', 'rip',
  'killed', 'kill', 'killing',
  'ruined', 'ruin', 'ruins',
  'destroyed', 'destroy',
  'failed', 'fail', 'fails', 'failure',
  'crashed', 'crash', 'crashing',
  'bugged', 'bug', 'bugs', 'buggy',
  'glitched', 'glitch', 'glitches', 'glitchy',
  'laggy', 'lag', 'lagging',
  
  // Slang negative
  'mid', 'L', 'cringe', 'sus', 'cap', 'no cap',
  'clown', 'clowned',
  'ratio', 'ratioed',
  'flopped', 'flop',
  'fell off',
  'washed', 'washed up',
];

/**
 * ACTIONABLE SIGNALS
 * Tips, tricks, strategies - viewer wants to DO something
 */
const ACTIONABLE_SIGNALS: string[] = [
  // Tips & tricks
  'tips', 'tip',
  'tricks', 'trick',
  'hacks', 'hack', 'hacking', 'lifehack', 'life hack',
  'secrets', 'secret',
  'cheat', 'cheats', 'cheatsheet', 'cheat sheet',
  
  // Strategy
  'strategy', 'strategies', 'strategic',
  'tactics', 'tactic', 'tactical',
  'techniques', 'technique',
  'approach', 'approaches',
  'methods', 'method',
  
  // Ideas & ways
  'ideas', 'idea',
  'ways', 'way',
  'things', 'thing',
  'reasons', 'reason',
  'examples', 'example',
  'options', 'option',
  'alternatives', 'alternative', 'alt',
  'suggestions', 'suggestion', 'suggest',
  'recommendations', 'recommendation', 'recommend', 'recommended',
  
  // Advice
  'advice', 'advise',
  'guidance',
  'pointers',
  'insights', 'insight',
  'wisdom',
  'rules', 'rule',
  'laws', 'law',
  'principles', 'principle',
  'keys', 'key',
  'pillars', 'pillar',
  
  // Goals
  'achieve', 'achieving', 'achievement',
  'accomplish', 'accomplishing',
  'succeed', 'success', 'successful',
  'win', 'winning', 'wins',
  'grow', 'growing', 'growth',
  'improve', 'improving', 'improvement',
  'boost', 'boosting',
  'increase', 'increasing',
  'maximize', 'maximizing', 'max',
  'optimize', 'optimizing',
  'level up', 'levelup',
  'upgrade', 'upgrading',
  'transform', 'transforming', 'transformation',
  
  // Actions
  'make', 'making',
  'create', 'creating', 'creation',
  'build', 'building',
  'start', 'starting',
  'setup', 'set up', 'setting up',
  'install', 'installing', 'installation',
  'configure', 'configuring', 'configuration', 'config',
  'customize', 'customizing', 'customization',
  'use', 'using',
  'try', 'trying',
  'do', 'doing',
  'get', 'getting',
];

/**
 * COMPARISON SIGNALS
 * Viewer evaluating options
 */
const COMPARISON_SIGNALS: string[] = [
  'vs', 'versus', 'v',
  'or', 
  'compared', 'comparing', 'comparison', 'compare',
  'difference', 'differences', 'different',
  'better', 'better than',
  'worse', 'worse than',
  'faster', 'slower',
  'cheaper', 'more expensive', 'pricier',
  'easier', 'harder', 'simpler',
  'which is better',
  'which one',
  'which should',
  'alternatives', 'alternative',
  'instead', 'instead of',
  'over',
  'switch', 'switching', 'switched',
  'replace', 'replacing', 'replacement',
  'migrate', 'migrating', 'migration',
  'upgrade', 'upgrading',
  'downgrade', 'downgrading',
  'pros', 'cons', 'pros and cons',
  'advantages', 'disadvantages',
  'benefits', 'drawbacks',
  'strengths', 'weaknesses',
  'worth', 'worth it',
];

/**
 * PROBLEM/SOLUTION SIGNALS
 * Viewer has a problem and needs help
 */
const PROBLEM_SIGNALS: string[] = [
  // Problems
  'problem', 'problems', 'problematic',
  'issue', 'issues',
  'error', 'errors',
  'bug', 'bugs', 'buggy',
  'glitch', 'glitches', 'glitchy',
  'crash', 'crashes', 'crashing', 'crashed',
  'freeze', 'freezes', 'freezing', 'frozen',
  'stuck', 'getting stuck',
  'lag', 'lags', 'lagging', 'laggy',
  'slow', 'slower', 'slowness',
  
  // Not working
  'not working', 'doesnt work', "doesn't work", 'dont work', "don't work",
  'wont work', "won't work", 'will not work',
  'stopped working', 'stop working',
  'broken', 'broke',
  'failed', 'failing', 'fails',
  'cant', "can't", 'cannot',
  'unable', 'unable to',
  'impossible',
  
  // Solutions
  'fix', 'fixed', 'fixes', 'fixing',
  'solve', 'solved', 'solves', 'solving', 'solution', 'solutions',
  'resolve', 'resolved', 'resolves', 'resolving', 'resolution',
  'repair', 'repaired', 'repairing',
  'restore', 'restored', 'restoring',
  'recover', 'recovered', 'recovering', 'recovery',
  'troubleshoot', 'troubleshooting',
  'debug', 'debugging',
  'diagnose', 'diagnosing', 'diagnosis',
  
  // Help
  'help', 'helping', 'helps',
  'support',
  'assist', 'assistance',
  'guide', 'guidance',
  'rescue', 'save', 'saving',
  
  // Mistakes
  'mistake', 'mistakes',
  'wrong', 'wrongly',
  'bad', 'badly',
  'avoid', 'avoiding',
  'dont', "don't", 'do not',
  'never', 'never do',
  'stop', 'stop doing',
  'quit', 'quitting',
  'warning', 'warnings', 'warn',
  'careful', 'be careful',
  'watch out',
  'beware',
  'pitfall', 'pitfalls',
  'trap', 'traps',
  'gotcha', 'gotchas',
  'common mistakes',
  'biggest mistakes',
];

/**
 * SPECIFICITY/CONTEXT SIGNALS
 * Viewer looking for specific context or application
 */
const SPECIFICITY_SIGNALS: string[] = [
  // Platforms
  'for youtube', 'on youtube',
  'for instagram', 'on instagram', 'for ig',
  'for tiktok', 'on tiktok',
  'for twitter', 'on twitter', 'for x',
  'for facebook', 'on facebook', 'for fb',
  'for linkedin', 'on linkedin',
  'for pinterest', 'on pinterest',
  'for twitch', 'on twitch',
  'for discord', 'on discord',
  'for reddit', 'on reddit',
  'for spotify',
  'for podcast', 'for podcasting',
  
  // Devices
  'for iphone', 'on iphone',
  'for android', 'on android',
  'for mac', 'on mac', 'for macos',
  'for windows', 'on windows', 'for pc',
  'for linux', 'on linux',
  'for ipad', 'on ipad',
  'for tablet',
  'for mobile', 'on mobile',
  'for desktop', 'on desktop',
  'for laptop',
  'for tv', 'on tv',
  'for console', 'for ps5', 'for xbox', 'for switch',
  
  // Audiences
  'for beginners', 'for newbies',
  'for kids', 'for children',
  'for teens', 'for teenagers',
  'for adults',
  'for seniors', 'for elderly',
  'for students',
  'for teachers',
  'for parents',
  'for couples',
  'for women', 'for men',
  'for creators', 'for content creators',
  'for business', 'for businesses',
  'for entrepreneurs', 'for startups',
  'for freelancers',
  'for developers', 'for programmers', 'for devs',
  'for designers',
  'for artists',
  'for musicians',
  'for gamers',
  'for streamers',
  'for photographers',
  'for videographers',
  'for editors',
  'for marketers',
  'for small business',
  
  // Conditions
  'without', 'with no', 'no',
  'with', 'using', 'with only',
  'free', 'for free', 'freely',
  'cheap', 'cheaply', 'budget', 'affordable', 'low cost',
  'expensive', 'premium', 'pro', 'paid',
  'at home', 'from home',
  'online', 'offline',
  'remote', 'remotely',
  'solo', 'alone', 'by yourself',
  'together', 'with friends', 'with partner',
  'fast', 'quick', 'quickly', 'rapid', 'rapidly',
  'slow', 'slowly', 'gradual', 'gradually',
  'easy', 'easily', 'simple', 'simply',
  'hard', 'difficult', 'challenging',
  'safe', 'safely', 'secure', 'securely',
  'legal', 'legally', 'legit',
  'real', 'realistic', 'actually',
  'natural', 'naturally', 'organic', 'organically',
];

/**
 * TIME/DURATION SIGNALS
 * Content promising specific time investment
 */
const TIME_SIGNALS: string[] = [
  'in minutes', 'in seconds', 'in hours',
  'minute', 'minutes', 'min', 'mins',
  'second', 'seconds', 'sec', 'secs',
  'hour', 'hours', 'hr', 'hrs',
  'day', 'days',
  'week', 'weeks',
  'month', 'months',
  'year', 'years',
  'quick', 'quickly',
  'fast', 'faster', 'fastest',
  'instant', 'instantly',
  'rapid', 'rapidly',
  'speed', 'speedy',
  'short', 'shorter', 'shortest',
  'brief', 'briefly',
  'long', 'longer', 'longest',
  'extended',
  'overnight',
  'asap',
];

// =============================================================================
// REGEX PATTERNS (catch variations)
// =============================================================================

const REGEX_PATTERNS: { pattern: RegExp; category: keyof SignalBreakdown; weight: number }[] = [
  // Years (2020-2029)
  { pattern: /\b20[2-3]\d\b/, category: 'timely', weight: 1.0 },
  
  // Numbered lists: "5 tips", "10 ways", "7 things"
  { pattern: /\b\d+\s*(tips|tricks|ways|things|reasons|ideas|steps|methods|hacks|secrets|mistakes|examples)\b/i, category: 'actionable', weight: 1.2 },
  
  // Duration: "in 5 minutes", "10 min", "1 hour"
  { pattern: /\b\d+\s*(min|mins|minute|minutes|sec|secs|second|seconds|hr|hrs|hour|hours)\b/i, category: 'timely', weight: 0.8 },
  
  // Step numbers: "step 1", "part 2", "episode 3"
  { pattern: /\b(step|part|episode|chapter|phase|stage|level)\s*\d+\b/i, category: 'learning', weight: 0.7 },
  
  // Version numbers: "v2", "2.0", "version 3"
  { pattern: /\b(v\d+|version\s*\d+|\d+\.\d+)\b/i, category: 'timely', weight: 0.6 },
  
  // Questions ending with ?
  { pattern: /\?$/, category: 'question', weight: 0.5 },
];

// =============================================================================
// SCORING CONFIGURATION
// =============================================================================

const CATEGORY_WEIGHTS: Record<keyof SignalBreakdown, number> = {
  learning: 1.0,      // Core educational intent
  question: 1.0,      // Direct information seeking
  timely: 0.8,        // Current/updated interest
  emotional: 0.7,     // Engagement indicator
  actionable: 1.0,    // Want to do something
  comparison: 0.8,    // Evaluating options
  problem: 1.0,       // Need help
  specificity: 0.6,   // Context seeking
};

// Tier thresholds based on weighted signal score
const TIER_THRESHOLDS = {
  exceptional: 80,    // 80-100: Exceptional viewer interest
  strong: 55,         // 55-79: Strong viewer interest
  moderate: 30,       // 30-54: Moderate viewer interest
  light: 10,          // 10-29: Light viewer interest
  niche: 0,           // 0-9: Very niche
};

const TIER_INFO: Record<DemandTier, { label: string; description: string }> = {
  exceptional: {
    label: 'Exceptional Interest',
    description: 'Viewers are highly engaged with this topic. Multiple signals show strong learning and action intent.',
  },
  strong: {
    label: 'Strong Interest',
    description: 'Clear viewer intent. This topic resonates — people want to learn, solve, or explore.',
  },
  moderate: {
    label: 'Moderate Interest',
    description: 'Solid viewer interest. This topic has an audience ready for the right content.',
  },
  light: {
    label: 'Light Interest',
    description: 'Some viewer interest. Consider adding specificity or a unique angle.',
  },
  niche: {
    label: 'Very Niche',
    description: 'Limited signals. This could be an untapped opportunity or too specialized.',
  },
};

// =============================================================================
// HELPER: Build lookup set for fast matching
// =============================================================================

function buildSignalSet(words: string[]): Set<string> {
  const set = new Set<string>();
  for (const word of words) {
    set.add(word.toLowerCase());
  }
  return set;
}

// Pre-build sets for performance
const SIGNAL_SETS: Record<keyof SignalBreakdown, Set<string>> = {
  learning: buildSignalSet(LEARNING_SIGNALS),
  question: buildSignalSet(QUESTION_SIGNALS),
  timely: buildSignalSet(TIMELY_SIGNALS),
  emotional: buildSignalSet([...EMOTIONAL_POSITIVE, ...EMOTIONAL_NEGATIVE]),
  actionable: buildSignalSet(ACTIONABLE_SIGNALS),
  comparison: buildSignalSet(COMPARISON_SIGNALS),
  problem: buildSignalSet(PROBLEM_SIGNALS),
  specificity: buildSignalSet(SPECIFICITY_SIGNALS),
};

// Also build a combined set for time signals
const TIME_SIGNAL_SET = buildSignalSet(TIME_SIGNALS);

// =============================================================================
// CORE SCORING FUNCTIONS
// =============================================================================

/**
 * Count signals in a single suggestion
 */
function countSignalsInText(text: string): SignalBreakdown {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  const breakdown: SignalBreakdown = {
    learning: 0,
    question: 0,
    timely: 0,
    emotional: 0,
    actionable: 0,
    comparison: 0,
    problem: 0,
    specificity: 0,
  };
  
  // Check each category's word set
  for (const category of Object.keys(SIGNAL_SETS) as (keyof SignalBreakdown)[]) {
    const signalSet = SIGNAL_SETS[category];
    
    // Check single words
    for (const word of words) {
      if (signalSet.has(word)) {
        breakdown[category]++;
      }
    }
    
    // Check multi-word phrases (bigrams and trigrams)
    for (let i = 0; i < words.length - 1; i++) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      if (signalSet.has(bigram)) {
        breakdown[category]++;
      }
      
      if (i < words.length - 2) {
        const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (signalSet.has(trigram)) {
          breakdown[category]++;
        }
      }
    }
  }
  
  // Check regex patterns
  for (const { pattern, category, weight } of REGEX_PATTERNS) {
    if (pattern.test(lowerText)) {
      breakdown[category] += weight;
    }
  }
  
  return breakdown;
}

/**
 * Merge two breakdowns
 */
function mergeBreakdowns(a: SignalBreakdown, b: SignalBreakdown): SignalBreakdown {
  return {
    learning: a.learning + b.learning,
    question: a.question + b.question,
    timely: a.timely + b.timely,
    emotional: a.emotional + b.emotional,
    actionable: a.actionable + b.actionable,
    comparison: a.comparison + b.comparison,
    problem: a.problem + b.problem,
    specificity: a.specificity + b.specificity,
  };
}

/**
 * Calculate weighted total from breakdown
 */
function calculateWeightedTotal(breakdown: SignalBreakdown): number {
  let total = 0;
  for (const category of Object.keys(breakdown) as (keyof SignalBreakdown)[]) {
    total += breakdown[category] * CATEGORY_WEIGHTS[category];
  }
  return total;
}

/**
 * Filler words to ignore when calculating semantic focus
 */
const FILLER_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall',
  'how', 'what', 'when', 'where', 'why', 'which', 'who', 'whom',
  'this', 'that', 'these', 'those', 'it', 'its', 'you', 'your', 'i', 'my',
  'we', 'our', 'they', 'their', 'he', 'she', 'his', 'her',
]);

/**
 * Extract core concept words from a phrase (removing fillers)
 */
function extractCoreWords(phrase: string): Set<string> {
  return new Set(
    phrase.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !FILLER_WORDS.has(w))
  );
}

/**
 * Calculate semantic focus: how related are the suggestions to each other?
 * High focus = all suggestions are variations of the same concept
 * Low focus = suggestions scatter to unrelated topics
 * 
 * We check if core concept words from the seed appear across suggestions.
 * A suggestion is "focused" if it contains at least 50% of the core seed words.
 */
function calculateSemanticFocus(seed: string, suggestions: string[]): number {
  if (suggestions.length === 0) return 0;
  
  const coreWords = extractCoreWords(seed);
  if (coreWords.size === 0) return 100; // No core words = everything matches
  
  const minMatchRatio = 0.5; // Suggestion needs 50%+ of core words
  let focusedCount = 0;
  
  for (const suggestion of suggestions) {
    const suggestionLower = suggestion.toLowerCase();
    let matchCount = 0;
    
    for (const word of coreWords) {
      if (suggestionLower.includes(word)) {
        matchCount++;
      }
    }
    
    const matchRatio = matchCount / coreWords.size;
    if (matchRatio >= minMatchRatio) {
      focusedCount++;
    }
  }
  
  // Calculate focus percentage
  const focusRatio = focusedCount / suggestions.length;
  
  // Scale to 0-100
  return Math.round(focusRatio * 100);
}

/**
 * Determine tier from score
 */
function getTierFromScore(score: number): DemandTier {
  if (score >= TIER_THRESHOLDS.exceptional) return 'exceptional';
  if (score >= TIER_THRESHOLDS.strong) return 'strong';
  if (score >= TIER_THRESHOLDS.moderate) return 'moderate';
  if (score >= TIER_THRESHOLDS.light) return 'light';
  return 'niche';
}

// =============================================================================
// MAIN SCORING FUNCTION
// =============================================================================

/**
 * Calculate the Viewer Demand Score for a seed phrase
 * 
 * @param seed - The seed phrase being evaluated
 * @param suggestions - Autocomplete suggestions from YouTube
 * @returns DemandScore with 0-100 score and breakdown
 */
export function calculateViewerDemand(
  seed: string,
  suggestions: string[]
): DemandScore {
  // Count signals in seed itself (some seeds are already questions/learning)
  const seedBreakdown = countSignalsInText(seed);
  
  // Count signals across all suggestions
  let totalBreakdown = seedBreakdown;
  for (const suggestion of suggestions) {
    const suggestionBreakdown = countSignalsInText(suggestion);
    totalBreakdown = mergeBreakdowns(totalBreakdown, suggestionBreakdown);
  }
  
  // Calculate weighted signal total
  const weightedTotal = calculateWeightedTotal(totalBreakdown);
  
  // Calculate semantic focus
  const semanticFocus = calculateSemanticFocus(seed, suggestions);
  
  // Calculate signal density (signals per suggestion)
  const signalDensity = suggestions.length > 0 
    ? weightedTotal / suggestions.length 
    : 0;
  
  // Calculate raw score components
  // - Base from weighted signals (0-60 points)
  // - Bonus from suggestion count (0-20 points, 10 suggestions = max)
  // - Bonus from semantic focus (0-20 points)
  
  const signalScore = Math.min(60, weightedTotal * 3);
  const countBonus = Math.min(20, suggestions.length * 2);
  const focusBonus = semanticFocus * 0.2;
  
  const rawScore = signalScore + countBonus + focusBonus;
  const finalScore = Math.min(100, Math.round(rawScore));
  
  // Determine tier
  const tier = getTierFromScore(finalScore);
  const { label, description } = TIER_INFO[tier];
  
  return {
    score: finalScore,
    tier,
    label,
    description,
    suggestionCount: suggestions.length,
    totalSignals: Math.round(weightedTotal * 10) / 10,
    signalDensity: Math.round(signalDensity * 10) / 10,
    semanticFocus,
    signalBreakdown: totalBreakdown,
    suggestions,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get color for demand tier (matches brand guidelines)
 */
export function getDemandColor(tier: DemandTier): string {
  switch (tier) {
    case 'exceptional':
      return 'text-[#4DD68A]'; // Bright green
    case 'strong':
      return 'text-[#2BD899]'; // Primary green
    case 'moderate':
      return 'text-[#6B9BD1]'; // Electric blue
    case 'light':
      return 'text-[#F59E0B]'; // Trending orange
    case 'niche':
      return 'text-[#A6B0C2]'; // Text secondary
  }
}

export function getDemandBgColor(tier: DemandTier): string {
  switch (tier) {
    case 'exceptional':
      return 'bg-[#4DD68A]/10 border-[#4DD68A]/30';
    case 'strong':
      return 'bg-[#2BD899]/10 border-[#2BD899]/30';
    case 'moderate':
      return 'bg-[#6B9BD1]/10 border-[#6B9BD1]/30';
    case 'light':
      return 'bg-[#F59E0B]/10 border-[#F59E0B]/30';
    case 'niche':
      return 'bg-[#A6B0C2]/10 border-[#A6B0C2]/30';
  }
}

/**
 * Get a short message for the Long-Term Views potential
 */
export function getLongTermViewsMessage(tier: DemandTier, semanticFocus: number): string | null {
  // Only show for strong/exceptional with high focus
  if ((tier === 'exceptional' || tier === 'strong') && semanticFocus >= 70) {
    return 'Long-Term Views — views day after day, month after month';
  }
  return null;
}

/**
 * Format the demand score for display
 */
export function formatDemandScore(score: DemandScore): {
  scoreDisplay: string;
  tierLabel: string;
  insights: string[];
} {
  const insights: string[] = [];
  
  // Add primary insight based on tier
  switch (score.tier) {
    case 'exceptional':
      insights.push('Viewers are highly engaged with this topic');
      break;
    case 'strong':
      insights.push('Clear viewer intent — this topic resonates');
      break;
    case 'moderate':
      insights.push('Solid viewer interest in this topic');
      break;
    case 'light':
      insights.push('Some viewer interest — consider adding specificity');
      break;
    case 'niche':
      insights.push('Very niche — could be untapped or too specialized');
      break;
  }
  
  // Add Long-Term Views insight if applicable
  const ltvMessage = getLongTermViewsMessage(score.tier, score.semanticFocus);
  if (ltvMessage) {
    insights.push(ltvMessage);
  }
  
  // Add semantic focus insight
  if (score.semanticFocus >= 80) {
    insights.push('Focused interest — viewers know exactly what they want');
  } else if (score.semanticFocus < 40 && score.suggestionCount >= 5) {
    insights.push('Scattered interest — consider narrowing your angle');
  }
  
  return {
    scoreDisplay: `${score.score}`,
    tierLabel: score.label,
    insights,
  };
}

// =============================================================================
// SIGNAL STATS (for debugging/transparency)
// =============================================================================

export function getSignalStats(): {
  totalSignalWords: number;
  byCategory: Record<string, number>;
} {
  const byCategory: Record<string, number> = {
    learning: LEARNING_SIGNALS.length,
    question: QUESTION_SIGNALS.length,
    timely: TIMELY_SIGNALS.length,
    emotional: EMOTIONAL_POSITIVE.length + EMOTIONAL_NEGATIVE.length,
    actionable: ACTIONABLE_SIGNALS.length,
    comparison: COMPARISON_SIGNALS.length,
    problem: PROBLEM_SIGNALS.length,
    specificity: SPECIFICITY_SIGNALS.length,
    time: TIME_SIGNALS.length,
  };
  
  const totalSignalWords = Object.values(byCategory).reduce((a, b) => a + b, 0);
  
  return { totalSignalWords, byCategory };
}
