import { getBookDetailsFromIsbnDb, IsbnDbBook } from './isbnDbClient';
import { getBookDetailsFromGoogleBooks, GoogleBooksBook } from './googleBooksClient';

/**
 * Unified book details interface that works with both APIs
 */
export interface BookDetails {
    title: string;
    authors?: string[];
    publisher?: string;
    image?: string;
    isbn13?: string;
    isbn?: string;
    binding?: string;
    pages?: number;
    date_published?: string;
    msrp?: number;
    dimensions?: string;
    source?: 'isbndb' | 'googlebooks'; // Track which API provided the data
}

/**
 * Fetches book details with fallback logic.
 * First tries ISBNdb API, then falls back to Google Books API if ISBNdb fails.
 * @param isbn The ISBN (10 or 13) of the book to fetch.
 * @returns A Promise resolving to the book data or null if both APIs fail.
 */
export const getBookDetails = async (isbn: string): Promise<BookDetails | null> => {
    console.log(`(Book Service) Starting book lookup for ISBN: ${isbn}`);
    
    // First, try ISBNdb API
    try {
        console.log(`(Book Service) Attempting ISBNdb lookup for ${isbn}`);
        const isbnDbResult = await getBookDetailsFromIsbnDb(isbn);
        
        if (isbnDbResult && isbnDbResult.book) {
            console.log(`(Book Service) ISBNdb lookup successful for ${isbn}`);
            return {
                ...isbnDbResult.book,
                source: 'isbndb' as const
            };
        }
    } catch (error) {
        console.error(`(Book Service) ISBNdb lookup failed for ${isbn}:`, error);
    }
    
    // If ISBNdb fails or returns no data, try Google Books API
    try {
        console.log(`(Book Service) Attempting Google Books lookup for ${isbn} (fallback)`);
        const googleBooksResult = await getBookDetailsFromGoogleBooks(isbn);
        
        if (googleBooksResult && googleBooksResult.book) {
            console.log(`(Book Service) Google Books lookup successful for ${isbn} (fallback)`);
            return {
                ...googleBooksResult.book,
                source: 'googlebooks' as const
            };
        }
    } catch (error) {
        console.error(`(Book Service) Google Books lookup failed for ${isbn}:`, error);
    }
    
    // Both APIs failed
    console.error(`(Book Service) Both ISBNdb and Google Books lookups failed for ${isbn}`);
    return null;
}; 