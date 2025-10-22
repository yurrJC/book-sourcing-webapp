import React, { useState, useEffect, useRef, FormEvent } from 'react';
import './App.css';
import './ui-enhancements.css';

// Types
interface BookDetails {
  title?: string;
  authors?: string[];
  image?: string;
  publisher?: string;
  binding?: string;
  pages?: number;
  date_published?: string;
  dimensions?: string;
  source?: 'isbndb' | 'googlebooks';
}

interface SourcingVerdict {
  verdict: "BUY" | "REJECT";
  decidingStage: number;
  decidingReason: string;
  bookDetails?: BookDetails | null;
}

function App() {
  const [isbn, setIsbn] = useState('');
  const [scannedIsbn, setScannedIsbn] = useState<string>(''); // Store the ISBN of the scanned book
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SourcingVerdict | null>(null);
  const [optimizedTitle, setOptimizedTitle] = useState<string>('');

  // AI-powered title parsing function
  const parseTitleWithAI = async (title: string): Promise<string> => {
    try {
      const response = await fetch('https://book-sourcing-api.onrender.com/api/parse-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to parse title');
      }
      
      const data = await response.json();
      // Remove quotes from the AI response if present
      const parsedTitle = data.parsedTitle.replace(/^"(.*)"$/, '$1');
      return parsedTitle;
    } catch (error) {
      console.error('Error parsing title with AI:', error);
      // Fallback to simple colon splitting
      return title.includes(':') ? title.split(':')[0].trim() : title.trim();
    }
  };
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [lowestActivePrice, setLowestActivePrice] = useState<string>('');
  const [recentSoldPrice, setRecentSoldPrice] = useState<string>('');
  const [terapeakSales, setTerapeakSales] = useState<string>('');
  const [amazonBSR, setAmazonBSR] = useState<string>('');
  const [amazonReviews, setAmazonReviews] = useState<string>('');
  const [activeInput, setActiveInput] = useState<string | null>(null);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const quickScanInputRef = useRef<HTMLInputElement>(null);

  // Utility functions
  const safeOpenExternalLink = (url: string) => {
    try {
      // Check if we're in a PWA/standalone mode
      const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                    (window.navigator as any).standalone === true;
      
      if (isPWA) {
        // We're in a PWA/standalone mode - redirect completely to external app
        // This prevents the white page issue by fully leaving the PWA
        
        // Add visual feedback before redirect
        document.body.classList.add('external-link-redirecting');
        
        // Small delay to show the loading state, then redirect
        setTimeout(() => {
          if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            // Mobile device - try to open in native app
            window.location.href = url;
          } else {
            // Desktop PWA - redirect to web version
            window.location.href = url;
          }
        }, 100);
      } else {
        // Regular browser mode - open in new tab
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error opening external link:', error);
      // Fallback to direct navigation
      window.location.href = url;
    }
  };

  const handleNumericInput = (value: string) => {
    if (!activeInput) return;
    
    if (activeInput === 'active-price') {
      setLowestActivePrice(prev => prev + value);
    } else if (activeInput === 'sold-price') {
      setRecentSoldPrice(prev => prev + value);
    } else if (activeInput === 'terapeak-sales') {
      setTerapeakSales(prev => prev + value);
    } else if (activeInput === 'amazon-bsr') {
      setAmazonBSR(prev => prev + value);
    } else if (activeInput === 'amazon-reviews') {
      setAmazonReviews(prev => prev + value);
    }
  };

  const handleBackspace = () => {
    if (!activeInput) return;
    
    if (activeInput === 'active-price') {
      setLowestActivePrice(prev => prev.slice(0, -1));
    } else if (activeInput === 'sold-price') {
      setRecentSoldPrice(prev => prev.slice(0, -1));
    } else if (activeInput === 'terapeak-sales') {
      setTerapeakSales(prev => prev.slice(0, -1));
    } else if (activeInput === 'amazon-bsr') {
      setAmazonBSR(prev => prev.slice(0, -1));
    } else if (activeInput === 'amazon-reviews') {
      setAmazonReviews(prev => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    if (!activeInput) return;
    
    if (activeInput === 'active-price') {
      setLowestActivePrice('');
    } else if (activeInput === 'sold-price') {
      setRecentSoldPrice('');
    } else if (activeInput === 'terapeak-sales') {
      setTerapeakSales('');
    } else if (activeInput === 'amazon-bsr') {
      setAmazonBSR('');
    } else if (activeInput === 'amazon-reviews') {
      setAmazonReviews('');
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    
    const isbnToSearch = isbn.trim();
    if (!isbnToSearch) {
      setError('Please enter an ISBN');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Call the backend API to fetch book details from ISBNdb
      // Use production API URL - change to localhost:3001 for local development
      const baseUrl = 'https://book-sourcing-api.onrender.com'; // Change to 'http://localhost:3001' for local dev
      const apiUrl = `${baseUrl}/api/search?isbn=${encodeURIComponent(isbnToSearch)}&scenario=FALLBACK`;
      console.log(`(Frontend) Calling API: ${apiUrl}`);
      console.log(`(Frontend) Search term being sent to eBay: "${isbnToSearch}"`);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // Ignore if response body isn't JSON
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log("(Frontend) Backend Response:", result);
      
      // Log eBay-specific data for debugging
      if (result.ebayData) {
        console.log("(Frontend) eBay Data Details:", {
          lowestPrice: result.ebayData.lowestPrice,
          basePrice: result.ebayData.basePrice,
          shippingCost: result.ebayData.shippingCost,
          usedCount: result.ebayData.usedCount,
          newCount: result.ebayData.newCount
        });
      } else {
        console.log("(Frontend) No ebayData found in response");
      }
      
      // Store the API response for use in render
      setApiResponse(result);

      // Parse the title with AI and store the optimized version
      const originalTitle = result.bookDetails?.title || '';
      const aiOptimizedTitle = await parseTitleWithAI(originalTitle);
      setOptimizedTitle(aiOptimizedTitle);
      
      // Create result object with book details from ISBNdb
      const initialVerdict: SourcingVerdict = {
        verdict: result.verdict || "REJECT",
        decidingStage: result.stage || 0,
        decidingReason: result.verdict === "BUY" ? "Book passes initial screening" : "Awaiting manual data input",
        bookDetails: result.bookDetails
      };
      
      setSearchResult(initialVerdict);
      
      // Store the scanned ISBN for display in the results
      setScannedIsbn(isbnToSearch);
      
      // Clear the ISBN field for the next scan
      setIsbn('');
      
      // Auto-focus the quick scan input for the next scan
      setTimeout(() => {
        quickScanInputRef.current?.focus();
      }, 100);

    } catch (error) {
      console.error("(Frontend) API Fetch Error:", error);
      let errorMessage = (error as Error).message || 'An unexpected error occurred fetching data';
      
      // Check if this might be a network connectivity issue
      if (
        errorMessage.includes('Failed to fetch') || 
        errorMessage.includes('NetworkError') || 
        errorMessage.includes('Network request failed')
      ) {
        errorMessage = 'Network error: Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
      setSearchResult(null);
      setApiResponse(null);
      // Clear the ISBN field so user can retry with a new scan
      setIsbn('');
    } finally {
      setLoading(false);
    }
  };

  const handleNewScan = () => {
    setSearchResult(null);
    setApiResponse(null);
    setIsbn('');
    setScannedIsbn(''); // Clear the scanned ISBN for new scan
    setOptimizedTitle(''); // Clear the optimized title
    setError(null); // Clear any previous errors
    // Keep manual input fields populated for faster data entry
    setTimeout(() => {
      quickScanInputRef.current?.focus();
    }, 100);
  };

  const handleClearAll = () => {
    setSearchResult(null);
    setApiResponse(null);
    setIsbn('');
    setScannedIsbn(''); // Clear the scanned ISBN
    setOptimizedTitle(''); // Clear the optimized title
    setError(null); // Clear any previous errors
    setLowestActivePrice('');
    setRecentSoldPrice('');
    setTerapeakSales('');
    setAmazonBSR('');
    setAmazonReviews('');
  };

  return (
    <div className="App app-container">
      {!searchResult ? (
        <div className="content-area">
          <div className="scanwise-header">
            <img src="/images/scanwiselogov1.png" alt="ScanWise Logo" className="scanwise-logo" />
          </div>
          <div className="input-area">
            <form onSubmit={handleSearch}>
              <div className="isbn-input-container">
                <div className="input-group isbn-group">
                  <label htmlFor="isbn-input">ISBN:</label>
                  <input
                    id="isbn-input"
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="Enter book ISBN"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="search-button"
                  disabled={loading || !isbn.trim()}
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="results-container compact-layout">
          {/* Quick Scan Component - Prominent and always visible */}
          <div className="quick-scan-component">
            <button 
              className="quick-scan-button"
              onClick={handleNewScan}
            >
              📖 Quick Scan
            </button>
            
            {/* Quick ISBN input for immediate scanning - Auto-focused after each scan */}
            <div className="quick-isbn-input">
              <input
                ref={quickScanInputRef}
                type="text"
                placeholder="Enter next ISBN here..."
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && isbn.trim()) {
                    handleSearch(e as any);
                  }
                }}
                className="quick-isbn-field"
                autoFocus
              />
              <button 
                className="quick-search-btn"
                onClick={(e) => {
                  if (isbn.trim()) {
                    handleSearch(e as any);
                  }
                }}
                disabled={!isbn.trim()}
              >
                🔍
              </button>
            </div>
          </div>
          
          {/* Lowest Price Banner - Compact */}
          <div className="verdict-banner compact">
            <div className="verdict-label" style={{color: 'black'}}>Lowest Price</div>
            <div className="verdict-details">
              <span className="str-value">
                ${apiResponse?.ebayData?.lowestPrice ? apiResponse.ebayData.lowestPrice.toFixed(2) : '0.00'}
              </span>
              {' '}&bull;{' '}
              <span className="threshold-value">
                {apiResponse?.ebayData?.basePrice ? `Base: $${apiResponse.ebayData.basePrice.toFixed(2)}` : 'Base: $0.00'}
              </span>
              {' '}&bull;{' '}
              <span className="str-value">
                {apiResponse?.ebayData?.shippingCost ? `Shipping: $${apiResponse.ebayData.shippingCost.toFixed(2)}` : 'Shipping: $0.00'}
              </span>
            </div>
          </div>
          
          {/* Book Information Block - Compact */}
          <div className="book-info-block">
            <div className="book-cover">
              {searchResult?.bookDetails?.image ? (
                <img 
                  src={searchResult.bookDetails.image} 
                  alt={searchResult.bookDetails.title || 'Book cover'} 
                />
              ) : (
                <div className="placeholder-cover">
                  <span>No Cover</span>
                </div>
              )}
            </div>
            <div className="book-details">
              <h4 className="book-title">{optimizedTitle || searchResult?.bookDetails?.title || 'Unknown Title'}</h4>
              <p className="book-author">
                <span className="label">Author:</span> 
                <span className="value">{searchResult?.bookDetails?.authors?.join(', ') || 'Unknown Author'}</span>
              </p>
              <p className="book-isbn">
                <span className="label">ISBN:</span> 
                <span className="value">{scannedIsbn}</span>
              </p>
              {searchResult?.bookDetails?.publisher && (
                <p className="book-publisher">
                  <span className="label">Publisher:</span> 
                  <span className="value">{searchResult.bookDetails.publisher}</span>
                </p>
              )}
            </div>
          </div>
          
          {/* Lowest Price Component - Compact */}
          <div className="lowest-price-component">
            <div className="metrics-banner">
              <div className="metric">
                <span>Active Count</span>
                <span className="value">{apiResponse?.metrics?.activeCount || '0'}</span>
              </div>
              <div className="metric">
                <span>Sold Count</span>
                <span className="value">{apiResponse?.metrics?.soldCount || '0'}</span>
              </div>
              <div className="metric">
                <span>STR</span>
                <span className="value">{apiResponse?.metrics?.overallSTR ? (apiResponse.metrics.overallSTR * 100).toFixed(1) : '0.0'}%</span>
              </div>
              <div className="metric">
                <span>Min Price</span>
                <span className="value">${apiResponse?.metrics?.Pmin_overall ? apiResponse.metrics.Pmin_overall.toFixed(2) : '0.00'}</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons/Filters - Always visible shortcuts */}
          <div className="action-buttons">
            <button 
              className="action-btn actives"
              onClick={async () => {
                const title = searchResult?.bookDetails?.title || '';
                const author = searchResult?.bookDetails?.authors?.[0] || '';
                const mainTitle = await parseTitleWithAI(title);
                const searchQuery = `${mainTitle} ${author}`.trim();
                const ebayUrl = `https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}&_sacat=0&_from=R40&_sop=15&rt=nc&LH_PrefLoc=1`;
                safeOpenExternalLink(ebayUrl);
              }}
            >
              ACTIVES
            </button>
            <button 
              className="action-btn solds"
              onClick={async () => {
                const title = searchResult?.bookDetails?.title || '';
                const author = searchResult?.bookDetails?.authors?.[0] || '';
                const mainTitle = await parseTitleWithAI(title);
                const searchQuery = `${mainTitle} ${author}`.trim();
                const ebayUrl = `https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(searchQuery)}&_sacat=0&_from=R40&_sop=15&rt=nc&LH_PrefLoc=1&LH_Sold=1`;
                safeOpenExternalLink(ebayUrl);
              }}
            >
              SOLDS
            </button>
            <button 
              className="action-btn terapeak"
              onClick={async () => {
                const title = searchResult?.bookDetails?.title || '';
                const author = searchResult?.bookDetails?.authors?.[0] || '';
                const mainTitle = await parseTitleWithAI(title);
                const searchQuery = `${mainTitle} ${author}`.trim();
                
                // Calculate dynamic dates: 3 years from current date
                const now = new Date();
                const endDate = now.getTime();
                const startDate = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate()).getTime();
                
                // Format search query with + signs between words (like eBay expects)
                const formattedQuery = searchQuery.replace(/\s+/g, '+');
                
                const terapeakUrl = `https://www.ebay.com.au/sh/research?marketplace=EBAY-AU&keywords=${formattedQuery}&dayRange=1095&endDate=${endDate}&startDate=${startDate}&categoryId=0&offset=0&limit=50&tabName=SOLD&tz=Australia%2FMelbourne`;
                safeOpenExternalLink(terapeakUrl);
              }}
            >
              TERAPEAK
            </button>
            <button 
              className="action-btn amazon"
              onClick={async () => {
                const title = searchResult?.bookDetails?.title || '';
                const author = searchResult?.bookDetails?.authors?.[0] || '';
                const mainTitle = await parseTitleWithAI(title);
                const searchQuery = `${mainTitle} ${author}`.trim();
                const amazonUrl = `https://www.amazon.com.au/s?k=${encodeURIComponent(searchQuery)}`;
                safeOpenExternalLink(amazonUrl);
              }}
            >
              AMAZON
            </button>
          </div>
          
          {/* Calculator Button - Opens popup */}
          <div className="calculator-section">
            <button 
              className="calculator-btn"
              onClick={() => setCalculatorVisible(true)}
            >
              🧮 CALCULATOR
            </button>
          </div>
          
          {/* Manual Input Section - Compact */}
          <div className="manual-input-section compact">
            <h3>Manual Data Entry</h3>
            
            <div className="input-grid">
              <div className="input-field compact">
                <label htmlFor="active-price">Active Count:</label>
                <input
                  id="active-price"
                  type="number"
                  min="1"
                  step="1"
                  value={lowestActivePrice}
                  onChange={(e) => setLowestActivePrice(e.target.value)}
                  placeholder="0"
                  className="compact-input"
                  onFocus={() => setActiveInput('active-price')}
                  readOnly
                />
              </div>
              
              <div className="input-field compact">
                <label htmlFor="sold-price">Sold Count:</label>
                <input
                  id="sold-price"
                  type="number"
                  min="0"
                  step="1"
                  value={recentSoldPrice}
                  onChange={(e) => setRecentSoldPrice(e.target.value)}
                  placeholder="0"
                  className="compact-input"
                  onFocus={() => setActiveInput('sold-price')}
                  readOnly
                />
              </div>
              
              <div className="input-field compact">
                <label htmlFor="terapeak-sales">Terapeak Sales:</label>
                <input
                  id="terapeak-sales"
                  type="number"
                  min="0"
                  step="1"
                  value={terapeakSales}
                  onChange={(e) => setTerapeakSales(e.target.value)}
                  placeholder="0"
                  className="compact-input"
                  onFocus={() => setActiveInput('terapeak-sales')}
                  readOnly
                />
              </div>
              
              <div className="input-field compact">
                <label htmlFor="amazon-bsr">Amazon BSR:</label>
                <input
                  id="amazon-bsr"
                  type="number"
                  min="1"
                  step="1"
                  value={amazonBSR}
                  onChange={(e) => setAmazonBSR(e.target.value)}
                  placeholder="0"
                  className="compact-input"
                  onFocus={() => setActiveInput('amazon-bsr')}
                  readOnly
                />
              </div>
              
              <div className="input-field compact">
                <label htmlFor="amazon-reviews">Amazon Reviews:</label>
                <input
                  id="amazon-reviews"
                  type="number"
                  min="0"
                  step="1"
                  value={amazonReviews}
                  onChange={(e) => setAmazonReviews(e.target.value)}
                  placeholder="0"
                  className="compact-input"
                  onFocus={() => setActiveInput('amazon-reviews')}
                  readOnly
                />
              </div>
            </div>
            
            {/* Compact Numeric Keypad */}
            <div className="compact-keypad">
              <div className="keypad-header">
                <span>Numeric Keypad</span>
                {activeInput && (
                  <span className="active-input-indicator">
                    {activeInput.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
              </div>
              
              <div className="keypad-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <button 
                    key={num}
                    onClick={() => handleNumericInput(num.toString())}
                    className="keypad-btn"
                    disabled={!activeInput}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              <div className="keypad-actions">
                <button 
                  onClick={handleBackspace}
                  className="keypad-action-btn backspace"
                  disabled={!activeInput}
                >
                  ← Backspace
                </button>
                <button 
                  onClick={handleClear}
                  className="keypad-action-btn clear"
                  disabled={!activeInput}
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="calculate-section">
              <button 
                className="calculate-button"
                onClick={() => {
                  // Calculate logic would go here
                  console.log('Calculating verdict...');
                }}
              >
                Calculate Verdict
              </button>
            </div>
            
            {searchResult.decidingReason && (
              <div className="verdict-reason">
                {searchResult.decidingReason}
              </div>
            )}
          </div>
          
          {/* Control Buttons */}
          <div className="control-buttons">
            <button 
              className="control-btn new-scan"
              onClick={handleNewScan}
            >
              📖 New Scan
            </button>
            <button 
              className="control-btn clear-all"
              onClick={handleClearAll}
            >
              🗑️ Clear All
            </button>
          </div>
        </div>
      )}
      
      {/* Calculator Popup */}
      {calculatorVisible && (
        <div className="calculator-popup-overlay" onClick={() => setCalculatorVisible(false)}>
          <div className="calculator-popup" onClick={(e) => e.stopPropagation()}>
            <div className="calculator-header">
              <h3>Calculator</h3>
              <button 
                className="close-btn"
                onClick={() => setCalculatorVisible(false)}
              >
                ×
              </button>
            </div>
            <div className="calculator-content">
              <p>Calculator functionality goes here...</p>
              {/* Add your calculator content */}
            </div>
          </div>
        </div>
      )}
      
      {loading && <div className="loading">Analyzing market data...</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

export default App;
