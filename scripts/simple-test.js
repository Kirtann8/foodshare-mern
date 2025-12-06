#!/usr/bin/env node

const http = require('http');

const BACKEND_URL = 'http://localhost:5000';
const AI_SERVICE_URL = 'http://localhost:5001';

console.log('🧪 FoodShare Services Quick Test');
console.log('=' .repeat(40));

function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

async function testBackend() {
  try {
    console.log('\n📡 Testing Backend...');
    const response = await makeRequest(`${BACKEND_URL}/api/health`);
    if (response.status === 200) {
      console.log('✅ Backend is healthy');
      return true;
    } else {
      console.log(`❌ Backend returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend not responding:', error.message);
    return false;
  }
}

async function testAIService() {
  try {
    console.log('\n🤖 Testing AI Service...');
    const response = await makeRequest(`${AI_SERVICE_URL}/health`);
    if (response.status === 200) {
      console.log('✅ AI Service is healthy');
      console.log(`   Service: ${response.data.service || 'Unknown'}`);
      return true;
    } else {
      console.log(`❌ AI Service returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ AI Service not responding:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Start AI service with: npm run start-cv');
    }
    return false;
  }
}

async function runTests() {
  const backendOk = await testBackend();
  const aiServiceOk = await testAIService();
  
  console.log('\n' + '=' .repeat(40));
  console.log('📋 Results:');
  console.log(`${backendOk ? '✅' : '❌'} Backend`);
  console.log(`${aiServiceOk ? '✅' : '❌'} AI Service`);
  
  if (backendOk && aiServiceOk) {
    console.log('\n🎉 All services are running!');
    console.log('💡 You can now use: npm run dev');
  } else {
    console.log('\n⚠️  Some services need to be started.');
    if (!backendOk) console.log('   Start backend: npm run server');
    if (!aiServiceOk) console.log('   Start AI: npm run start-cv');
  }
}

runTests().catch(console.error);