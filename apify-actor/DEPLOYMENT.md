# Deploying Your Private YouTube Autocomplete Actor

## Prerequisites

1. Apify account (you already have one)
2. Apify CLI installed

## Step 1: Install Apify CLI

```bash
npm install -g apify-cli
```

## Step 2: Login to Apify

```bash
apify login
```

This opens a browser to authenticate. Your token is saved locally.

## Step 3: Navigate to Actor Directory

```bash
cd /Users/brianjohnson/1MyApps/supertopcs/apify-actor
```

## Step 4: Initialize & Push

```bash
# Install dependencies locally (for testing)
npm install

# Push to Apify (creates the actor if it doesn't exist)
apify push
```

This will:
- Create the actor on your Apify account
- Build the Docker image
- Make it available at `YOUR_USERNAME/youtube-autocomplete`

## Step 5: Verify Deployment

1. Go to https://console.apify.com/actors
2. You should see "youtube-autocomplete" in your actors list
3. It should show as **Private** (lock icon)

## Step 6: Test the Actor

### Via Apify Console:
1. Click on your actor
2. Click "Start" 
3. Enter test input:
   ```json
   {
       "queries": ["ai content creation"]
   }
   ```
4. Check the output dataset for results

### Via API:
```bash
export APIFY_API_TOKEN="your_token"
export APIFY_ACTOR_ID="YOUR_USERNAME/youtube-autocomplete"

curl "https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"queries": ["ai content creation"]}'
```

## Step 7: Update Supertopics

Add to your `.env.local`:

```bash
APIFY_ACTOR_ID=YOUR_USERNAME/youtube-autocomplete
```

Then update `apify-autocomplete.ts` to use this actor ID.

## Keeping It Private

By default, actors are **private**. To verify:

1. Go to https://console.apify.com/actors
2. Click on your actor
3. Click "Settings" tab
4. Under "Visibility", confirm it says **Private**

## Updating the Actor

When you make changes to the code:

```bash
cd /Users/brianjohnson/1MyApps/supertopcs/apify-actor
apify push
```

This rebuilds and redeploys automatically.

## Troubleshooting

### "Actor not found" error
- Make sure you're using the correct actor ID format: `username/actor-name`
- Check that the actor was pushed successfully

### Proxy errors
- Residential proxies require Apify subscription
- Fallback to datacenter proxies is automatic
- Check your Apify billing/subscription

### Empty results
- Check the actor logs in Apify Console
- Verify YouTube isn't blocking (try different query)

## Cost Monitoring

Monitor costs at: https://console.apify.com/billing

Expected: ~$0.002 per query (mostly proxy costs)
