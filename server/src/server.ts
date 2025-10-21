// server/src/server.ts
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express, { Request, Response } from 'express';
import cors from 'cors';
import { calculateSourcingVerdict, MOCK_SCENARIOS } from './sourcing-engine'; // Import backend engine
import { SourcingResult } from './types'; // Import backend types
import { getBookDetails } from './bookService'; // Import the unified book service
import { findLowestPrice } from './ebayService'; // Import eBay service
import ebayRoutes from './routes/ebay'; // Import eBay routes
import { parseTitleWithAI } from './aiTitleParser'; // Import AI title parser

const app = express();
const port = process.env.PORT || 3001; // Use port 3001 for the backend

// Configure CORS
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://book-sourcing-frontend.onrender.com', 'https://book-sourcing-api.onrender.com']
    : 'http://localhost:5173', // Vite's default dev server
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json()); // Parse JSON request bodies

// Register routes
app.use('/api', ebayRoutes);

// AI Title Parsing endpoint
app.post('/api/parse-title', async (req: Request, res: Response): Promise<void> => {
  const { title } = req.body;
  
  if (!title || typeof title !== 'string') {
    res.status(400).json({ error: 'Title is required and must be a string' });
    return;
  }
  
  try {
    const parsedTitle = await parseTitleWithAI(title);
    res.json({ 
      originalTitle: title,
      parsedTitle: parsedTitle 
    });
  } catch (error) {
    console.error('(Server) Error parsing title with AI:', error);
    res.status(500).json({ error: 'Failed to parse title' });
  }
});

// --- API Endpoints ---

// Updated search endpoint using backend sourcing engine AND unified book lookup with fallback
app.get('/api/search', async (req: Request, res: Response): Promise<void> => {
  const isbn = req.query.isbn as string;
  // Use fallback scenario as default since we're now using real eBay data
  const scenarioKey = (req.query.scenario as keyof typeof MOCK_SCENARIOS) || 'FALLBACK';

  console.log(`Received search request for ISBN: ${isbn}, Scenario: ${scenarioKey}`);

  if (!isbn) {
    res.status(400).json({ error: 'ISBN query parameter is required' });
    return; 
  }

  // Validate scenario key
  if (!MOCK_SCENARIOS[scenarioKey]) {
    res.status(400).json({ error: `Invalid scenario key: ${scenarioKey}` });
    return;
  }

  try {
    // --- Call unified book service with fallback logic --- 
    // This will try ISBNdb first, then Google Books if ISBNdb fails
    const bookDetailsResult = await getBookDetails(isbn);
    
    // --- Get eBay lowest price data --- 
    let ebayData = null;
    try {
      if (bookDetailsResult && bookDetailsResult.title && bookDetailsResult.authors && bookDetailsResult.authors.length > 0) {
        const title = bookDetailsResult.title;
        const author = bookDetailsResult.authors[0];
        const mainTitle = await parseTitleWithAI(title);
        const searchTerm = `${mainTitle} ${author}`;
        
        console.log(`(Server) Searching eBay for: "${searchTerm}"`);
        ebayData = await findLowestPrice(searchTerm, isbn);
      }
    } catch (error) {
      console.error('(Server) Error fetching eBay data:', error);
    }
    
    // --- Send simple response with book details + eBay lowest price --- 
    const finalResult = {
      bookDetails: bookDetailsResult,
      ebayData: ebayData
    };

    res.json(finalResult); 

  } catch (error) {
    // Log the specific error type if possible
    console.error("(Backend API) Error during API search processing:", error);
    res.status(500).json({ error: 'An internal server error occurred processing the request.' });
  }
});

// Add a simple root route handler
app.get('/', (req: Request, res: Response): void => {
  res.json({ message: 'ScanWise Backend is running!' });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`ScanWise backend server listening on http://localhost:${port}`);
  
  // Log environment info
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`eBay API Marketplace: ${process.env.EBAY_MARKETPLACE_ID || 'EBAY_AU'}`);
});