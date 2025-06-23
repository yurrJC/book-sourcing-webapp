import axios from 'axios';

const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY; // Optional API key for higher rate limits
const BASE_URL = 'https://www.googleapis.com/books/v1';

/**
 * Represents the expected structure of the book data from Google Books API.
 */
export interface GoogleBooksBook {
    book: {
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
    }
}

/**
 * Fetches book details from the Google Books API.
 * @param isbn The ISBN (10 or 13) of the book to fetch.
 * @returns A Promise resolving to the book data or null if not found/error.
 */
export const getBookDetailsFromGoogleBooks = async (isbn: string): Promise<GoogleBooksBook | null> => {
    const url = `${BASE_URL}/volumes`;
    const params: any = {
        q: `isbn:${isbn}`,
        key: GOOGLE_BOOKS_API_KEY || undefined // Only include if API key is set
    };

    try {
        console.log(`(Google Books Client) Fetching book details for ${isbn} from ${url}`);
        const response = await axios.get(url, { params });
        
        if (response.status === 200 && response.data && response.data.items && response.data.items.length > 0) {
            const bookData = response.data.items[0];
            const volumeInfo = bookData.volumeInfo;
            const saleInfo = bookData.saleInfo;
            
            // Transform Google Books data to match our expected format
            const transformedBook: GoogleBooksBook = {
                book: {
                    title: volumeInfo.title || 'Unknown Title',
                    authors: volumeInfo.authors || [],
                    publisher: volumeInfo.publisher || undefined,
                    image: volumeInfo.imageLinks?.thumbnail || undefined,
                    isbn13: isbn, // Use the searched ISBN
                    isbn: isbn,
                    binding: volumeInfo.printType || undefined,
                    pages: volumeInfo.pageCount || undefined,
                    date_published: volumeInfo.publishedDate || undefined,
                    msrp: saleInfo?.listPrice?.amount || undefined,
                    dimensions: undefined // Google Books doesn't provide dimensions
                }
            };
            
            console.log(`(Google Books Client) Successfully fetched data for ${isbn}`);
            return transformedBook;
        } else {
            console.warn(`(Google Books Client) No books found for ISBN ${isbn}`);
            return null;
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            if (error.response) {
                console.error(`(Google Books Client) API Error for ${isbn}: ${error.response.status}`, error.response.data);
            } else {
                console.error(`(Google Books Client) Network or request error for ${isbn}:`, error.message);
            }
        } else {
            console.error(`(Google Books Client) Unexpected error fetching ${isbn}:`, error);
        }
        return null;
    }
}; 