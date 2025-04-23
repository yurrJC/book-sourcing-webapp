import { useState, FormEvent, ChangeEvent, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import './App.css';
import './ui-enhancements.css';
import { SourcingVerdict } from './types';
import { MOCK_SCENARIOS } from './lib/sourcing-engine';

// Constants
const STR_THRESHOLD = 0.6; // Threshold for STR calculations (Changed from 0.7)
const MIN_PRICE_THRESHOLD = 15.00; // Minimum acceptable price in AUD
// Removed EBAY_FEES from here, will define inside App

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
  console.log(`Opening external link: ${url}`);
  
  // Simple direct approach - no confirmation modals or fancy techniques
  try {
    // Use rel="noopener" technique with a hidden anchor
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    
    // Hide the element
    a.style.display = 'none';
    document.body.appendChild(a);
    
    // Trigger click with a small delay
    setTimeout(() => {
      a.click();
      
      // Clean up the element after click
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 100);
    }, 10);
  } catch (error) {
    console.error('Error opening link', error);
    
    // Fallback - direct window.open
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (fallbackError) {
      console.error('Fallback error', fallbackError);
    }
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
  // Add ref for ISBN input field
  const isbnInputRef = useRef<HTMLInputElement>(null);
  // Add state to track if we've shown the results screen
  const [hasViewedResults, setHasViewedResults] = useState(false);
  // Add state for Amazon inputs
  const [amazonBSR, setAmazonBSR] = useState<string>('');
  const [amazonReviews, setAmazonReviews] = useState<string>('');
  // Add state for instant reject
  const [minPriceThreshold, setMinPriceThreshold] = useState("15.00");
  const [isInstantRejectEnabled, setIsInstantRejectEnabled] = useState(true);
  // Reinstate removed state variables needed for price checking
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
  // Add state to track currently focused input
  const [activeInput, setActiveInput] = useState<string | null>(null);
  // Add state for front page keyboard
  const [frontPageKeyboardVisible, setFrontPageKeyboardVisible] = useState(false);

  // Define eBay fees constant inside the App component
  const EBAY_FEES = 0.15; // Set to 15%

  // Function to handle numeric keypad button presses
  const handleNumericInput = (value: string) => {
    if (!activeInput) return;
    
    // Handle different input fields
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
    } else if (activeInput === 'min-price-threshold') {
      // Handle decimal point specially for price input
      if (value === '.' && minPriceThreshold.includes('.')) {
        return; // Don't allow multiple decimal points
      }
      setMinPriceThreshold(prev => prev + value);
    }
  };

  // Function to handle backspace on the numeric keypad
  const handleBackspace = () => {
    if (!activeInput) return;
    
    // Handle different input fields
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
    } else if (activeInput === 'min-price-threshold') {
      setMinPriceThreshold(prev => prev.slice(0, -1));
    }
  };

  // Function to clear the active input
  const handleClear = () => {
    if (!activeInput) return;
    
    // Handle different input fields
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
    } else if (activeInput === 'min-price-threshold') {
      setMinPriceThreshold('');
    }
  };

  // Function to add decimal point
  const handleDecimalPoint = () => {
    if (!activeInput || activeInput !== 'min-price-threshold') return;
    
    // Only add decimal if it doesn't already exist
    if (!minPriceThreshold.includes('.')) {
      // If empty, add 0 before decimal
      if (minPriceThreshold === '') {
        setMinPriceThreshold('0.');
      } else {
        setMinPriceThreshold(prev => prev + '.');
      }
    }
  };

  // Convert string to number for validation and searches
  const getNumericThreshold = (): number => {
    if (minPriceThreshold === '' || isNaN(parseFloat(minPriceThreshold))) {
      return MIN_PRICE_THRESHOLD;
    }
    return parseFloat(minPriceThreshold);
  };

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
          if (lowestPrice !== null && lowestPrice < getNumericThreshold()) {
            const updatedVerdict: SourcingVerdict = {
              ...initialVerdict,
              verdict: "REJECT",
              decidingStage: -1, // Special stage for instant reject
              decidingReason: `INSTANT REJECT: Lowest price on eBay AU is $${lowestPrice.toFixed(2)}, which is below your threshold of $${getNumericThreshold().toFixed(2)}.`
            };
            
            setSearchResult(updatedVerdict);
          } else if (lowestPrice !== null) {
            console.log(`Book passes price threshold check: $${lowestPrice.toFixed(2)} >= $${getNumericThreshold().toFixed(2)}`);
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

  const handleScanAgain = () => {
    setSearchResult(null);
    setIsbn('');
    setLowestListedPrice(null);
  };

  const calculateCombinedVerdict = () => {
    // Ensure searchResult exists and has bookDetails before proceeding
    if (!searchResult || !searchResult.bookDetails) return;

    setCalculationInProgress(true);
    setError(''); // Clear previous errors

    // --- 1. Parse Inputs --- (Inputs are taken directly from state)
    const activeCount = lowestActivePrice ? parseInt(lowestActivePrice) : null;
    const soldCount = recentSoldPrice ? parseInt(recentSoldPrice) : null;
    const terapeak = terapeakSales ? parseInt(terapeakSales) : null;
    const bsr = amazonBSR ? parseInt(amazonBSR) : null;
    const reviews = amazonReviews ? parseInt(amazonReviews) : null;

    // --- Initialize calculation variables for THIS RUN --- (Fix for double-calc bug)
    let currentProbability = 0.0;
    let verdict: "BUY" | "REJECT" = "REJECT";
    let decidingReason = "Initial REJECT";
    let stageReached = 0; // 0: Initial, 1: STR, 2: Terapeak, 3: Amazon
    let baseStr: number | null = null;

    // --- 2. Stage 1: Base STR Calculation ---
    stageReached = 1;
    if (activeCount !== null && soldCount !== null) {
      if (activeCount > 0) {
        baseStr = soldCount / activeCount;
        if (baseStr > 1) baseStr = 1; // Cap at 100%
        currentProbability = baseStr;
        decidingReason = `Stage 1: Base STR = ${(baseStr * 100).toFixed(1)}%.`;
        console.log(`Calc: Base STR = ${soldCount}/${activeCount} = ${currentProbability.toFixed(3)}`);
      } else if (soldCount > 0) {
        baseStr = 1.0;
        currentProbability = 1.0;
        decidingReason = `Stage 1: Base STR = 100% (0 Actives, ${soldCount} Solds).`;
        console.log(`Calc: Base STR = 1.0 (0 Actives, ${soldCount} Solds)`);
      } else {
        baseStr = 0.0;
        currentProbability = 0.0;
        decidingReason = `Stage 1: Base STR = 0% (0 Actives, 0 Solds). Requires enhancement.`;
        console.log(`Calc: Base STR = 0.0 (0 Actives, 0 Solds)`);
      }
    } else if (activeCount !== null && activeCount > 0 && soldCount === null) {
      baseStr = 0.0;
      currentProbability = 0.0;
      decidingReason = `Stage 1: Base STR = 0% (${activeCount} Actives, 0 Solds).`;
      console.log(`Calc: Base STR = 0.0 (${activeCount} Actives, 0 Solds)`);
    } else {
      decidingReason = `Stage 1: Insufficient Active/Sold data. Requires enhancement.`;
      console.log(`Calc: Insufficient STR data`);
    }

    if (currentProbability >= STR_THRESHOLD) {
      verdict = "BUY";
      decidingReason += ` Passes Threshold (${(STR_THRESHOLD * 100).toFixed(1)}%).`;
      console.log(`Calc: Verdict BUY at Stage 1`);
    } else {
      decidingReason += ` Below Threshold (${(STR_THRESHOLD * 100).toFixed(1)}%).`;
      console.log(`Calc: Below threshold at Stage 1, proceeding.`);

      // --- 3. Stage 2: Terapeak Enhancement ---
      if (terapeak !== null && terapeak > 0) {
        stageReached = 2;
        const pTerapeakBoost = 1 - Math.exp(-terapeak / 6);
        const probabilityIncrease = (1 - currentProbability) * pTerapeakBoost;
        currentProbability += probabilityIncrease;
        decidingReason = `Stage 2 (Terapeak ${terapeak}): Probability increased by ${(probabilityIncrease * 100).toFixed(1)}% to ${(currentProbability * 100).toFixed(1)}%.`;
        console.log(`Calc: Terapeak Boost = ${pTerapeakBoost.toFixed(3)}, Increase = ${probabilityIncrease.toFixed(3)}, New Prob = ${currentProbability.toFixed(3)}`);

        if (currentProbability >= STR_THRESHOLD) {
          verdict = "BUY";
          decidingReason += ` Passes Threshold (${(STR_THRESHOLD * 100).toFixed(1)}%).`;
          console.log(`Calc: Verdict BUY at Stage 2`);
        } else {
          decidingReason += ` Below Threshold (${(STR_THRESHOLD * 100).toFixed(1)}%).`;
          console.log(`Calc: Below threshold at Stage 2, proceeding.`);
          // Proceed to Stage 3 (Amazon) even if Terapeak fails
        }
      } else {
        // No Terapeak data, proceed to Stage 3 (Amazon) if verdict is still REJECT
        if (verdict === "REJECT") {
          decidingReason += ` No Terapeak data.`;
          console.log(`Calc: No Terapeak, proceeding.`);
        }
      }

      // --- 4. Stage 3: Amazon BSR / Review Enhancement (Only if verdict is still REJECT) ---
      if (verdict === "REJECT") {
        const hasBSR = bsr !== null && bsr > 0;
        const hasReviews = reviews !== null && reviews > 0;

        // Enter Amazon stage if BSR or Reviews data is present
        if (hasBSR || hasReviews) {
          stageReached = 3; // Mark as reaching Amazon stage
          console.log(`Calc: Entering Stage 3 (Amazon) with BSR=${bsr ?? 'N/A'}, Reviews=${reviews ?? 'N/A'}`);

          if (hasBSR && hasReviews) {
            // --- Scenario: Both BSR and Reviews Provided (Use Complex Logic) ---
            console.log(`Calc: Using complex Amazon logic (BSR & Reviews)`);
            // --- New BSR Logic (700k cap, logarithmic scaling) --- 
            const BSR_HARD_CAP = 700000;
            const BSR_THRESHOLD_BASE = 500000; // Base threshold, adjusted by reviews
            const LOG_STEEPNESS_FACTOR = 3; // Controls how quickly quality drops off
            const qualityThreshold = 0.55; // Threshold for BUY verdict in this stage
            
            // 1. Check Hard Cap
            if (bsr > BSR_HARD_CAP) {
              verdict = "REJECT";
              decidingReason += ` Then, AMAZON STAGE 3 HARD FAIL: BSR of ${bsr.toLocaleString()} exceeds hard cap of ${BSR_HARD_CAP.toLocaleString()}.`;
              console.log(`Calc: Amazon Hard Fail (BSR > ${BSR_HARD_CAP})`);
            } else {
              // 2. Calculate Review Strength
              const reviewStrength = 2 / (1 + Math.exp(-0.3 * Math.log10(Math.max(reviews, 1)))) - 0.5;
              // 3. Calculate Adjusted Threshold (higher reviews make it easier to pass)
              const adjustedBSRThreshold = BSR_THRESHOLD_BASE * (1 + reviewStrength);
              console.log(`Calc: Review Strength = ${reviewStrength.toFixed(2)}, Adj. BSR Threshold = ${Math.round(adjustedBSRThreshold).toLocaleString()}`);
              
              // 4. Calculate Logarithmic BSR Quality
              const logBSR = Math.log(Math.max(bsr, 1)); // Use log(1)=0 for BSR=0/null
              const logAdjustedThreshold = Math.log(Math.max(adjustedBSRThreshold, 1));
              const logRatio = logBSR / logAdjustedThreshold; // Ratio of logs
              const bsrQuality = 1 / (1 + Math.exp(LOG_STEEPNESS_FACTOR * (logRatio - 1.0)));
              console.log(`Calc: logBSR = ${logBSR.toFixed(2)}, logAdjThreshold = ${logAdjustedThreshold.toFixed(2)}, logRatio = ${logRatio.toFixed(2)}, bsrQuality = ${bsrQuality.toFixed(3)}`);
              
              // 5. Check for Sparse eBay Data Boost
              const hasMinimalEbayData = 
                (activeCount === 0 || activeCount === null) && 
                (soldCount === 0 || soldCount === null) && 
                (terapeak === null || terapeak <= 2);
                
              let sparseDataBoost = 0;
              if (hasMinimalEbayData && bsr < 200000) { // Keep boost condition same for now
                sparseDataBoost = 0.15;
                console.log(`Calc: Applied sparse data boost: ${(sparseDataBoost * 100).toFixed(1)}%`);
              }
              
              const boostedBsrQuality = Math.min(bsrQuality + sparseDataBoost, 1.0);
              
              // 6. Determine Verdict based on Boosted Quality
              const passesBoostedCheck = boostedBsrQuality >= qualityThreshold;
              
              if (passesBoostedCheck) {
                verdict = "BUY";
                currentProbability = boostedBsrQuality; // Use BSR quality score as final probability
                if (sparseDataBoost > 0) {
                  decidingReason += ` Then, AMAZON STAGE 3 PASS (SPARSE DATA BOOST): Base log BSR quality ${(bsrQuality * 100).toFixed(1)}% + ${(sparseDataBoost * 100).toFixed(0)}% boost = ${(boostedBsrQuality * 100).toFixed(1)}% (threshold: ${(qualityThreshold * 100)}%). BSR ${bsr.toLocaleString()} vs adj threshold ${Math.round(adjustedBSRThreshold).toLocaleString()}.`;
                  console.log(`Calc: Verdict BUY at Stage 3 (Boosted Amazon Pass)`);
                } else {
                  decidingReason += ` Then, AMAZON STAGE 3 PASS: Log BSR quality score ${(bsrQuality * 100).toFixed(1)}% (threshold: ${(qualityThreshold * 100)}%). BSR ${bsr.toLocaleString()} vs adj threshold ${Math.round(adjustedBSRThreshold).toLocaleString()}.`;
                  console.log(`Calc: Verdict BUY at Stage 3 (Amazon Pass)`);
                }
              } else {
                verdict = "REJECT";
                currentProbability = boostedBsrQuality; // Update probability even on fail
                decidingReason += ` Then, AMAZON STAGE 3 FAIL: Log BSR quality score ${(boostedBsrQuality * 100).toFixed(1)}% < threshold (${(qualityThreshold * 100)}%). BSR ${bsr.toLocaleString()} vs adj threshold ${Math.round(adjustedBSRThreshold).toLocaleString()}. Final Verdict: REJECT.`;
                console.log(`Calc: Verdict REJECT at Stage 3 (Amazon Fail)`);
              }
            }
          } else if (hasBSR) {
            // --- Scenario: Only BSR Provided (Use Simple BSR Boost) ---
            console.log(`Calc: Using simple Amazon logic (BSR only)`);
            const pBSRBoostFactor = 0.3 * Math.exp(-bsr / 200000);
            const bsrIncrease = (1 - currentProbability) * pBSRBoostFactor;
            const boostedProbability = currentProbability + bsrIncrease;
            // FIX: Append to reason instead of overwriting
            decidingReason += ` Then, Stage 3 (BSR ${bsr.toLocaleString()} only): Probability increased by ${(bsrIncrease * 100).toFixed(1)}% from ${ (currentProbability * 100).toFixed(1)}% to ${(boostedProbability * 100).toFixed(1)}%.`;
            currentProbability = boostedProbability; // Update main probability
            if (currentProbability >= STR_THRESHOLD) {
              verdict = "BUY";
              decidingReason += ` Passes Threshold (${(STR_THRESHOLD * 100).toFixed(1)}%).`;
              console.log(`Calc: Verdict BUY at Stage 3 (Simple BSR Pass)`);
            } else {
              verdict = "REJECT"; // Ensure reject if it doesn't pass
              decidingReason += ` Below Threshold (${(STR_THRESHOLD * 100).toFixed(1)}%). Final Verdict: REJECT.`;
              console.log(`Calc: Verdict REJECT at Stage 3 (Simple BSR Fail)`);
            }

          } else if (hasReviews) {
            // --- Scenario: Only Reviews Provided (Use Simple Review Boost) ---
             console.log(`Calc: Using simple Amazon logic (Reviews only)`);
            const pReviewBoostFactor = 0.2 * (1 - Math.exp(-reviews / 1000));
            const reviewIncrease = (1 - currentProbability) * pReviewBoostFactor;
            const boostedProbability = currentProbability + reviewIncrease;
            // FIX: Append to reason instead of overwriting
            decidingReason += ` Then, Stage 3 (Reviews ${reviews.toLocaleString()} only): Probability increased by ${(reviewIncrease * 100).toFixed(1)}% from ${(currentProbability * 100).toFixed(1)}% to ${(boostedProbability * 100).toFixed(1)}%.`;
            currentProbability = boostedProbability; // Update main probability
            if (currentProbability >= STR_THRESHOLD) {
              verdict = "BUY";
              decidingReason += ` Passes Threshold (${(STR_THRESHOLD * 100).toFixed(1)}%).`;
              console.log(`Calc: Verdict BUY at Stage 3 (Simple Review Pass)`);
            } else {
              verdict = "REJECT"; // Ensure reject if it doesn't pass
              decidingReason += ` Below Threshold (${(STR_THRESHOLD * 100).toFixed(1)}%). Final Verdict: REJECT.`;
              console.log(`Calc: Verdict REJECT at Stage 3 (Simple Review Fail)`);
            }
          }
        } else {
          // No Amazon data provided, verdict remains REJECT from previous stages
          if (verdict === "REJECT") {
            decidingReason += ` No Amazon data for enhancement. Final Verdict: REJECT.`; // Adjusted message slightly
            console.log(`Calc: No BSR/Reviews. Final Verdict: REJECT`);
          }
        }
      }
    }

    // --- 6. Update State --- (Fix for double-calc bug)
    // Ensure the finalProbability reflects the outcome of the last relevant stage
    const finalProbability = Math.min(currentProbability, 1.0); // Cap final probability

    const updatedVerdict: SourcingVerdict = {
      // Carry over only essential static details from the initial search result
      bookDetails: searchResult.bookDetails,
      buyCost: searchResult.buyCost,

      // Set all calculation-dependent fields based on THIS RUN's results
      verdict, // Final verdict from this run
      decidingStage: stageReached, // Stage reached in this run
      decidingReason, // Reason from this run
      sellingPrice: 0, // Reset/Recalculate based on this run if needed
      profit: 0, // Reset/Recalculate based on this run if needed
      roi: 0, // Reset/Recalculate based on this run if needed
      equilibriumDetails: baseStr !== null ? {
        probability: baseStr,
        threshold: STR_THRESHOLD,
        passesStage1: baseStr >= STR_THRESHOLD,
        str: baseStr
      } : null,
      // Use the final calculated probability for display
      terapeakDetails: {
        salesRate: finalProbability,
        threshold: STR_THRESHOLD,
        passesStage2: finalProbability >= STR_THRESHOLD // Did the final probability pass?
      },
      // Record the inputs used in THIS calculation run
      manualInputs: {
        lowestActivePrice: activeCount,
        recentSoldPrice: soldCount,
        terapeakSales: terapeak,
        amazonBSR: bsr,
        amazonReviews: reviews
      }
    };

    setSearchResult(updatedVerdict);
    setCalculationInProgress(false);
    console.log("Calc: Final Verdict =", verdict, "Prob =", finalProbability.toFixed(3), "Reason:", decidingReason);
  };

  // Render the metrics banner
  function renderMetricsBanner(activeCount: number, soldCount: number, str: number, teapeakSales: number | null, lowestPrice: number | null, _verdict: string, finalProbability: number | null, _stage: string, basePrice: number | null, shippingCost: number | null, itemCondition: string | null, usedCount: number, newCount: number) {
    const profit = lowestPrice !== null && basePrice !== null ? (lowestPrice * (1 - EBAY_FEES)) - (shippingCost || 0) - basePrice : null;
    const roi = profit !== null && basePrice !== null && basePrice > 0 ? (profit / basePrice) * 100 : null;
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
          <div className="value">{activeCount === 0 && soldCount > 0 ? "∞" : str.toFixed(2)}</div>
          <div className="inventory-counts">
            {activeCount === 0 && soldCount > 0 
              ? "All inventory selling out completely" 
              : "Ratio of sold items to active listings"
            }
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

  // Add effect to focus on ISBN input when returning to main screen
  useEffect(() => {
    // Only auto-focus if we've previously shown results
    // This prevents focusing on initial load
    if (!searchResult && hasViewedResults && isbnInputRef.current) {
      // Short delay to ensure the input is rendered
      setTimeout(() => {
        isbnInputRef.current?.focus();
      }, 100);
    }
    
    // Update tracking state
    if (searchResult && !hasViewedResults) {
      setHasViewedResults(true);
    }
  }, [searchResult, hasViewedResults]);

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
                    ref={isbnInputRef} // Add the ref here
                    autoFocus={!hasViewedResults} // Only auto-focus on initial load
                    inputMode="none" // Prevent keyboard from showing for scanner
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
                        type="text"
                        value={minPriceThreshold}
                        onChange={(e) => setMinPriceThreshold(e.target.value)}
                        className="price-input"
                        disabled={!isInstantRejectEnabled}
                        readOnly={isInstantRejectEnabled}
                        onFocus={() => {
                          if (isInstantRejectEnabled) {
                            setActiveInput('min-price-threshold');
                            setFrontPageKeyboardVisible(true);
                          }
                        }}
                      />
                    </div>
                    <div className="price-helper-text">
                      Books priced below this threshold will be automatically rejected
                    </div>
                  </div>
                </div>
                
                {/* Front page numeric keypad - Only shown when price input is focused */}
                {frontPageKeyboardVisible && isInstantRejectEnabled && (
                  <div style={{
                    margin: '10px 0',
                    padding: '10px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                    border: '1px solid #e8eaed'
                  }}>
                    <div style={{ 
                      marginBottom: '4px', 
                      fontSize: '13px', 
                      fontWeight: '500', 
                      color: '#5f6368',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>Set Price Threshold: ${minPriceThreshold}</span>
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '4px',
                      marginBottom: '4px'
                    }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                        <button 
                          key={num}
                          onClick={() => num === '.' ? handleDecimalPoint() : handleNumericInput(num.toString())}
                          style={{
                            padding: '8px 0',
                            backgroundColor: '#fff',
                            border: '1px solid #dadce0',
                            borderRadius: '4px',
                            fontSize: '15px',
                            fontWeight: '500',
                            color: '#202124',
                            cursor: 'pointer',
                            touchAction: 'manipulation',
                            userSelect: 'none',
                            WebkitTapHighlightColor: 'transparent',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '4px'
                    }}>
                      <button 
                        onClick={handleBackspace}
                        style={{
                          padding: '6px 0',
                          backgroundColor: '#f1f3f4',
                          border: '1px solid #dadce0',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#5f6368',
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          userSelect: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        ← Backspace
                      </button>
                      <button 
                        onClick={handleClear}
                        style={{
                          padding: '6px 0',
                          backgroundColor: '#fef7f6',
                          border: '1px solid #fadad9',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '500',
                          color: '#d93025',
                          cursor: 'pointer',
                          touchAction: 'manipulation',
                          userSelect: 'none',
                          WebkitTapHighlightColor: 'transparent',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        Clear
                      </button>
                    </div>
                    
                    <button
                      onClick={() => {
                        setFrontPageKeyboardVisible(false);
                        setActiveInput(null);
                      }}
                      style={{
                        width: '100%',
                        marginTop: '8px',
                        padding: '6px 0',
                        backgroundColor: '#e8f0fe',
                        border: '1px solid #dadce0',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#1967d2',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                        userSelect: 'none',
                        WebkitTapHighlightColor: 'transparent',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      Done
                    </button>
                  </div>
                )}
                
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
            
            {/* Numeric Keypad UI - More compact and mobile-friendly */}
            <div style={{
              margin: '5px 0 10px',
              padding: '10px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
              border: '1px solid #e8eaed'
            }}>
              <div style={{ 
                marginBottom: '4px', 
                fontSize: '13px', 
                fontWeight: '500', 
                color: '#5f6368',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>Numeric Keypad</span>
                {activeInput && (
                  <span style={{ 
                    fontSize: '12px', 
                    backgroundColor: '#e8f0fe', 
                    color: '#1967d2',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'normal'
                  }}>
                    {activeInput.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                )}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '4px',
                marginBottom: '4px'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((num) => (
                  <button 
                    key={num}
                    onClick={() => handleNumericInput(num.toString())}
                    style={{
                      padding: '8px 0',
                      backgroundColor: '#fff',
                      border: '1px solid #dadce0',
                      borderRadius: '4px',
                      fontSize: '15px',
                      fontWeight: '500',
                      color: '#202124',
                      cursor: 'pointer',
                      touchAction: 'manipulation',
                      userSelect: 'none',
                      WebkitTapHighlightColor: 'transparent',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    disabled={!activeInput}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px'
              }}>
                <button 
                  onClick={handleBackspace}
                  style={{
                    padding: '6px 0',
                    backgroundColor: '#f1f3f4',
                    border: '1px solid #dadce0',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#5f6368',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  disabled={!activeInput}
                >
                  ← Backspace
                </button>
                <button 
                  onClick={handleClear}
                  style={{
                    padding: '6px 0',
                    backgroundColor: '#fef7f6',
                    border: '1px solid #fadad9',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '500',
                    color: '#d93025',
                    cursor: 'pointer',
                    touchAction: 'manipulation',
                    userSelect: 'none',
                    WebkitTapHighlightColor: 'transparent',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  disabled={!activeInput}
                >
                  Clear
                </button>
              </div>
            </div>
            
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
                          onClick={(e) => {
                            e.preventDefault();
                            // Get main title (before colon) and author for search
                            const mainTitle = searchResult?.bookDetails?.title 
                              ? searchResult.bookDetails.title.split(':')[0].trim() 
                              : '';
                            const author = searchResult?.bookDetails?.authors?.length 
                              ? searchResult.bookDetails.authors[0] 
                              : '';
                            const searchTerm = `${mainTitle} ${author}`.trim();
                            safeOpenExternalLink(`https://www.ebay.com.au/sch/i.html?_nkw=${encodeURIComponent(searchTerm)}&_sacat=0&_from=R40&rt=nc&LH_PrefLoc=1&_sop=15`);
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
                          onFocus={() => setActiveInput('active-price')}
                          readOnly
                        />
                        <label htmlFor="active-price">Active Listings Count:</label>
                      </div>
                    </div>
                    
                    <div className="input-row">
                      <div className="button-container">
                        <button 
                          className="ebay-link-button mobile-button"
                          onClick={(e) => {
                            e.preventDefault();
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
                          onFocus={() => setActiveInput('sold-price')}
                          readOnly
                        />
                        <label htmlFor="sold-price">Sold Items Count:</label>
                      </div>
                    </div>
                    
                    <div className="input-row">
                      <div className="button-container">
                        <button 
                          className="ebay-link-button mobile-button"
                          onClick={(e) => {
                            e.preventDefault();
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
                          onFocus={() => setActiveInput('terapeak-sales')}
                          readOnly
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
                          onFocus={() => setActiveInput('amazon-bsr')}
                          readOnly
                        />
                        <label htmlFor="amazon-bsr">Amazon BSR: <span className="optional-text">(optional stage 3)</span></label>
                      </div>
                    </div>
                    
                    <div className="input-row">
                      <div className="button-container">
                        <button 
                          className="amazon-link-button mobile-button"
                          onClick={(e) => {
                            e.preventDefault();
                            safeOpenExternalLink(`https://www.amazon.com.au/s?k=${encodeURIComponent(isbn)}`);
                          }}
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
                          onFocus={() => setActiveInput('amazon-reviews')}
                          readOnly
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
