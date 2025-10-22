import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from the root directory
dotenv.config({ path: path.join(__dirname, '../../.env') });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/responses';

/**
 * AI-powered title parsing service using GPT-5 nano
 * Extracts the main title from book titles for better eBay searching
 */
export async function parseTitleWithAI(fullTitle: string): Promise<string> {
  console.log('(AI Title Parser) API Key check:', OPENAI_API_KEY ? 'Found' : 'Not found');
  console.log('(AI Title Parser) API Key length:', OPENAI_API_KEY ? OPENAI_API_KEY.length : 0);
  
  if (!OPENAI_API_KEY) {
    console.warn('OpenAI API key not found, falling back to simple parsing');
    return fallbackTitleParsing(fullTitle);
  }

  if (!fullTitle || fullTitle.trim().length === 0) {
    return '';
  }

  try {
    const prompt = `Extract the main title from this book title for eBay searching. Return only the core title without subtitles, descriptions, or additional text.

Examples:
- "Jackson's Track Memoir of a Dreamtime Place" → "Jackson's Track"
- "The Great Gatsby: A Novel" → "The Great Gatsby" 
- "Harry Potter and the Philosopher's Stone" → "Harry Potter and the Philosopher's Stone"
- "To Kill a Mockingbird - A Classic Novel" → "To Kill a Mockingbird"
- "1984: A Dystopian Novel" → "1984"

Book title: "${fullTitle}"

Main title:`;

    const response = await axios.post(OPENAI_API_URL, {
      model: 'gpt-4o-mini', // Use GPT-4o mini (confirmed working, still very cheap)
      input: prompt,
      max_output_tokens: 50,
      temperature: 0.1, // Low temperature for consistent results
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    // Parse the new Responses API format
    const output = response.data.output;
    const message = output?.find((item: any) => item.type === 'message');
    const content = message?.content?.find((item: any) => item.type === 'output_text');
    const parsedTitle = content?.text?.trim();
    
    console.log('(AI Title Parser) Full response:', JSON.stringify(response.data, null, 2));
    
    if (parsedTitle && parsedTitle.length > 0) {
      console.log(`(AI Title Parser) "${fullTitle}" → "${parsedTitle}"`);
      return parsedTitle;
    } else {
      console.warn('(AI Title Parser) Empty response from OpenAI, using fallback');
      console.log('(AI Title Parser) Output data:', JSON.stringify(output, null, 2));
      return fallbackTitleParsing(fullTitle);
    }

  } catch (error) {
    console.error('(AI Title Parser) Error calling OpenAI API:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('(AI Title Parser) API Error Details:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }
    console.log('(AI Title Parser) Falling back to simple parsing');
    return fallbackTitleParsing(fullTitle);
  }
}

/**
 * Simple fallback title parsing when AI is unavailable
 */
function fallbackTitleParsing(title: string): string {
  if (!title) return '';
  
  // Simple colon splitting as fallback
  if (title.includes(':')) {
    return title.split(':')[0].trim();
  }
  
  // Return full title if no colon found
  return title.trim();
}
