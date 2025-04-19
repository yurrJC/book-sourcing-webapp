import axios from 'axios';
import NodeCache from 'node-cache';

// Constants for eBay API
const EBAY_API_URL = 'https://api.ebay.com';
const SANDBOX_API_URL = 'https://api.sandbox.ebay.com';

// Use environment variables for credentials
const APP_ID = process.env.EBAY_APP_ID || '';
const CERT_ID = process.env.EBAY_CERT_ID || '';
const REDIRECT_URI = process.env.EBAY_REDIRECT_URI || '';
const MARKETPLACE_ID = process.env.EBAY_MARKETPLACE_ID || 'EBAY_AU'; // Default to Australia

// Setup caching for tokens and responses
const tokenCache = new NodeCache({ stdTTL: 7000 }); // Token TTL slightly less than 2 hours

/**
 * Interface for eBay OAuth token response
 */
interface EbayTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

/**
 * eBay item interface for price checking
 */
interface EbayItem {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  seller: {
    username: string;
    feedbackPercentage: string;
    feedbackScore: number;
  };
  condition: string;
  shipping?: {
    shippingCost?: {
      value: string;
    }
  };
  itemWebUrl: string;
  itemLocation?: {
    city?: string;
    stateOrProvince?: string;
    country?: string;
    addressLine1?: string;
  };
}

/**
 * Get OAuth token for eBay API
 */
async function getEbayToken(): Promise<string> {
  // Check if we have a cached token
  const cachedToken = tokenCache.get<string>('ebayToken');
  if (cachedToken) {
    return cachedToken;
  }

  try {
    // We need to get a new token
    const response = await axios({
      method: 'post',
      url: `${EBAY_API_URL}/identity/v1/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${APP_ID}:${CERT_ID}`).toString('base64')}`
      },
      data: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
    });

    const tokenData: EbayTokenResponse = response.data;
    
    // Cache the token (with slightly shorter TTL than actual expiry)
    tokenCache.set('ebayToken', tokenData.access_token, tokenData.expires_in - 300);
    
    return tokenData.access_token;
  } catch (error) {
    console.error('Error obtaining eBay token:', error);
    throw new Error('Failed to authenticate with eBay API');
  }
}

/**
 * Find the lowest priced eBay listing for a book
 */
export async function findLowestPrice(searchTerm: string, isbn: string): Promise<any> {
  try {
    console.log(`Searching eBay for: "${searchTerm}"`);
    
    // Authenticate with eBay
    const token = await getEbayToken();
    console.log('Authentication successful. Received token.');
    
    // Build the search params - removing condition filter to get both new and used
    const searchParams = {
      q: searchTerm,
      filter: [
        'itemLocationCountry:AU', // Australia only
        'buyingOptions:{FIXED_PRICE}', // Only Buy It Now
        // 'conditions:{USED}', // Removed to get both new and used
      ],
      sort: 'price',
      limit: 40 // Increased to get more results
    };
    
    console.log('Search parameters:', JSON.stringify(searchParams, null, 2));
    
    // Search for the book on eBay
    const response = await axios({
      method: 'get',
      url: `${EBAY_API_URL}/buy/browse/v1/item_summary/search`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': MARKETPLACE_ID,
        'Content-Type': 'application/json'
      },
      params: searchParams
    });

    console.log(`eBay API response status: ${response.status}`);
    
    // Check if we have any items
    if (response.data && 
        response.data.itemSummaries && 
        response.data.itemSummaries.length > 0) {
      
      console.log(`Found ${response.data.itemSummaries.length} total items, filtering out non-physical formats and verifying location`);
      
      // Filter out audiobooks, ebooks, and other non-physical book formats
      // Also double check the item location is Australia
      const filteredItems = response.data.itemSummaries.filter((item: any) => {
        const title = item.title.toLowerCase();
        const isPhysicalBook = !title.includes('audiobook') && 
               !title.includes('audio book') && 
               !title.includes('audio cd') &&
               !title.includes('mp3') &&
               !title.includes('ebook') && 
               !title.includes('e-book') &&
               !title.includes('kindle');
        
        // Double check the item is located in Australia
        const isInAustralia = item.itemLocation && 
                             (item.itemLocation.country === 'AU' || 
                              (item.itemLocation.country === 'Australia') ||
                              (item.itemLocation.addressLine1 && item.itemLocation.addressLine1.includes('Australia')));
        
        if (!isPhysicalBook) {
          console.log(`Filtered out non-physical item: "${item.title}"`);
        }
        
        if (!isInAustralia && item.itemLocation) {
          console.log(`Filtered out non-Australia item: "${item.title}" from ${item.itemLocation.country || 'unknown country'}`);
        }
        
        return isPhysicalBook && isInAustralia;
      });
      
      console.log(`After filtering: ${filteredItems.length} items remain (all in Australia)`);
      
      if (filteredItems.length === 0) {
        console.log('No physical books found after filtering');
        return {
          lowestPrice: null,
          usedCount: 0,
          newCount: 0
        };
      }
      
      // Count new and used books
      let usedCount = 0;
      let newCount = 0;
      
      filteredItems.forEach((item: any) => {
        if (item.condition && item.condition.toLowerCase().includes('new')) {
          newCount++;
        } else {
          usedCount++;
        }
      });
      
      console.log(`Found ${usedCount} used books and ${newCount} new books`);
      
      // Calculate total price including shipping for each item
      const itemsWithTotalPrice = filteredItems.map((item: any) => {
        const basePrice = parseFloat(item.price.value);
        const shippingCost = item.shippingOptions && 
                             item.shippingOptions[0] && 
                             item.shippingOptions[0].shippingCost ? 
                             parseFloat(item.shippingOptions[0].shippingCost.value) : 0;
        
        return {
          ...item,
          totalPrice: basePrice + shippingCost,
          basePrice: basePrice,
          shippingCost: shippingCost
        };
      });
      
      // Sort by total price
      itemsWithTotalPrice.sort((a: any, b: any) => a.totalPrice - b.totalPrice);
      
      // Get the lowest priced item
      const lowestPricedItem = itemsWithTotalPrice[0];
      const lowestBasePrice = lowestPricedItem.basePrice;
      const lowestShippingCost = lowestPricedItem.shippingCost;
      const lowestTotalPrice = lowestPricedItem.totalPrice;
      
      console.log(`Lowest total price: $${lowestTotalPrice.toFixed(2)} (Base: $${lowestBasePrice.toFixed(2)}, Shipping: $${lowestShippingCost.toFixed(2)}) for item "${lowestPricedItem.title}"`);
      
      // Return price and counts
      return {
        lowestPrice: lowestTotalPrice,
        basePrice: lowestBasePrice,
        shippingCost: lowestShippingCost,
        condition: lowestPricedItem.condition || 'Not specified',
        usedCount,
        newCount
      };
    } else {
      console.log('No items found in eBay response');
      if (response.data) {
        console.log('Response data:', JSON.stringify(response.data, null, 2));
      }
      
      // No items found
      return {
        lowestPrice: null,
        usedCount: 0,
        newCount: 0
      };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('eBay API Error:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    } else {
      console.error('Error searching eBay for lowest price:', error);
    }
    
    // For development/debugging - return null in production
    return {
      lowestPrice: null,
      usedCount: 0,
      newCount: 0
    };
  }
}

/**
 * Get detailed lowest price info (for debugging/analytics)
 */
export async function getLowestPriceDetails(searchTerm: string, isbn: string): Promise<any> {
  try {
    // Authenticate with eBay
    const token = await getEbayToken();
    
    // Search for the book on eBay
    const response = await axios({
      method: 'get',
      url: `${EBAY_API_URL}/buy/browse/v1/item_summary/search`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': MARKETPLACE_ID,
        'Content-Type': 'application/json'
      },
      params: {
        q: searchTerm,
        filter: [
          'itemLocationCountry:AU', // Australia only
          'buyingOptions:{FIXED_PRICE}', // Only Buy It Now
          // 'conditions:{USED}', // Removed to get both new and used
        ],
        sort: 'price',
        limit: 40 // Increased to get more results
      }
    });

    // Check if we have any items
    if (response.data && 
        response.data.itemSummaries && 
        response.data.itemSummaries.length > 0) {
      
      // Filter out audiobooks, ebooks, and other non-physical book formats
      // Also double check the item location is Australia
      const filteredItems = response.data.itemSummaries.filter((item: any) => {
        const title = item.title.toLowerCase();
        const isPhysicalBook = !title.includes('audiobook') && 
               !title.includes('audio book') && 
               !title.includes('audio cd') &&
               !title.includes('mp3') &&
               !title.includes('ebook') && 
               !title.includes('e-book') &&
               !title.includes('kindle');
        
        // Double check the item is located in Australia
        const isInAustralia = item.itemLocation && 
                             (item.itemLocation.country === 'AU' || 
                              (item.itemLocation.country === 'Australia') ||
                              (item.itemLocation.addressLine1 && item.itemLocation.addressLine1.includes('Australia')));
        
        return isPhysicalBook && isInAustralia;
      });
      
      // Count new and used books
      let usedCount = 0;
      let newCount = 0;
      
      filteredItems.forEach((item: any) => {
        if (item.condition && item.condition.toLowerCase().includes('new')) {
          newCount++;
        } else {
          usedCount++;
        }
      });
      
      // Calculate total price including shipping for each item
      const itemsWithTotalPrice = filteredItems.map((item: any) => {
        const basePrice = parseFloat(item.price.value);
        const shippingCost = item.shippingOptions && 
                             item.shippingOptions[0] && 
                             item.shippingOptions[0].shippingCost ? 
                             parseFloat(item.shippingOptions[0].shippingCost.value) : 0;
        
        return {
          ...item,
          totalPrice: basePrice + shippingCost,
          basePrice: basePrice,
          shippingCost: shippingCost
        };
      });
      
      // Sort by total price
      itemsWithTotalPrice.sort((a: any, b: any) => a.totalPrice - b.totalPrice);
      
      // Return the full details for debugging
      const items = itemsWithTotalPrice;
      
      // Format the response for our needs
      return {
        lowestPrice: items.length > 0 ? items[0].totalPrice : null,
        basePrice: items.length > 0 ? items[0].basePrice : null,
        shippingCost: items.length > 0 ? items[0].shippingCost : null,
        condition: items.length > 0 ? items[0].condition : null,
        itemCount: filteredItems.length,
        usedCount,
        newCount,
        totalBeforeFiltering: response.data.itemSummaries.length,
        searchTerm: searchTerm,
        topItems: items.slice(0, 5).map((item: any) => ({
          title: item.title,
          price: item.totalPrice,
          basePrice: item.basePrice,
          shippingCost: item.shippingCost,
          condition: item.condition,
          sellerId: item.seller?.username || 'unknown',
          itemUrl: item.itemWebUrl || '#',
          location: item.itemLocation ? `${item.itemLocation.city || ''}, ${item.itemLocation.stateOrProvince || ''}, ${item.itemLocation.country || 'AU'}` : 'Australia'
        })),
        // Add all items for debugging
        allItems: items.map((item: any) => ({
          title: item.title,
          price: item.totalPrice,
          basePrice: item.basePrice,
          shippingCost: item.shippingCost,
          condition: item.condition,
          sellerId: item.seller?.username || 'unknown',
          itemUrl: item.itemWebUrl || '#',
          location: item.itemLocation ? `${item.itemLocation.city || ''}, ${item.itemLocation.stateOrProvince || ''}, ${item.itemLocation.country || 'AU'}` : 'Australia'
        })),
        excludedFormats: ['audiobook', 'audio book', 'ebook', 'e-book', 'kindle', 'audio cd', 'mp3']
      };
    }
    
    // No items found
    return {
      lowestPrice: null,
      itemCount: 0,
      usedCount: 0,
      newCount: 0,
      totalBeforeFiltering: response.data?.itemSummaries?.length || 0,
      topItems: [],
      excludedFormats: ['audiobook', 'audio book', 'ebook', 'e-book', 'kindle', 'audio cd', 'mp3']
    };
  } catch (error) {
    console.error('Error searching eBay for lowest price details:', error);
    throw error;
  }
} 