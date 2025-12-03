/**
 * YouTube Autocomplete Actor
 * 
 * A private Apify actor that fetches real YouTube autocomplete suggestions.
 * Uses Apify's proxy rotation to avoid IP blocking at scale.
 * 
 * Input:
 *   { "queries": ["ai content creation", "how to edit video"] }
 * 
 * Output:
 *   [
 *     { "query": "ai content creation", "suggestions": ["ai content creation tools", ...] },
 *     { "query": "how to edit video", "suggestions": ["how to edit video on iphone", ...] }
 *   ]
 */

import { Actor } from 'apify';
import { gotScraping } from 'got-scraping';

await Actor.init();

// Get input
const input = await Actor.getInput();
const { queries = [], language = 'en', country = 'US' } = input ?? {};

if (!queries.length) {
    console.log('No queries provided. Please provide queries in input.');
    await Actor.exit();
}

console.log(`Processing ${queries.length} queries...`);

// Get proxy configuration
const proxyConfiguration = await Actor.createProxyConfiguration({
    groups: ['RESIDENTIAL'],  // Use residential proxies for best success
});

// If no residential, fall back to datacenter
const proxyUrl = proxyConfiguration 
    ? await proxyConfiguration.newUrl()
    : undefined;

const results = [];

for (const query of queries) {
    try {
        const encodedQuery = encodeURIComponent(query);
        const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodedQuery}&hl=${language}&gl=${country}`;
        
        console.log(`Fetching: ${query}`);
        
        const response = await gotScraping({
            url,
            proxyUrl,
            responseType: 'text',
            timeout: { request: 10000 },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
            },
        });
        
        // Parse JSONP response: window.google.ac.h(["query",[["suggestion1"],["suggestion2"],...]])
        const text = response.body;
        const jsonMatch = text.match(/\[.*\]/s);
        
        if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            const suggestions = data[1]?.map(item => item[0]) ?? [];
            
            results.push({
                query,
                suggestions,
                count: suggestions.length,
            });
            
            console.log(`  → ${suggestions.length} suggestions found`);
        } else {
            console.log(`  → No suggestions found for: ${query}`);
            results.push({
                query,
                suggestions: [],
                count: 0,
                error: 'Failed to parse response',
            });
        }
        
        // Small delay between requests to be respectful
        await new Promise(resolve => setTimeout(resolve, 100));
        
    } catch (error) {
        console.error(`Error fetching "${query}":`, error.message);
        results.push({
            query,
            suggestions: [],
            count: 0,
            error: error.message,
        });
    }
}

// Push results to dataset
await Actor.pushData(results);

console.log(`\nCompleted! Processed ${results.length} queries.`);
console.log(`Total suggestions: ${results.reduce((sum, r) => sum + r.count, 0)}`);

await Actor.exit();
