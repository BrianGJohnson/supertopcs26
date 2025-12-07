---
description: Run a morning code audit to analyze recent changes
---
# Morning Code Audit Workflow

## Instructions
Act as a Senior Staff Engineer and Lead Architect.
Mode: READ-ONLY. Do NOT edit, delete, or modify any files.

## Step 1: Find Hot Files

// turbo
Run this command to find files modified in the last 72 hours:
```bash
find ./src -type f \( -name "*.tsx" -o -name "*.ts" \) -mtime -3 2>/dev/null | head -30
```

// turbo
Run this command to find context files from the last 7 days:
```bash
find ./src -type f \( -name "*.tsx" -o -name "*.ts" \) -mtime -7 2>/dev/null | head -50
```

## Step 2: Audit the Files

Read the content of files identified in Step 1. Focus on "Hot" files (72h), using "Context" files (7d) to understand how new code fits.

Analyze for:
1. **Vibe & Readability:** Is the code clean, idiomatic, and maintainable?
2. **Structural Integrity:** Does new code respect existing architecture?
3. **Safety & Risks:** Memory leaks, unhandled edge cases, security vulnerabilities?
4. **Integration Check:** How does it interact with the rest of the site?

## Step 3: Generate Report

Create/update the file `code_review.md` in the brain artifacts directory with:

1. **The Scorecard**
   - Vibe Rating (1-10)
   - Structure Rating (1-10)
   - Safety Rating (1-10)

2. **The "Hot List" (Last 72h)**
   - List key files with one-sentence summaries

3. **Critical Issues (If any)**
   - Bugs, security flaws, or code smells needing attention

4. **Architectural Review**
   - How recent work fits into wider 7-day context
   - Technical debt assessment

5. **Suggestion Box**
   - One high-leverage suggestion for the coding session
