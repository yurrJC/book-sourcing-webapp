import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

/**
 * AI-powered title parsing service using GPT-5 nano
 * Extracts the main title from book titles for better eBay searching
 */
export async function parseTitleWithAI(fullTitle: string): Promise<string> {
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
      model: 'gpt-5-nano', // Use GPT-5 nano (available and cheapest)
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 50,
      temperature: 0.1, // Low temperature for consistent results
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000, // 10 second timeout
    });

    const parsedTitle = response.data.choices[0]?.message?.content?.trim();
    
    if (parsedTitle && parsedTitle.length > 0) {
      console.log(`(AI Title Parser) "${fullTitle}" → "${parsedTitle}"`);
      return parsedTitle;
    } else {
      console.warn('(AI Title Parser) Empty response from OpenAI, using fallback');
      return fallbackTitleParsing(fullTitle);
    }

  } catch (error) {
    console.error('(AI Title Parser) Error calling OpenAI API:', error);
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
