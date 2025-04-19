// server/src/server.ts
import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file

import express, { Request, Response } from 'express';
import cors from 'cors';
import { calculateSourcingVerdict, MOCK_SCENARIOS } from './sourcing-engine'; // Import backend engine
import { SourcingResult } from './types'; // Import backend types
import { getBookDetailsFromIsbnDb } from './isbnDbClient'; // Import the ISBNdb client
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

// Updated search endpoint using backend sourcing engine AND ISBNdb lookup
app.get('/api/search', async (req: Request, res: Response): Promise<void> => {
  const isbn = req.query.isbn as string;
  // TODO: Later, we might get scenario from query params or other source for testing
  // For now, just use a default or let the engine pick one?
  // Let's allow selecting a scenario via query param for testing consistency
  const scenarioKey = (req.query.scenario as keyof typeof MOCK_SCENARIOS) || 'STRONG_EQUILIBRIUM';

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
    // --- Call ISBNdb API --- 
    // We can run this concurrently with the sourcing calculation if desired
    // Or sequentially if sourcing logic might depend on book details (e.g., weight)
    const bookDetailsResult = await getBookDetailsFromIsbnDb(isbn);
    
    // --- Call the backend sourcing logic (still using mock scenario for prices/sales) --- 
    const sourcingResult: SourcingResult = await calculateSourcingVerdict(isbn, scenarioKey);
    
    // --- Combine results and Send back to the frontend --- 
    const finalResult: SourcingResult = {
      ...sourcingResult, // Spread the results from the sourcing engine
      bookDetails: bookDetailsResult ? bookDetailsResult.book : null // Add the fetched book details
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