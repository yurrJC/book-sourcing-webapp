// Simple test script to verify the fallback system
// Run with: node test-fallback.js

const axios = require('axios');

// Test ISBNs
const testIsbns = [
  '9780141439518', // Pride and Prejudice
  '9780743273565', // The Great Gatsby
  '9780061120084'  // To Kill a Mockingbird
];

async function testBookLookup(isbn) {
  console.log(`\n=== Testing ISBN: ${isbn} ===`);
  
  try {
    const response = await axios.get(`http://localhost:3001/api/search?isbn=${isbn}`);
    
    if (response.data && response.data.bookDetails) {
      const book = response.data.bookDetails;
      console.log('✅ Book found!');
      console.log(`Title: ${book.title}`);
      console.log(`Authors: ${book.authors ? book.authors.join(', ') : 'Unknown'}`);
      console.log(`Publisher: ${book.publisher || 'Unknown'}`);
      console.log(`Source: ${book.source || 'Unknown'}`);
      console.log(`Image: ${book.image ? 'Available' : 'Not available'}`);
    } else {
      console.log('❌ No book details found');
    }
  } catch (error) {
    console.log('❌ Error:', error.response?.data?.error || error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing Book Lookup Fallback System');
  console.log('Make sure the server is running on port 3001');
  
  for (const isbn of testIsbns) {
    await testBookLookup(isbn);
    // Wait a bit between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n✅ Test completed!');
}

runTests().catch(console.error); 