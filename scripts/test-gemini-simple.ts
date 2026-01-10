// Simple Gemini API test
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini API...\n');
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY not found in environment');
      return;
    }
    
    console.log(`✅ API Key found: ${apiKey.slice(0, 10)}...`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different model names
    const models = ['gemini-flash-latest', 'gemini-1.5-flash', 'gemini-pro'];
    
    for (const modelName of models) {
      try {
        console.log(`\n📡 Testing model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "Hello from Gemini!"');
        const response = await result.response;
        const text = response.text();
        console.log(`✅ ${modelName} works!`);
        console.log(`Response: ${text}`);
        return; // Success - stop here
      } catch (error: any) {
        console.log(`❌ ${modelName} failed: ${error.message}`);
      }
    }
    
    console.log('\n❌ All models failed. The API key may be invalid or expired.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGemini();
