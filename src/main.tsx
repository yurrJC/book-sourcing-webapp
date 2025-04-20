import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import './ui-enhancements.css';
import { SourcingVerdict } from './types';
import { MOCK_SCENARIOS } from './lib/sourcing-engine';

// Constants
const STR_THRESHOLD = 0.6; // Threshold for STR calculations
const MIN_PRICE_THRESHOLD = 15.00; // Minimum acceptable price in AUD

// Add CSS for Amazon section
const amazonSectionStyles = `
.amazon-section {
  margin-top: 20px;
  border-top: 2px dashed #e0e0e0;
  padding-top: 15px;
}

.amazon-section h4 {
  color: #E47911;
  margin-bottom: 15px;
}

/* Updated verdict banners with gradients */
.verdict-banner {
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 10px 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.verdict-banner.buy {
  background: linear-gradient(135deg, #34a853 0%, #1e8e3e 100%);
}

.verdict-banner.reject {
  background: linear-gradient(135deg, #ea4335 0%, #c5221f 100%);
}

.verdict-banner.check {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
}

.verdict-label {
  font-size: 1.3rem;
  margin-bottom: 4px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

/* Enhanced Front Page Styles */
.scanwise-header {
  text-align: center;
  margin-bottom: 2rem;
  padding: 2rem 0;
  background: #333333; /* Dark charcoal grey */
  color: white;
  border-radius: 0 0 16px 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.scanwise-header:before {
  content: "";
  position: absolute;
  top: -10px;
  right: -10px;
  background: rgba(255, 255, 255, 0.1);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  z-index: 0;
}

.scanwise-header:after {
  content: "";
  position: absolute;
  bottom: -20px;
  left: -20px;
  background: rgba(255, 255, 255, 0.08);
  width: 140px;
  height: 140px;
  border-radius: 50%;
  z-index: 0;
}

.scanwise-header h1 {
  margin: 0;
  font-size: 2.8rem;
  letter-spacing: 1px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;
  color: white;
}

.scanwise-header .logo-container {
  margin: 0;
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.scanwise-header .logo {
  height: 80px;
  max-width: 100%;
}

.tagline {
  margin: 0.5rem 0 0;
  font-size: 1.2rem;
  font-weight: 300;
  opacity: 0.9;
  color: #333; /* Changed text color for better contrast against grey background */
}

.isbn-group {
  margin-bottom: 1.8rem;
  position: relative;
}

.isbn-input-container {
  max-width: 450px;
  margin: 0 auto;
  padding: 2rem;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
  transform: translateY(-20px);
  border: 1px solid rgba(0, 0, 0, 0.04);
}

.input-group label {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
  display: block;
  font-weight: 600;
  color: #202124;
}

.input-group input {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  border: 1px solid #dadce0;
  border-radius: 8px;
  outline: none;
  transition: all 0.3s ease;
  background-color: #f8f9fa;
}

.input-group input:focus {
  border-color: #4285F4;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.25);
  background-color: white;
}

.search-button {
  width: 100%;
  padding: 1rem;
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #4285F4 0%, #34a853 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.search-button:before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.search-button:hover:before {
  left: 100%;
}

.search-button:hover {
  background: linear-gradient(135deg, #3b78e7 0%, #2d9348 100%);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.search-button:disabled {
  background: linear-gradient(135deg, #cccccc 0%, #bbbbbb 100%);
  cursor: not-allowed;
  box-shadow: none;
}

.instant-reject-section {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0 1.5rem;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
  position: relative;
}

.instant-reject-section:before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background-color: #ea4335;
  border-radius: 4px 0 0 4px;
}

.instant-reject-section h3 {
  display: flex;
  align-items: center;
  margin-top: 0;
  color: #202124;
  font-size: 1.1rem;
  margin-bottom: 1.2rem;
  font-weight: 600;
  position: relative;
}

.instant-reject-section h3:before {
  content: "⚠️";
  font-size: 1.2rem;
  margin-right: 8px;
}

.threshold-input-container {
  display: flex;
  flex-direction: column;
  margin-top: 1rem;
}

.threshold-input-container label {
  font-size: 0.95rem;
  font-weight: 500;
  margin-bottom: 0.4rem;
  color: #5f6368;
}

.price-input-container {
  position: relative;
  margin-top: 0.25rem;
  width: 100%;
}

.currency-symbol {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  color: #5f6368;
  z-index: 2;
  font-weight: 500;
}

.price-input {
  padding-left: 28px !important;
  background-color: white !important;
  border-color: #dadce0 !important;
  height: 42px !important;
  font-size: 1rem !important;
  width: 100%;
  max-width: 150px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.4rem 0;
}

.checkbox-container input[type="checkbox"] {
  margin-right: 10px;
  width: 20px;
  height: 20px;
  accent-color: #4285F4;
  cursor: pointer;
}

.checkbox-container label {
  font-weight: 500;
  cursor: pointer;
  font-size: 0.95rem;
}

.price-helper-text {
  font-size: 0.8rem;
  color: #70757a;
  margin-top: 0.4rem;
  font-style: italic;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 1rem;
  max-width: 100%;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .scanwise-header h1 {
    font-size: 2.2rem;
  }
  
  .isbn-input-container {
    padding: 1.5rem;
    transform: translateY(-15px);
  }
  
  .input-group input, 
  .search-button {
    font-size: 1rem;
    padding: 0.9rem;
  }
  
  .instant-reject-section {
    padding: 1rem;
  }
}

/* Updated metrics banner */
.metrics-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  background-color: #fff;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.metric {
  flex: 1;
  min-width: 120px;
  padding: 8px;
  border-radius: 6px;
  background-color: #f8f9fa;
  border-left: 3px solid #ddd;
}

.metric:nth-child(1) {
  border-left-color: #4285F4;
}

.metric:nth-child(2) {
  border-left-color: #34A853;
}

.metric:nth-child(3) {
  border-left-color: #FBBC05;
}

.metric:nth-child(4) {
  border-left-color: #EA4335;
}

.metric:nth-child(5) {
  border-left-color: #673AB7;
}

.metric span:first-child {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #5f6368;
  margin-bottom: 3px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.metric .value {
  font-size: 1rem;
  font-weight: 700;
  color: #202124;
}

.inventory-counts {
  font-size: 0.8em;
  color: #666;
  display: block;
  margin-top: 2px;
}

.price-breakdown {
  font-size: 0.75em;
  color: #666;
  display: block;
  margin-top: 2px;
  font-style: italic;
}

.item-condition {
  color: #444;
  font-weight: 500;
}

/* Improved manual data entry section */
.manual-input-container {
  background-color: #fff;
  border-radius: 8px;
  padding: 12px 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  margin-bottom: 15px;
}

.manual-input-container h3 {
  font-size: 1.1rem;
  margin-bottom: 8px;
  color: #202124;
  font-weight: 600;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 8px;
}

.instructions {
  font-size: 0.85rem;
  color: #5f6368;
  margin-bottom: 12px;
}

.manual-input-section {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
}

.input-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  width: 100%;
}

.button-base {
  min-width: 110px;
  width: 110px;
  height: 36px;
  padding: 5px 10px;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #dadce0;
  cursor: pointer;
  font-size: 13px;
  background-color: white;
  color: #3c4043;
  font-weight: 500;
  transition: all 0.2s ease;
  margin: 0;
  flex-shrink: 0;
}

.button-base:hover {
  background-color: #f1f3f4;
  border-color: #d2d4d7;
}

.button-container {
  width: 110px;
  margin-right: 12px;
  flex-shrink: 0;
}

.ebay-link-button {
  composes: button-base;
  background-color: #f8f9fa;
  border-color: #dadce0;
  color: #3c4043;
}

.ebay-link-button:hover {
  background-color: #f1f3f4;
}

.amazon-link-button {
  composes: button-base;
  background-color: #f8f9fa;
  border-color: #dadce0;
  color: #3c4043;
}

.amazon-link-button:hover {
  background-color: #f1f3f4;
}

.debug-button {
  background-color: #f1f3f4;
  color: #666;
  border: 1px solid #dadce0;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  margin-top: 5px;
  max-width: 120px;
  transition: all 0.2s ease;
}

.debug-button:hover {
  background-color: #e8eaed;
}

.amazon-button {
  margin-top: 15px;
}

.input-spacer {
  width: 120px;
  margin-right: 15px;
  flex-shrink: 0;
}

.optional-text {
  font-size: 0.75em;
  color: #5f6368;
  font-style: italic;
}

.amazon-logo {
  max-width: 70px;
  height: auto;
  object-fit: contain;
}

.input-field {
  flex: 1;
}

.input-field label {
  display: block;
  margin-bottom: 3px;
  font-weight: 500;
  color: #3c4043;
  font-size: 0.9rem;
}

.input-field input {
  width: 100%;
  height: 36px;
  box-sizing: border-box;
  padding: 6px 10px;
  border: 1px solid #dadce0;
  border-radius: 6px;
  font-size: 14px;
  transition: border 0.2s ease;
}

.input-field input:focus {
  border-color: #4285F4;
  outline: none;
  box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2);
}

.calculate-button {
  width: 100%;
  height: 40px;
  background-color: #4285F4;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  margin-top: 8px;
  margin-bottom: 10px;
  transition: background-color 0.2s ease;
}

.calculate-button:hover {
  background-color: #1a73e8;
}

.calculate-button:active {
  background-color: #1967d2;
}

.calculate-button:disabled {
  background-color: #c5c5c5;
  cursor: not-allowed;
}

/* Book info section */
.book-info {
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  width: 100%;
  box-sizing: border-box;
}

.book-image {
  width: 100px;
  height: 140px;
  background-color: #f1f3f4;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e0e0e0;
}

.book-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0; /* Prevent text overflow */
}

.book-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #202124;
  margin-bottom: 6px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  line-height: 1.3;
}

.book-author {
  font-size: 1rem;
  color: #5f6368;
  margin-bottom: 8px;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.book-isbn {
  font-size: 0.9rem;
  color: #5f6368;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.scan-button {
  background-color: #34a853; /* Green color for more visibility */
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.scan-button:hover {
  background-color: #2d9449;
  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
  transform: translateY(-1px);
}

.instant-reject-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
  margin-top: 20px;
}

.lowest-price-alert {
  margin-top: 10px;
  padding: 12px 15px;
  background-color: #fce8e6;
  border-left: 4px solid #ea4335;
  color: #c5221f;
  font-weight: 500;
  border-radius: 4px;
}

.verdict-reason {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 10px;
  font-size: 0.9rem;
  line-height: 1.4;
  color: #3c4043;
  margin-top: 8px;
}

/* Loading and error states */
.loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  font-size: 1.2rem;
  font-weight: 500;
  color: #4285F4;
}

.error-message {
  background-color: #fce8e6;
  color: #c5221f;
  padding: 15px;
  border-radius: 8px;
  margin: 20px;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .metrics-banner {
    flex-direction: column;
  }
  
  .metric {
    width: 100%;
  }
  
  .input-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .button-container {
    width: 100%;
    margin-bottom: 8px;
    margin-right: 0;
  }
  
  .ebay-link-button, .amazon-link-button {
    width: 100%;
    height: 32px;
  }
  
  .book-info {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  
  .book-details {
    align-items: center;
  }
  
  .scan-button {
    margin-top: 10px;
    width: 100%;
  }
  
  .verdict-label {
    font-size: 1.2rem;
  }
  
  .results-container {
    padding: 8px;
  }
  
  .two-column-layout {
    flex-direction: column-reverse;
  }
  
  .column-right {
    width: 100%;
  }
  
  .column-left {
    width: 100%;
  }
  
  .input-field {
    width: 100%;
  }
}

/* Small mobile devices */
@media (max-width: 480px) {
  .verdict-banner {
    padding: 8px 12px;
  }
  
  .verdict-label {
    font-size: 1.1rem;
  }
  
  .metric {
    padding: 6px;
    margin-bottom: 8px;
  }
  
  .book-image {
    width: 70px;
    height: 100px;
  }
  
  .manual-input-container {
    padding: 10px;
  }
  
  .manual-input-container h3 {
    font-size: 1rem;
    padding-bottom: 5px;
    margin-bottom: 5px;
  }
  
  .instructions {
    font-size: 0.8rem;
    margin-bottom: 8px;
  }
  
  .input-field label {
    font-size: 0.85rem;
  }
  
  .input-field input {
    height: 34px;
  }
}

/* Results container and content wrapper */
.results-container {
  padding: 15px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.results-content-wrapper {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding-right: 20px; /* Add padding for scrollbar */
  scrollbar-width: thin; /* Firefox */
  scrollbar-color: #dadce0 #f8f9fa; /* Firefox */
}

.results-content-wrapper::-webkit-scrollbar {
  width: 8px;
}

.results-content-wrapper::-webkit-scrollbar-track {
  background: #f8f9fa;
  border-radius: 10px;
}

.results-content-wrapper::-webkit-scrollbar-thumb {
  background-color: #dadce0;
  border-radius: 10px;
  border: 2px solid #f8f9fa;
}

/* Two column layout for wider screens */
.two-column-layout {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  width: 100%;
}

.column-left {
  flex: 3;
  min-width: 300px;
}

.column-right {
  flex: 1;
  min-width: 250px;
  max-width: 300px;
}

/* Updated metrics banner for desktop */
.metrics-banner {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  background-color: #fff;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Desktop specific improvements for the input fields */
@media (min-width: 1024px) {
  .button-base {
    min-width: 140px;
    width: 140px;
    height: 42px;
    font-size: 14px;
  }
  
  .button-container {
    width: 140px;
    margin-right: 20px;
  }
  
  .input-field input {
    height: 42px;
    padding: 8px 12px;
    font-size: 15px;
  }
  
  .input-field label {
    font-size: 1rem;
    margin-bottom: 5px;
  }
  
  .calculate-button {
    height: 48px;
    font-size: 16px;
    margin-top: 15px;
  }
  
  .optional-text {
    font-size: 0.85em;
  }
  
  .instructions {
    font-size: 1rem;
    margin-bottom: 20px;
  }
  
  .manual-input-container h3 {
    font-size: 1.3rem;
    margin-bottom: 12px;
    padding-bottom: 12px;
  }
}

/* Desktop specific styles for layout components */
@media (min-width: 1024px) {
  .metrics-banner {
    gap: 20px;
    padding: 20px;
  }
  
  .metric {
    padding: 15px;
  }
  
  .metric .value {
    font-size: 1.2rem;
  }
  
  .book-image {
    width: 120px;
    height: 160px;
  }
  
  .book-info {
    padding: 20px;
  }
  
  .book-title {
    font-size: 1.3rem;
  }
  
  .book-author {
    font-size: 1.1rem;
  }
  
  .verdict-banner {
    padding: 20px 25px;
    margin-bottom: 20px;
  }
  
  .verdict-label {
    font-size: 1.6rem;
  }
  
  .manual-input-container {
    padding: 25px;
  }
  
  .input-row {
    margin-bottom: 20px;
  }
}

/* Desktop specific layout improvements */
@media (min-width: 1440px) {
  .results-container {
    max-width: 1400px;
    padding: 20px;
  }
  
  .verdict-reason {
    font-size: 1rem;
    line-height: 1.5;
    padding: 15px;
    margin-top: 12px;
  }
  
  .two-column-layout {
    gap: 30px;
  }
  
  .column-left {
    flex: 4;
  }
  
  .column-right {
    flex: 1;
  }
  
  .metric span:first-child {
    font-size: 0.85rem;
    margin-bottom: 6px;
  }
  
  .metric .value {
    font-size: 1.3rem;
  }
  
  .inventory-counts, .price-breakdown {
    font-size: 0.9em;
    margin-top: 4px;
  }
}

/* Scan button container and styling */
.scan-button-container {
  width: 100%;
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding-right: 20px; /* Match the right padding of results-content-wrapper */
  box-sizing: border-box;
}

.scan-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 52px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 17px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.scan-button:hover {
  background-color: #43a047;
  transform: translateY(-2px);
  box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
}

.scan-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Desktop-specific scan button styling */
@media (min-width: 1024px) {
  .scan-button {
    font-size: 18px;
    height: 58px;
    border-radius: 8px;
    margin-top: 15px;
  }
  
  .scan-button-container {
    margin-top: 24px;
  }
}
`;

// Define types for our mock data
// Add export to prevent "declared but never used" errors
export interface Listing {
  price: number;
  shipping: number | null;
  condition?: string;
  date?: string;
}

export interface Sale {
  price: number;
  shipping: number | null;
  date: string;
}

// Define scenario options based on the keys from MOCK_SCENARIOS
const SCENARIO_OPTIONS = Object.keys(MOCK_SCENARIOS).map(key => ({
  key: key as keyof typeof MOCK_SCENARIOS,
  // Attempt to get description for label, fallback to key
  label: MOCK_SCENARIOS[key as keyof typeof MOCK_SCENARIOS]?.description || key
}));

// Mock listing data


type ScenarioKey = typeof SCENARIO_OPTIONS[number]['key'];

// Add this helper function near the top of the file with other utility functions
const safeOpenExternalLink = (url: string) => {
  // This pattern forces links to open in system browser or app
  // instead of in the PWA's in-app browser view
  const isIOSStandalone = 'standalone' in window.navigator && (window.navigator as any).standalone;
  if (isIOSStandalone || window.matchMedia('(display-mode: standalone)').matches) {
    // If in standalone mode (PWA installed)
    window.location.href = url;
    // Prevent blank screen on return by forcing reload after a delay
    setTimeout(() => {
      window.location.reload();
    }, 100);
  } else {
    // Regular browser mode - open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

function App() {
  const [isbn, setIsbn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SourcingVerdict | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<ScenarioKey>('STRONG_EQUILIBRIUM');
  // New state variables for manual inputs
  const [lowestActivePrice, setLowestActivePrice] = useState<string>('');
  const [recentSoldPrice, setRecentSoldPrice] = useState<string>('');
  const [terapeakSales, setTerapeakSales] = useState<string>('');
  const [calculationInProgress, setCalculationInProgress] = useState(false);
  // Add state for Amazon inputs
  const [amazonBSR, setAmazonBSR] = useState<string>('');
  const [amazonReviews, setAmazonReviews] = useState<string>('');
  // Mark unused state with underscore prefix to avoid TypeScript errors
  const [_amazonPrice, _setAmazonPrice] = useState<string>('');
  // Add state for instant reject
  const [minPriceThreshold, setMinPriceThreshold] = useState<number>(MIN_PRICE_THRESHOLD);
  const [isInstantRejectEnabled, setIsInstantRejectEnabled] = useState<boolean>(true);
  // Mark as unused with underscore prefix
  const [_isCheckingLowestPrice, setIsCheckingLowestPrice] = useState<boolean>(false);
  const [lowestListedPrice, setLowestListedPrice] = useState<number | null>(null);
  // Add state variables for used and new counts
  const [usedCount, setUsedCount] = useState<number>(0);
  const [newCount, setNewCount] = useState<number>(0);
  // Add state variables for price breakdown
  const [basePrice, setBasePrice] = useState<number | null>(null);
  const [shippingCost, setShippingCost] = useState<number | null>(null);
  // Add state variable for item condition
  const [itemCondition, setItemCondition] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // Scroll to top when search results appear OR calculation finishes
  useEffect(() => {
    // Check if we have results AND calculation is NOT in progress
    if (searchResult && !calculationInProgress) {
      // First, immediate direct scroll without animation
      window.scrollTo(0, 0);
      
      // Then a small delay to ensure rendering is complete before smooth scrolling
      const timer = setTimeout(() => {
        // Try both document and window scroll methods for maximum compatibility
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth' // Optional: adds a smooth scrolling effect
        });
      }, 200); // Increased delay to 200ms for better reliability

      return () => clearTimeout(timer); // Cleanup timer on unmount or re-run
    }
  }, [searchResult, calculationInProgress]);

  // Function to check eBay for lowest price
  const checkEbayLowestPrice = async (bookIsbn: string, bookTitle: string, author: string): Promise<number | null> => {
    setIsCheckingLowestPrice(true);
    
    try {
      // Format the search term: Title + Author
      const searchTerm = `${bookTitle} ${author}`.trim();
      console.log(`Checking lowest price for "${searchTerm}" (ISBN: ${bookIsbn})`);
      
      try {
        // Make API call to our backend server on port 3001
        const apiUrl = `${import.meta.env.VITE_API_URL}/api/ebay/search?title=${encodeURIComponent(bookTitle)}&author=${encodeURIComponent(author)}`;
        console.log(`(Frontend) Calling API: ${apiUrl}`);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("eBay API Response:", data);
        
        // The backend would return the lowest price and other details
        if (data.lowestPrice !== null && data.lowestPrice !== undefined) {
          setLowestListedPrice(data.lowestPrice);
          // Set the base price and shipping cost
          setBasePrice(data.basePrice || 0);
          setShippingCost(data.shippingCost || 0);
          // Set the item condition
          setItemCondition(data.condition || 'Not specified');
          // Set the used and new counts from the API response
          setUsedCount(data.usedCount || 0);
          setNewCount(data.newCount || 0);
          console.log(`Found lowest price: $${data.lowestPrice} (Base: $${data.basePrice}, Shipping: $${data.shippingCost}, Condition: ${data.condition}, Used: ${data.usedCount}, New: ${data.newCount})`);
          return data.lowestPrice;
        } else {
          console.log("No listings found");
          // Reset counts and prices when no listings found
          setUsedCount(0);
          setNewCount(0);
          setBasePrice(null);
          setShippingCost(null);
          setItemCondition(null);
          return null;
        }
      } catch (error) {
        console.error("Error calling eBay API:", error);
        
        // FALLBACK TO SIMULATION FOR TESTING
        console.warn("Falling back to simulated data for development");
        // Simulate a random price between $5 and $30 for demo purposes
        const mockBasePrice = (Math.random() * 20 + 5).toFixed(2);
        const mockShippingCost = (Math.random() * 5).toFixed(2);
        const mockTotalPrice = parseFloat(mockBasePrice) + parseFloat(mockShippingCost);
        
        // Also simulate used and new counts and a condition
        const mockUsedCount = Math.floor(Math.random() * 10) + 1;
        const mockNewCount = Math.floor(Math.random() * 5);
        const conditions = ['New', 'Like New', 'Very Good', 'Good', 'Acceptable'];
        const mockCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        setLowestListedPrice(mockTotalPrice);
        setBasePrice(parseFloat(mockBasePrice));
        setShippingCost(parseFloat(mockShippingCost));
        setItemCondition(mockCondition);
        setUsedCount(mockUsedCount);
        setNewCount(mockNewCount);
        console.log(`Simulated lowest price: $${mockTotalPrice} (Base: $${mockBasePrice}, Shipping: $${mockShippingCost}, Condition: ${mockCondition}, Used: ${mockUsedCount}, New: ${mockNewCount})`);
        
        return mockTotalPrice;
      }
    } catch (error) {
      console.error("Error checking eBay lowest price:", error);
      return null;
    } finally {
      setIsCheckingLowestPrice(false);
    }
  };

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSearchResult(null); // Clear previous results on new search
    setLowestListedPrice(null); // Reset lowest price
    
    try {
      // --- Call the backend API to fetch book details only --- 
      // Use the environment variable for the API URL
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/search?isbn=${encodeURIComponent(isbn)}&scenario=${encodeURIComponent(selectedScenario)}`;
      console.log(`(Frontend) Calling API: ${apiUrl}`);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        // Try to parse error from backend, or use default
        let errorMessage = `Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // Ignore if response body isn't JSON
        }
        throw new Error(errorMessage);
      }

      const result = await response.json(); // Parse the JSON response
      console.log("(Frontend) Backend Response:", result);

      // --- Create an initial result object with book details ---
      const initialVerdict: SourcingVerdict = {
        verdict: "CHECK BOOK ⚠️" as any, // Use as any to allow this non-standard verdict
        decidingStage: 0,
        decidingReason: "Please enter market data to evaluate this book",
        buyCost: 8.99, // Default buy cost 
        sellingPrice: 0,
        profit: 0,
        roi: 0,
        equilibriumDetails: null,
        terapeakDetails: null,
        bookDetails: result.bookDetails,
        manualInputs: {
          lowestActivePrice: null,
          recentSoldPrice: null,
          terapeakSales: null
        }
      };
      
      setSearchResult(initialVerdict);
      
      // Reset manual input fields
      setLowestActivePrice('');
      setRecentSoldPrice('');
      setTerapeakSales('');
      setCalculationInProgress(false);
      
      // If instant reject is enabled, check eBay for lowest price
      if (isInstantRejectEnabled && result.bookDetails) {
        const title = result.bookDetails.title 
          ? result.bookDetails.title.split(':')[0].trim() 
          : '';
        const author = result.bookDetails.authors && result.bookDetails.authors.length > 0 
          ? result.bookDetails.authors[0] 
          : '';
          
        console.log(`Checking eBay price for "${title}" by "${author}"`);
        
        if (title && author) {
          const lowestPrice = await checkEbayLowestPrice(isbn, title, author);
          
          // If price is below threshold, update verdict with instant reject
          if (lowestPrice !== null && lowestPrice < minPriceThreshold) {
            const updatedVerdict: SourcingVerdict = {
              ...initialVerdict,
              verdict: "REJECT",
              decidingStage: -1, // Special stage for instant reject
              decidingReason: `INSTANT REJECT: Lowest price on eBay AU is $${lowestPrice.toFixed(2)}, which is below your threshold of $${minPriceThreshold.toFixed(2)}.`
            };
            
            setSearchResult(updatedVerdict);
          } else if (lowestPrice !== null) {
            console.log(`Book passes price threshold check: $${lowestPrice.toFixed(2)} >= $${minPriceThreshold.toFixed(2)}`);
          }
        } else {
          console.warn('Missing title or author for eBay price check');
        }
      }

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
    } finally {
      setLoading(false);
    }
  };

  // Mark unused function with comment
  // This function exists for future use but isn't currently called
  const handleScenarioChange = (_e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedScenario(_e.target.value as ScenarioKey);
  };

  const handleScanAgain = () => {
    setSearchResult(null);
    setIsbn('');
    setLowestListedPrice(null);
  };

  // New function to calculate verdict based on manual inputs
  const calculateVerdict = () => {
    if (!searchResult) return;
    
    setCalculationInProgress(true);
    
    // Parse input values - now these are counts, not prices
    const activeCount = lowestActivePrice ? parseInt(lowestActivePrice) : null;
    const soldCount = recentSoldPrice ? parseInt(recentSoldPrice) : null;
    const terapeak = terapeakSales ? parseInt(terapeakSales) : null;
    
    // Initial STR calculation and Terapeak adjustment
    let str: number | null = null;
    let adjustedStr: number | null = null;
    let pTP: number | null = null;
    
    // Calculate Terapeak probability if available
    if (terapeak !== null) {
      pTP = 1 - Math.exp(-terapeak/6);
      console.log(`Terapeak sales: ${terapeak}, Probability: ${(pTP * 100).toFixed(1)}%`);
    }
    
    // CLEAN IMPLEMENTATION WITH CLEAR PATHS
    
    // First calculate raw STR if we have active and sold counts
    if (activeCount !== null && activeCount > 0 && soldCount !== null) {
      str = soldCount / activeCount;
      if (str > 1) str = 1; // Cap at 100%
      console.log(`Raw STR: ${(str * 100).toFixed(1)}%`);
    }
    
    // Now handle blending with Terapeak if we have both market and terapeak data
    if (str !== null && pTP !== null && terapeak !== null && activeCount !== null && soldCount !== null) {
      // CORE BLENDING FORMULA
      
      // Calculate Terapeak boost and confidence factors
      const terapeakStrengthBoost = Math.min(Math.log10(terapeak) * 3, 10);
      const baseConfidence = 7 + terapeakStrengthBoost;
      console.log(`Terapeak boost: ${terapeakStrengthBoost.toFixed(1)}, Base confidence: ${baseConfidence.toFixed(1)}`);
      
      // Calculate weights with dynamic confidence
      const totalMarketData = activeCount + soldCount;
      const terapeakWeight = baseConfidence / (baseConfidence + totalMarketData);
      const marketWeight = totalMarketData / (baseConfidence + totalMarketData);
      console.log(`Terapeak weight: ${(terapeakWeight * 100).toFixed(1)}%, Market weight: ${(marketWeight * 100).toFixed(1)}%`);
      
      // Adjust market STR with smoothing for small sample sizes
      const confidenceAdjustment = Math.min(1, soldCount * 0.25);
      const adjustedMarketSTR = (soldCount + confidenceAdjustment) / (activeCount + confidenceAdjustment);
      console.log(`Raw STR: ${(str * 100).toFixed(1)}%, Adjusted market STR: ${(adjustedMarketSTR * 100).toFixed(1)}%`);
      
      // Apply enhanced blending with stronger Terapeak influence
      if (pTP > adjustedMarketSTR) {
        // If Terapeak signal is stronger, give it substantially more weight
        // But scale the multiplier based on Terapeak sales volume for more accuracy
        let terapeakMultiplier = 1.2; // Default conservative multiplier for low sales count
        
        // Scale the multiplier based on Terapeak sales volume
        if (terapeak >= 8) {
          terapeakMultiplier = 1.8; // Strong weight for high sales count (8+)
        } else if (terapeak >= 5) {
          terapeakMultiplier = 1.5; // Moderate weight for medium sales count (5-7)
        } // else keep default 1.2 for 1-4 sales
        
        adjustedStr = (terapeakWeight * terapeakMultiplier * pTP) + (marketWeight * 0.4 * adjustedMarketSTR);
        console.log(`Using Terapeak-dominant blend with ${terapeakMultiplier.toFixed(1)}x multiplier: ${(terapeakWeight * terapeakMultiplier * 100).toFixed(1)}% Terapeak + ${(marketWeight * 0.4 * 100).toFixed(1)}% market`);
      } else {
        // If market data is stronger, still respect the Terapeak
        adjustedStr = (terapeakWeight * pTP) + (marketWeight * adjustedMarketSTR);
        console.log(`Using balanced blend: ${(terapeakWeight * 100).toFixed(1)}% Terapeak + ${(marketWeight * 100).toFixed(1)}% market`);
      }
      
      // Cap at 100%
      if (adjustedStr > 1) adjustedStr = 1;
      console.log(`Final blended probability: ${(adjustedStr * 100).toFixed(1)}%`);
    }
    // Handle case where we only have Terapeak data
    else if ((activeCount === null || activeCount === 0) && pTP !== null) {
      // Use Terapeak directly as our probability
      adjustedStr = pTP;
      console.log(`Using Terapeak only: ${(adjustedStr * 100).toFixed(1)}%`);
    }
    // Handle case where we only have market data
    else if (str !== null && (pTP === null || terapeak === null)) {
      // Use STR directly as our probability
      adjustedStr = str;
      console.log(`Using STR only: ${(adjustedStr * 100).toFixed(1)}%`);
    }
    // Case with actives but no solds, yet having Terapeak
    else if (activeCount !== null && activeCount > 0 && (soldCount === null || soldCount === 0) && pTP !== null) {
      // Use Bayesian approach for this case
      const baseConfidence = 7;
      const terapeakWeight = baseConfidence / (baseConfidence + activeCount);
      const marketWeight = activeCount / (baseConfidence + activeCount);
      
      // For zero solds, use a confidence-adjusted STR
      const confidenceAdjustment = 1;
      const adjustedMarketSTR = confidenceAdjustment / (activeCount + confidenceAdjustment);
      
      // Weighted blend
      adjustedStr = (terapeakWeight * pTP) + (marketWeight * adjustedMarketSTR);
      console.log(`Zero-sold case: ${(terapeakWeight * 100).toFixed(1)}% Terapeak (${(pTP * 100).toFixed(1)}%) + ${(marketWeight * 100).toFixed(1)}% adjusted market (${(adjustedMarketSTR * 100).toFixed(1)}%)`);
      console.log(`Final probability: ${(adjustedStr * 100).toFixed(1)}%`);
    }
    
    // Determine verdict based on adjusted probability
    let verdict: "BUY" | "REJECT" = "REJECT";
    let decidingStage = 0;
    let decidingReason = "";
    
    if (adjustedStr !== null) {
      // We have a probability calculation
      if (adjustedStr >= STR_THRESHOLD) {
        verdict = "BUY";
        decidingStage = 2;
        
        // Generate reason based on data composition
        if (str !== null && pTP !== null) {
          // Both market and Terapeak
          if (str >= STR_THRESHOLD) {
            decidingReason = `STRONG BUY: Both STR (${(str * 100).toFixed(1)}%) and Terapeak-adjusted probability (${(adjustedStr * 100).toFixed(1)}%) exceed threshold of ${(STR_THRESHOLD * 100).toFixed(1)}%.`;
          } else {
            decidingReason = `TERAPEAK-ENHANCED BUY: Raw STR (${(str * 100).toFixed(1)}%) below threshold, but combined with ${terapeak} Terapeak sales, final probability is ${(adjustedStr * 100).toFixed(1)}%.`;
          }
        } else if (pTP !== null) {
          // Only Terapeak
          decidingReason = `BUY based on ${terapeak} Terapeak sales with ${(adjustedStr * 100).toFixed(1)}% probability.`;
        } else {
          // Only market data
          decidingReason = `BUY based on strong market data: STR of ${(adjustedStr * 100).toFixed(1)}%.`;
        }
      } else {
        verdict = "REJECT";
        decidingStage = 2;
        
        if (str !== null && pTP !== null) {
          decidingReason = `REJECT: Combined probability of ${(adjustedStr * 100).toFixed(1)}% falls below threshold of ${(STR_THRESHOLD * 100).toFixed(1)}%.`;
        } else if (pTP !== null) {
          decidingReason = `REJECT: Terapeak probability of ${(adjustedStr * 100).toFixed(1)}% falls below threshold of ${(STR_THRESHOLD * 100).toFixed(1)}%.`;
        } else {
          decidingReason = `REJECT: STR of ${(adjustedStr * 100).toFixed(1)}% falls below threshold of ${(STR_THRESHOLD * 100).toFixed(1)}%.`;
        }
      }
    } else {
      verdict = "REJECT";
      decidingStage = 0;
      decidingReason = "Insufficient data to calculate probability. Please enter either active/sold counts or Terapeak data.";
    }
    
    // Update the result
    const updatedVerdict: SourcingVerdict = {
      ...searchResult,
      verdict,
      decidingStage,
      decidingReason,
      equilibriumDetails: str !== null ? {
        probability: str,
        threshold: STR_THRESHOLD,
        passesStage1: str >= STR_THRESHOLD,
        str: str
      } : null,
      terapeakDetails: adjustedStr !== null ? {
        salesRate: adjustedStr,
        threshold: STR_THRESHOLD,
        passesStage2: adjustedStr >= STR_THRESHOLD
      } : null,
      manualInputs: {
        lowestActivePrice: activeCount,
        recentSoldPrice: soldCount,
        terapeakSales: terapeak
      }
    };
    
    setSearchResult(updatedVerdict);
    setCalculationInProgress(false);
  };

  // New function to handle Amazon BSR & Reviews calculation for Stage 3
  const calculateAmazonStage3 = () => {
    if (!searchResult) return;
    
    // Get the current verdict state
    const currentVerdict = { ...searchResult };
    const bsr = parseInt(amazonBSR || '0');
    const reviews = parseInt(amazonReviews || '0');
    
    // Only proceed if we have BSR and reviews
    if (bsr <= 0 || reviews <= 0) {
      setError("Please enter valid Amazon BSR and Review count");
      return;
    }
    
    // IMPROVED MATHEMATICAL MODEL FOR AMAZON STAGE 3
    
    // 1. Base BSR thresholds by popularity tier - reduced from 500,000 to 250,000
    const BSR_THRESHOLD_BASE = 250000;
    
    // 2. Calculate review strength using sigmoid-inspired function
    // This creates a more natural S-curve that prevents extreme values
    // and provides more consistent results across the review spectrum
    const reviewStrength = 2 / (1 + Math.exp(-0.3 * Math.log10(reviews))) - 0.5;
    
    // 3. Apply review strength to BSR threshold with diminishing returns
    // Higher reviews increase threshold but with a natural ceiling
    const adjustedBSRThreshold = BSR_THRESHOLD_BASE * (1 + reviewStrength);
    
    // 4. Hard cap check - immediately reject if BSR exceeds 250,000
    if (bsr > 250000) {
      const updatedVerdict: SourcingVerdict = {
        ...currentVerdict,
        verdict: "REJECT",
        decidingStage: 3,
        decidingReason: `AMAZON STAGE 3 HARD FAIL: BSR of ${bsr.toLocaleString()} exceeds hard cap of 250,000. Book too slow-selling regardless of reviews.`,
        equilibriumDetails: currentVerdict.equilibriumDetails,
        terapeakDetails: currentVerdict.terapeakDetails,
        manualInputs: {
          ...currentVerdict.manualInputs,
          amazonBSR: bsr,
          amazonReviews: reviews
        }
      };
      
      setSearchResult(updatedVerdict);
      return;
    }
    
    // Continue with regular calculation for BSR <= 250,000
    // 5. Calculate BSR quality score (0-1 scale) using a sigmoid function
    // This creates a smooth transition between "good" and "bad" BSRs
    // rather than a hard cutoff
    const bsrRatio = bsr / adjustedBSRThreshold;
    const bsrQuality = 1 / (1 + Math.exp(5 * (bsrRatio - 0.8)));
    
    // 6. For debugging/display - calculate % of threshold
    const percentOfThreshold = (bsr / adjustedBSRThreshold) * 100;
    
    // 7. Make final decision - BSR quality score threshold of 0.6
    // This allows some books slightly above the threshold to still pass
    // if they're close enough
    const qualityThreshold = 0.6;
    const passesAmazonCheck = bsrQuality >= qualityThreshold;
    
    let verdict: "BUY" | "REJECT" = passesAmazonCheck ? "BUY" : "REJECT";
    let decidingReason = "";
    
    // Decision reason with detailed statistics
    if (passesAmazonCheck) {
      decidingReason = `AMAZON STAGE 3 PASS: BSR quality score ${(bsrQuality * 100).toFixed(1)}% (threshold: ${(qualityThreshold * 100)}%). BSR ${bsr.toLocaleString()} is ${percentOfThreshold.toFixed(1)}% of adjusted threshold ${Math.round(adjustedBSRThreshold).toLocaleString()}. ${reviews} reviews provides ${(reviewStrength * 100).toFixed(0)}% threshold boost.`;
    } else {
      decidingReason = `AMAZON STAGE 3 FAIL: BSR quality score ${(bsrQuality * 100).toFixed(1)}% (threshold: ${(qualityThreshold * 100)}%). BSR ${bsr.toLocaleString()} is ${percentOfThreshold.toFixed(1)}% of adjusted threshold ${Math.round(adjustedBSRThreshold).toLocaleString()}. ${reviews} reviews provides ${(reviewStrength * 100).toFixed(0)}% threshold boost.`;
    }
    
    // Update the verdict
    const updatedVerdict: SourcingVerdict = {
      ...currentVerdict,
      verdict,
      decidingStage: 3,
      decidingReason,
      equilibriumDetails: currentVerdict.equilibriumDetails,
      terapeakDetails: currentVerdict.terapeakDetails,
      manualInputs: {
        ...currentVerdict.manualInputs,
        amazonBSR: bsr,
        amazonReviews: reviews
      }
    };
    
    setSearchResult(updatedVerdict);
  };

  // New combined calculation function that handles all inputs
  const calculateCombinedVerdict = () => {
    if (!searchResult) return;
    
    // Immediate scroll to top at the beginning of calculation
    window.scrollTo(0, 0);
    topRef.current?.scrollIntoView();
    
    setCalculationInProgress(true);
    
    // Parse input values
    const bsr = amazonBSR ? parseInt(amazonBSR) : null;
    const reviews = amazonReviews ? parseInt(amazonReviews) : null;
    
    // First try the primary calculation (eBay/Terapeak)
    calculateVerdict();
    
    // Then check if we should do Amazon calculation
    if (bsr && reviews) {
      // If STR and Terapeak failed, and we have Amazon data, try Amazon Stage 3
      const currentVerdict = searchResult.verdict;
      // Wait a moment for the first calculation to complete
      setTimeout(() => {
        if (currentVerdict === "REJECT") {
          calculateAmazonStage3();
        }
        setCalculationInProgress(false);
        
        // Multiple scrolling attempts with delays
        window.scrollTo(0, 0);
        topRef.current?.scrollIntoView();
        setTimeout(() => {
          window.scrollTo(0, 0);
          topRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }, 100);
    } else {
      setCalculationInProgress(false);
      
      // Multiple scrolling attempts with delays
      window.scrollTo(0, 0);
      topRef.current?.scrollIntoView();
      setTimeout(() => {
        window.scrollTo(0, 0);
        topRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  // Render the metrics banner
  function renderMetricsBanner(activeCount: number, soldCount: number, str: number, teapeakSales: number | null, lowestPrice: number | null, _verdict: string, finalProbability: number | null, _stage: string, basePrice: number | null, shippingCost: number | null, itemCondition: string | null, usedCount: number, newCount: number) {
    return (
      <div className="metrics-banner">
        {lowestPrice && (
          <div className="metric">
            <span>Lowest Price</span>
            <div className="value">${lowestPrice.toFixed(2)}</div>
            <div className="price-breakdown">
              {basePrice ? `$${basePrice.toFixed(2)}` : '$0.00'} + {shippingCost ? `$${shippingCost.toFixed(2)} shipping` : 'free shipping'}, {itemCondition || 'Unknown'} condition
            </div>
            <div className="inventory-counts">
              In Australia: {usedCount} used, {newCount} new
            </div>
          </div>
        )}
        
        <div className="metric">
          <span>Inventory</span>
          <div className="value">{activeCount} active / {soldCount} sold</div>
          <div className="inventory-counts">
            Active listings and sold items in the last 90 days
          </div>
        </div>
        
        <div className="metric">
          <span>Sales to Ratio (STR)</span>
          <div className="value">{str.toFixed(2)}</div>
          <div className="inventory-counts">
            Ratio of sold items to active listings
          </div>
        </div>
        
        {teapeakSales !== null && (
          <div className="metric">
            <span>Terapeak Sales</span>
            <div className="value">{teapeakSales}</div>
            <div className="inventory-counts">
              Historical sales data from the last year
            </div>
          </div>
        )}
        
        {finalProbability !== null && (
          <div className="metric">
            <span>Final Probability</span>
            <div className="value">{(finalProbability * 100).toFixed(1)}%</div>
            <div className="inventory-counts">
              Combined probability after all adjustments
            </div>
          </div>
        )}
      </div>
    );
  }

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
                  />
                </div>
                
                <div className="instant-reject-section">
                  <h3>Instant Reject Settings</h3>
                  
                  <div className="checkbox-container">
                    <input
                      id="enable-instant-reject"
                      type="checkbox"
                      checked={isInstantRejectEnabled}
                      onChange={(e) => setIsInstantRejectEnabled(e.target.checked)}
                    />
                    <label htmlFor="enable-instant-reject">
                      Auto-reject books below price threshold
                    </label>
                  </div>
                  
                  <div className="threshold-input-container">
                    <label htmlFor="min-price-threshold">Minimum Acceptable Price:</label>
                    <div className="price-input-container">
                      <span className="currency-symbol">$</span>
                      <input
                        id="min-price-threshold"
                        type="number"
                        step="0.01"
                        min="0"
                        value={minPriceThreshold}
                        onChange={(e) => setMinPriceThreshold(Number(e.target.value))}
                        className="price-input"
                        disabled={!isInstantRejectEnabled}
                      />
                    </div>
                    <div className="price-helper-text">
                      Books priced below this threshold will be automatically rejected
                    </div>
                  </div>
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
        <div className="results-container">
          <style>{amazonSectionStyles}</style>
          <div className="results-content-wrapper">
            <div ref={topRef} className={`verdict-banner ${searchResult.verdict === "BUY" ? "buy" : searchResult.verdict === "REJECT" ? "reject" : "check"}`}>
              <div className="verdict-label">{searchResult.verdict}</div>
              <div>
                {searchResult.terapeakDetails?.salesRate !== null && searchResult.terapeakDetails?.salesRate !== undefined ? (
                  <>Final Probability: <span className="str-value">{(searchResult.terapeakDetails.salesRate * 100).toFixed(1)}%</span></>
                ) : (
                  <>Sales to Ratio: <span className="str-value">{(searchResult.equilibriumDetails?.probability || 0).toFixed(2)}</span></>
                )}
                {' '}&bull;{' '}
                Threshold: <span className="threshold-value">{(STR_THRESHOLD * 100).toFixed(1)}%</span>
              </div>
            </div>
            
            <div className="scan-again-container-top">
              <button 
                className="scan-again-button-large"
                onClick={handleScanAgain}
              >
                SCAN
              </button>
            </div>
            
            <div className="book-display-container">
              <div className="book-display">
                <div className="book-image">
                  {searchResult?.bookDetails?.image ? (
                    <img 
                      src={searchResult.bookDetails.image} 
                      alt={searchResult.bookDetails.title || 'Book cover'} 
                    />
                  ) : (
                    <div className="placeholder-cover">
                      <span>No Cover Available</span>
                    </div>
                  )}
                </div>
                <div className="book-info">
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
            </div>
            
            {renderMetricsBanner(
              Number(lowestActivePrice) || 0, 
              Number(recentSoldPrice) || 0, 
              searchResult.equilibriumDetails?.str || 0,
              searchResult.manualInputs?.terapeakSales || null, 
              lowestListedPrice, 
              searchResult.verdict, 
              searchResult.terapeakDetails?.salesRate || null, 
              searchResult.decidingStage === 3 ? 'Amazon Stage 3' : 'STR',
              basePrice,
              shippingCost,
              itemCondition,
              usedCount,
              newCount
            )}
            
            <div className="two-column-layout">
              <div className="column-left">
                <div className="manual-input-container">
                  <h3>Manual Data Entry</h3>
                  <p className="instructions">Enter active/sold counts OR just Terapeak data to calculate STR</p>
                  
                  <div className="manual-input-section mobile-optimized">
                    <div className="input-row">
                      <div className="button-container">
                        <button 
                          className="ebay-link-button mobile-button"
                          onClick={() => {
                            // Get main title (before colon) and author for search
                            const mainTitle = searchResult?.bookDetails?.title 
                              ? searchResult.bookDetails.title.split(':')[0].trim() 
                              : '';
                            const author = searchResult?.bookDetails?.authors?.length 
                              ? searchResult.bookDetails.authors[0] 
                              : '';
                            const searchTerm = `${mainTitle} ${author}`.trim();
                            safeOpenExternalLink(`https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(searchTerm)}&_sacat=0&_from=R40&rt=nc&LH_PrefLoc=1`);
                          }}
                        >
                          View Active
                        </button>
                      </div>
                      <div className="input-field mobile-field floating-label-container">
                        <input
                          id="active-price"
                          type="number"
                          min="1"
                          step="1"
                          value={lowestActivePrice}
                          onChange={(e) => setLowestActivePrice(e.target.value)}
                          placeholder=" "
                          className="mobile-input"
                        />
                        <label htmlFor="active-price">Active Listings Count:</label>
                      </div>
                    </div>
                    
                    <div className="input-row">
                      <div className="button-container">
                        <button 
                          className="ebay-link-button mobile-button"
                          onClick={() => {
                            // Get main title (before colon) and author for search
                            const mainTitle = searchResult?.bookDetails?.title 
                              ? searchResult.bookDetails.title.split(':')[0].trim() 
                              : '';
                            const author = searchResult?.bookDetails?.authors?.length 
                              ? searchResult.bookDetails.authors[0] 
                              : '';
                            const searchTerm = `${mainTitle} ${author}`.trim();
                            safeOpenExternalLink(`https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(searchTerm)}&_sacat=0&_from=R40&LH_Sold=1&LH_Complete=1&rt=nc&LH_PrefLoc=1`);
                          }}
                        >
                          View Sold
                        </button>
                      </div>
                      <div className="input-field mobile-field floating-label-container">
                        <input
                          id="sold-price"
                          type="number"
                          min="0"
                          step="1"
                          value={recentSoldPrice}
                          onChange={(e) => setRecentSoldPrice(e.target.value)}
                          placeholder=" "
                          className="mobile-input"
                        />
                        <label htmlFor="sold-price">Sold Items Count:</label>
                      </div>
                    </div>
                    
                    <div className="input-row">
                      <div className="button-container">
                        <button 
                          className="ebay-link-button mobile-button"
                          onClick={() => {
                            // Get main title (before colon) and author for search
                            const mainTitle = searchResult?.bookDetails?.title 
                              ? searchResult.bookDetails.title.split(':')[0].trim() 
                              : '';
                            const author = searchResult?.bookDetails?.authors?.length 
                              ? searchResult.bookDetails.authors[0] 
                              : '';
                            const searchTerm = `${mainTitle} ${author}`.trim();
                            
                            // Calculate date parameters for Terapeak
                            const endDate = new Date().getTime();
                            const startDate = endDate - (1095 * 24 * 60 * 60 * 1000); // 1095 days in milliseconds
                            
                            safeOpenExternalLink(`https://www.ebay.com.au/sh/research?marketplace=EBAY-AU&keywords=${encodeURIComponent(searchTerm)}&dayRange=1095&endDate=${endDate}&startDate=${startDate}&categoryId=0&offset=0&limit=50&tabName=SOLD&tz=Australia%2FMelbourne`);
                          }}
                        >
                          Check Terapeak
                        </button>
                      </div>
                      <div className="input-field mobile-field floating-label-container">
                        <input
                          id="terapeak-sales"
                          type="number"
                          min="0"
                          step="1"
                          value={terapeakSales}
                          onChange={(e) => setTerapeakSales(e.target.value)}
                          placeholder=" "
                          className="mobile-input"
                        />
                        <label htmlFor="terapeak-sales">3-Year Terapeak Sales: <span className="optional-text">(can be used alone)</span></label>
                      </div>
                    </div>
                    
                    <div className="input-row">
                      <div className="button-container">
                        <div style={{ width: 110, height: 30 }}></div>
                      </div>
                      <div className="input-field mobile-field floating-label-container">
                        <input
                          id="amazon-bsr"
                          type="number"
                          min="1"
                          step="1"
                          value={amazonBSR}
                          onChange={(e) => setAmazonBSR(e.target.value)}
                          placeholder=" "
                          className="mobile-input"
                        />
                        <label htmlFor="amazon-bsr">Amazon BSR: <span className="optional-text">(optional stage 3)</span></label>
                      </div>
                    </div>
                    
                    <div className="input-row">
                      <div className="button-container">
                        <button 
                          className="amazon-link-button mobile-button"
                          onClick={() => safeOpenExternalLink(`https://www.amazon.com.au/s?k=${encodeURIComponent(isbn)}`)}
                        >
                          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/2560px-Amazon_logo.svg.png" alt="Amazon" className="amazon-logo" />
                        </button>
                      </div>
                      <div className="input-field mobile-field floating-label-container">
                        <input
                          id="amazon-reviews"
                          type="number"
                          min="0"
                          step="1"
                          value={amazonReviews}
                          onChange={(e) => setAmazonReviews(e.target.value)}
                          placeholder=" "
                          className="mobile-input"
                        />
                        <label htmlFor="amazon-reviews">Amazon Review Count: <span className="optional-text">(optional stage 3)</span></label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mobile-calculate-wrapper">
                  <button 
                      className="calculate-button mobile-calculate"
                      onClick={(_e) => {
                        // First do an immediate scroll to top
                        window.scrollTo(0, 0);
                        topRef.current?.scrollIntoView();
                        // Then trigger calculation
                        setTimeout(() => calculateCombinedVerdict(), 50);
                      }}
                    disabled={calculationInProgress}
                  >
                    {calculationInProgress ? 'Calculating...' : 'Calculate Verdict'}
                  </button>
                  </div>
                  
                  {searchResult.decidingReason && (
                    <div className="verdict-reason">
                      {searchResult.decidingReason}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="column-right">
                {/* Book Info section removed as requested */}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {loading && <div className="loading">Analyzing market data...</div>}
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
