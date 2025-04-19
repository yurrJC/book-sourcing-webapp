import axios from 'axios';

const ISBNDB_API_KEY = process.env.ISBNDB_API_KEY;
const BASE_URL = 'https://api2.isbndb.com'; // Standard base URL

/**
 * Represents the expected structure of the book data from ISBNdb API.
 * Note: This might need adjustment based on actual API responses.
 */
export interface IsbnDbBook {
    book: {
        title: string;
        authors?: string[]; // API might return an array
        publisher?: string;
        image?: string; // URL to the cover image
        isbn13?: string;
        isbn?: string;
        binding?: string;
        pages?: number;
        date_published?: string;
        msrp?: number;
        // Add other fields you might need, e.g., dimensions, weight
        dimensions?: string; 
    }
}

/**
 * Fetches book details from the ISBNdb API.
 * @param isbn The ISBN (10 or 13) of the book to fetch.
 * @returns A Promise resolving to the book data or null if not found/error.
 */
export const getBookDetailsFromIsbnDb = async (isbn: string): Promise<IsbnDbBook | null> => {
    if (!ISBNDB_API_KEY) {
        console.error("ISBNdb API Key (ISBNDB_API_KEY) is not set in environment variables.");
        return null;
    }

    const url = `${BASE_URL}/book/${isbn}`;
    const headers = {
        "Content-Type": 'application/json',
        "Authorization": ISBNDB_API_KEY
    };

    try {
        console.log(`(ISBNdb Client) Fetching book details for ${isbn} from ${url}`);
        const response = await axios.get<IsbnDbBook>(url, { headers });
        
        if (response.status === 200 && response.data && response.data.book) {
             console.log(`(ISBNdb Client) Successfully fetched data for ${isbn}`);
             return response.data; // Assuming the structure matches IsbnDbBook
        } else {
            console.warn(`(ISBNdb Client) Received non-200 status or unexpected data for ${isbn}:`, response.status, response.data);
            return null; // Or handle specific errors
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            // Handle specific Axios errors (like 404 Not Found)
            if (error.response) {
                console.error(`(ISBNdb Client) API Error for ${isbn}: ${error.response.status}`, error.response.data);
            } else {
                console.error(`(ISBNdb Client) Network or request error for ${isbn}:`, error.message);
            }
        } else {
            console.error(`(ISBNdb Client) Unexpected error fetching ${isbn}:`, error);
        }
        return null;
    }
}; 