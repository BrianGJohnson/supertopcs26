/**
 * Debug Logger - Writes to a file that can be read to diagnose issues
 * Usage: import { debugLog } from '@/lib/debug-logger';
 *        debugLog('MyComponent', 'Something happened', { data: 123 });
 */

import { appendFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOG_FILE = join(process.cwd(), 'debug.log');

// Clear log on first import (server start)
let initialized = false;

export function debugLog(source: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const dataStr = data ? `\n  DATA: ${JSON.stringify(data, null, 2).replace(/\n/g, '\n  ')}` : '';
    const logLine = `[${timestamp}] [${source}] ${message}${dataStr}\n`;

    try {
        if (!initialized) {
            writeFileSync(LOG_FILE, `=== Debug Log Started: ${timestamp} ===\n\n`);
            initialized = true;
        }
        appendFileSync(LOG_FILE, logLine);
    } catch (e) {
        // Fallback to console if file write fails
        console.log(logLine);
    }
}

export function debugError(source: string, message: string, error?: any): void {
    const errorDetails = error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error;
    debugLog(source, `❌ ERROR: ${message}`, errorDetails);
}
