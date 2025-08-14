// server/src/server.ts
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express, { Request, Response } from 'express';
import cors from 'cors';
import { calculateSourcingVerdict, MOCK_SCENARIOS } from './sourcing-engine'; // Import backend engine
import { SourcingResult } from './types'; // Import backend types
import { getBookDetails } from './bookService'; // Import the unified book service
import ebayRoutes from './routes/ebay'; // Import eBay routes

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
    
    // --- Call the backend sourcing logic (still using mock scenario for prices/sales) --- 
    const sourcingResult: SourcingResult = await calculateSourcingVerdict(isbn, scenarioKey);
    
    // --- Combine results and Send back to the frontend --- 
    const finalResult: SourcingResult = {
      ...sourcingResult, // Spread the results from the sourcing engine
      bookDetails: bookDetailsResult // Add the fetched book details (now includes source info)
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