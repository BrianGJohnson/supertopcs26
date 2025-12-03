# YouTube Autocomplete - Private Apify Actor

A private Apify actor that fetches **real** YouTube autocomplete suggestions using Apify's proxy infrastructure.

## Why Build Your Own?

| Issue | Solution |
|-------|----------|
| Direct YouTube blocks IPs at scale | Apify's residential proxies rotate automatically |
| Public actors can return fake data | Your code = your control over data quality |
| Dependency on random developers | You own it, can't be turned off |
| Privacy concerns | Private actor, only you can access |

## Features

- ✅ **Real YouTube data** - Direct from Google's suggest API
- ✅ **Proxy rotation** - Uses Apify residential proxies
- ✅ **Batch processing** - Send multiple queries in one call
- ✅ **Private** - Only accessible by your account
- ✅ **Fast** - ~100ms delay between queries

## Input Schema

```json
{
    "queries": ["ai content creation", "how to edit video"],
    "language": "en",
    "country": "US"
}
```

## Output Format

```json
[
    {
        "query": "ai content creation",
        "suggestions": [
            "ai content creation tools",
            "ai content creation for youtube",
            "ai content creation course",
            ...
        ],
        "count": 10
    }
]
```

## Usage from Supertopics

After deployment, update your `APIFY_ACTOR_ID` in `.env.local`:

```bash
APIFY_ACTOR_ID=YOUR_USERNAME/youtube-autocomplete
```

## Deployment Steps

See `DEPLOYMENT.md` for step-by-step instructions.

## Cost Estimate

- **Compute**: ~$0.0001 per query (minimal)
- **Proxies**: ~$0.001-0.002 per query (main cost)
- **Total**: ~$0.002 per query = **$0.08 per full expansion** (40 queries)

Cheaper than public actors that charge markup!
