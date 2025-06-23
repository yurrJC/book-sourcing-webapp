# Google Books API Setup

This document explains how to set up the Google Books API key for the fallback system in the Book Sourcing Web App.

## Overview

The Google Books API is used as a fallback when the primary ISBNdb API fails or returns no data. This ensures reliable book information retrieval even when one API service is down or has rate limiting issues.

**Important**: The Google Books API works **without an API key** for basic usage! The API key is only needed if you want higher rate limits.

## Getting a Google Books API Key (Optional)

### When You Need an API Key

You only need a Google Books API key if you expect to make more than 1 request per second or want higher rate limits. For most users, the free tier without an API key is sufficient.

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for your project (required for API usage)

### Step 2: Enable the Google Books API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Books API"
3. Click on "Google Books API" and then click "Enable"

### Step 3: Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### Step 4: Configure API Key Restrictions (Recommended)

1. Click on the API key you just created
2. Under "Application restrictions", select "HTTP referrers" or "IP addresses" for security
3. Under "API restrictions", select "Restrict key" and choose "Google Books API"
4. Click "Save"

## Environment Variable Setup

### Development

The Google Books API key is **completely optional**. You can add it to your `.env` file in the server directory if you want higher rate limits:

```env
GOOGLE_BOOKS_API_KEY=your_google_books_api_key_here  # Optional - for higher rate limits
```

### Production (Render)

The Google Books API key is **completely optional** for production as well. If you want higher rate limits:

1. Go to your Render dashboard
2. Select your backend service (book-sourcing-api)
3. Go to "Environment" tab
4. Add a new environment variable:
   - Key: `GOOGLE_BOOKS_API_KEY`
   - Value: Your Google Books API key

## API Usage and Limits

### Free Tier Limits (No API Key Required)
- **Requests per day**: 1,000 requests per day
- **Rate limit**: 1 request per second
- **Cost**: Completely free

### With API Key (Optional)
- **Requests per day**: 1,000 requests per day (same limit)
- **Rate limit**: 1,000 requests per 100 seconds per user (much higher)
- **Cost**: Free for the first 1,000 requests per day, then $5 per 1,000 additional requests

## Fallback Behavior

The system works as follows:

1. **Primary**: Tries ISBNdb API first
2. **Fallback**: If ISBNdb fails or returns no data, automatically tries Google Books API
3. **Source Tracking**: The response includes a `source` field indicating which API provided the data:
   - `"isbndb"` - Data from ISBNdb API
   - `"googlebooks"` - Data from Google Books API (fallback)

**The fallback system works immediately without any API key setup!**

## Testing the Fallback

You can test the fallback system by:

1. Temporarily removing or invalidating your ISBNdb API key
2. Searching for a book ISBN
3. The system should automatically fall back to Google Books API (works without any API key)
4. Check the "Source" field in the book details to confirm it shows "Google Books (fallback)"

## Troubleshooting

### Common Issues

1. **API Key Not Working**: The Google Books API works without an API key, so this shouldn't be an issue
2. **Rate Limiting**: If you hit rate limits, consider adding a Google Books API key for higher limits
3. **Billing Issues**: Billing is only required if you exceed the free tier limits

### Error Messages

- `"Google Books API Error"`: Usually means the ISBN doesn't exist in Google Books database
- `"No books found"`: The ISBN might not exist in Google Books database

## Security Notes

- The Google Books API key is completely optional
- Never commit your API key to version control (if you choose to use one)
- Use environment variables to store API keys (if you choose to use one)
- Monitor your API usage to avoid unexpected charges (only if you exceed free tier) 