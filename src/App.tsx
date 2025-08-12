import React, { useState, useEffect, useRef, FormEvent } from 'react';
import './App.css';
import './ui-enhancements.css';

// Types
interface SourcingVerdict {
  verdict: "BUY" | "REJECT";
  decidingStage: number;
  decidingReason: string;
  bookDetails?: {
    title?: string;
    authors?: string[];
    image?: string;
  } | null;
}

function App() {
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SourcingVerdict | null>(null);
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
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening external link:', error);
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResult: SourcingVerdict = {
        verdict: "REJECT",
        decidingStage: 0,
        decidingReason: "Awaiting manual data input",
        bookDetails: {
          title: "Sample Book Title",
          authors: ["Sample Author"],
          image: undefined
        }
      };
      
      setSearchResult(mockResult);
      
      // Auto-focus the quick scan input for the next scan
      setTimeout(() => {
        quickScanInputRef.current?.focus();
      }, 100);

    } catch (error) {
      setError('An error occurred during search');
    } finally {
      setLoading(false);
    }
  };

  const handleNewScan = () => {
    setSearchResult(null);
    setIsbn('');
    // Keep manual input fields populated for faster data entry
    setTimeout(() => {
      quickScanInputRef.current?.focus();
    }, 100);
  };

  const handleClearAll = () => {
    setSearchResult(null);
    setIsbn('');
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
            <h1>ScanWise</h1>
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
          
          {/* Verdict Banner - Compact */}
          <div className="verdict-banner compact">
            <div className="verdict-label">{searchResult.verdict}</div>
            <div className="verdict-details">
              Sales to Ratio: <span className="str-value">0.00</span>
              {' '}&bull;{' '}
              Threshold: <span className="threshold-value">60.0%</span>
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
              <h4 className="book-title">{searchResult?.bookDetails?.title || 'Unknown Title'}</h4>
              <p className="book-author">
                <span className="label">Author:</span> 
                <span className="value">{searchResult?.bookDetails?.authors?.join(', ') || 'Unknown Author'}</span>
              </p>
              <p className="book-isbn">
                <span className="label">ISBN:</span> 
                <span className="value">{isbn}</span>
              </p>
            </div>
          </div>
          
          {/* Lowest Price Component - Compact */}
          <div className="lowest-price-component">
            <div className="metrics-banner">
              <div className="metric">
                <span>Active Count</span>
                <span className="value">{lowestActivePrice || '0'}</span>
              </div>
              <div className="metric">
                <span>Sold Count</span>
                <span className="value">{recentSoldPrice || '0'}</span>
              </div>
              <div className="metric">
                <span>STR</span>
                <span className="value">0.00</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons/Filters - Always visible shortcuts */}
          <div className="action-buttons">
            <button 
              className="action-btn actives"
              onClick={() => safeOpenExternalLink('https://www.ebay.com.au')}
            >
              ACTIVES
            </button>
            <button 
              className="action-btn solds"
              onClick={() => safeOpenExternalLink('https://www.ebay.com.au')}
            >
              SOLDS
            </button>
            <button 
              className="action-btn terapeak"
              onClick={() => safeOpenExternalLink('https://www.ebay.com.au')}
            >
              TERAPEAK
            </button>
            <button 
              className="action-btn amazon"
              onClick={() => safeOpenExternalLink('https://www.amazon.com.au')}
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
