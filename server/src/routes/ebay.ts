import express, { Request, Response } from 'express';
import { findLowestPrice, getLowestPriceDetails } from '../ebayService';

const router = express.Router();

/**
 * Endpoint to check lowest eBay price for a book
 * GET /api/check-ebay-price?searchTerm=BookTitle+Author&isbn=123456789
 */
router.get('/check-ebay-price', async (req: Request, res: Response): Promise<void> => {
  let searchTerm = req.query.searchTerm as string;
  const isbn = req.query.isbn as string;
  const title = req.query.title as string;
  const author = req.query.author as string;
  
  // Allow flexibility in how the search term is provided
  if (!searchTerm && title) {
    // If no searchTerm but we have title (and maybe author), build the search term
    searchTerm = author ? `${title} ${author}` : title;
  }
  
  if (!searchTerm) {
    res.status(400).json({ error: 'searchTerm or title query parameter is required' });
    return;
  }
  
  console.log('=== eBay Price Check ===');
  console.log(`Search Term: "${searchTerm}"`);
  if (isbn) console.log(`ISBN: ${isbn}`);
  
  try {
    // Find the lowest price on eBay
    const result = await findLowestPrice(searchTerm, isbn);
    
    console.log(`Lowest price: ${result.lowestPrice ? '$' + result.lowestPrice : 'Not found'}`);
    console.log(`Used count: ${result.usedCount}, New count: ${result.newCount}`);
    
    res.json({
      success: true,
      lowestPrice: result.lowestPrice,
      usedCount: result.usedCount,
      newCount: result.newCount
    });
  } catch (error) {
    console.error('Error in check-ebay-price route:', error);
    
    // In development, use mock data when eBay API fails
    if (process.env.NODE_ENV !== 'production') {
      console.warn('API call failed. Returning simulated price data for development');
      
      // Create a price between $5 and $30
      const mockPrice = (Math.random() * 25 + 5).toFixed(2);
      const lowestPrice = parseFloat(mockPrice);
      
      res.json({
        success: true,
        lowestPrice,
        message: `SIMULATED: Lowest price $${lowestPrice.toFixed(2)}`,
        simulated: true
      });
    } else {
      res.status(500).json({ 
        success: false,
        error: 'Failed to retrieve eBay price data',
        message: (error as Error).message
      });
    }
  }
});

/**
 * Detailed endpoint for debugging (returns more information)
 * GET /api/check-ebay-price/details?searchTerm=BookTitle+Author&isbn=123456789
 */
router.get('/check-ebay-price/details', async (req: Request, res: Response): Promise<void> => {
  let searchTerm = req.query.searchTerm as string;
  const isbn = req.query.isbn as string;
  const title = req.query.title as string;
  const author = req.query.author as string;
  
  // Allow flexibility in how the search term is provided
  if (!searchTerm && title) {
    // If no searchTerm but we have title (and maybe author), build the search term
    searchTerm = author ? `${title} ${author}` : title;
  }
  
  if (!searchTerm) {
    res.status(400).json({ error: 'searchTerm or title query parameter is required' });
    return;
  }
  
  console.log('=== eBay Price Details ===');
  console.log(`Search Term: "${searchTerm}"`);
  if (isbn) console.log(`ISBN: ${isbn}`);
  
  try {
    // Get detailed price data
    const priceDetails = await getLowestPriceDetails(searchTerm, isbn);
    
    console.log(`Found ${priceDetails.itemCount || 0} items`);
    
    res.json({
      success: true,
      ...priceDetails
    });
  } catch (error) {
    console.error('Error in check-ebay-price/details route:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to retrieve detailed eBay data',
      message: (error as Error).message
    });
  }
});

/**
 * Search directly with title and author as separate parameters
 * GET /api/ebay/search?title=Your+Time+Is+Now&author=Julie+Goodwin
 */
router.get('/ebay/search', async (req: Request, res: Response): Promise<void> => {
  const title = req.query.title as string;
  const author = req.query.author as string;
  
  if (!title) {
    res.status(400).json({ error: 'title query parameter is required' });
    return;
  }
  
  // Build search term with title and optional author
  const searchTerm = author ? `${title} ${author}` : title;
  
  console.log('=== eBay Direct Search ===');
  console.log(`Title: "${title}"`);
  if (author) console.log(`Author: "${author}"`);
  console.log(`Search Term: "${searchTerm}"`);
  
  try {
    // Get detailed price data
    const priceDetails = await getLowestPriceDetails(searchTerm, '');
    
    res.json({
      success: true,
      searchTerm,
      ...priceDetails
    });
  } catch (error) {
    console.error('Error in ebay/search route:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to search eBay',
      message: (error as Error).message
    });
  }
});

/**
 * Debug endpoint to see all eBay listings
 * GET /api/ebay/all-listings?title=Your+Time+Is+Now&author=Julie+Goodwin
 */
router.get('/ebay/all-listings', async (req: Request, res: Response): Promise<void> => {
  const title = req.query.title as string;
  const author = req.query.author as string;
  
  if (!title) {
    res.status(400).json({ error: 'title query parameter is required' });
    return;
  }
  
  // Build search term with title and optional author
  const searchTerm = author ? `${title} ${author}` : title;
  
  console.log('=== eBay All Listings Debug ===');
  console.log(`Title: "${title}"`);
  if (author) console.log(`Author: "${author}"`);
  console.log(`Search Term: "${searchTerm}"`);
  
  try {
    // Get detailed price data
    const priceDetails = await getLowestPriceDetails(searchTerm, '');
    
    res.json({
      success: true,
      searchTerm,
      totalItems: priceDetails.itemCount,
      usedCount: priceDetails.usedCount,
      newCount: priceDetails.newCount,
      lowestPrice: priceDetails.lowestPrice,
      allListings: priceDetails.allItems || []
    });
  } catch (error) {
    console.error('Error in ebay/all-listings route:', error);
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to get all eBay listings',
      message: (error as Error).message
    });
  }
});

export default router; 