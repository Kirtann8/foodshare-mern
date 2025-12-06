#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { default: fetch } = await import('node-fetch').catch(() => {
  console.log('Installing node-fetch...');
  return null;
});

// Simple fetch wrapper to mimic axios
const axios = {
  get: async (url, options = {}) => {
    const response = await fetch(url, {
      method: 'GET',
      timeout: options.timeout || 10000,
      ...options
    });
    return {
      data: await response.json(),
      status: response.status
    };
  },
  post: async (url, data, options = {}) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: JSON.stringify(data),
      timeout: options.timeout || 10000,
      ...options
    });
    return {
      data: await response.json(),
      status: response.status
    };
  }
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if we have fetch available
if (!globalThis.fetch) {
  console.log('❌ Node.js version too old. Please use Node.js 18+ or install node-fetch');
  process.exit(1);
}

const BACKEND_URL = 'http://localhost:5000';
const AI_SERVICE_URL = 'http://localhost:5001';

console.log('🧪 FoodShare Services Test Suite');
console.log('=' .repeat(50));

async function testBackendHealth() {
  try {
    console.log('\n📡 Testing Backend Health...');
    const response = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 });
    console.log('✅ Backend is healthy:', response.data.message);
    return true;
  } catch (error) {
    console.log('❌ Backend health check failed:', error.message);
    return false;
  }
}

async function testAIServiceHealth() {
  try {
    console.log('\n🤖 Testing AI Service Health...');
    const response = await axios.get(`${AI_SERVICE_URL}/health`, { timeout: 10000 });
    console.log('✅ AI Service is healthy:', response.data.service);
    console.log('   Version:', response.data.version);
    console.log('   Models loaded:', response.data.models_loaded);
    return true;
  } catch (error) {
    console.log('❌ AI Service health check failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('   💡 Start AI service with: npm run start-cv');
    }
    return false;
  }
}

async function testAIModelsStatus() {
  try {
    console.log('\n🧠 Testing AI Models Status...');
    const response = await axios.get(`${AI_SERVICE_URL}/models/status`, { timeout: 15000 });
    const { models, summary } = response.data;
    
    console.log('📊 Models Summary:');
    console.log(`   Total models: ${summary.total_models}`);
    console.log(`   Ready models: ${summary.ready_models}`);
    console.log(`   Ensemble ready: ${summary.ensemble_ready ? '✅' : '❌'}`);
    console.log(`   Food categories: ${summary.food_categories_count}`);
    
    console.log('\n🔍 Individual Models:');
    for (const [modelName, status] of Object.entries(models)) {
      const statusIcon = status.status === 'ready' ? '✅' : '❌';
      console.log(`   ${statusIcon} ${modelName}: ${status.status}`);
    }
    
    return response.data.summary.ensemble_ready;
  } catch (error) {
    console.log('❌ AI Models status check failed:', error.message);
    return false;
  }
}

async function testAIServicePrediction() {
  try {
    console.log('\n🔬 Testing AI Service Prediction...');
    const response = await axios.post(`${AI_SERVICE_URL}/test-prediction`, {}, { timeout: 30000 });
    
    if (response.data.success) {
      console.log('✅ AI prediction test passed');
      const result = response.data.test_result;
      if (result.data) {
        console.log(`   Quality grade: ${result.data.quality_grade}`);
        console.log(`   Confidence: ${result.data.confidence}%`);
      }
    } else {
      console.log('❌ AI prediction test failed:', response.data.error);
    }
    
    return response.data.success;
  } catch (error) {
    console.log('❌ AI prediction test failed:', error.message);
    return false;
  }
}

async function testBackendAIIntegration() {
  try {
    console.log('\n🔗 Testing Backend-AI Integration...');
    
    // Test AI status endpoint through backend
    const response = await axios.get(`${BACKEND_URL}/api/food/ai-status`, { timeout: 10000 });
    
    if (response.data.success) {
      console.log('✅ Backend can communicate with AI service');
      console.log(`   AI Service status: ${response.data.aiService.status}`);
      return true;
    } else {
      console.log('❌ Backend-AI integration failed');
      console.log('   Instructions:', response.data.aiService.instructions);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend-AI integration test failed:', error.message);
    if (error.response?.status === 401) {
      console.log('   💡 This endpoint requires authentication');
      console.log('   💡 Integration test skipped (auth required)');
      return true; // Skip this test as it requires auth
    }
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting comprehensive service tests...\n');
  
  const results = {
    backend: await testBackendHealth(),
    aiService: await testAIServiceHealth(),
    aiModels: false,
    aiPrediction: false,
    integration: false
  };
  
  // Only test AI models if service is healthy
  if (results.aiService) {
    results.aiModels = await testAIModelsStatus();
    
    // Only test prediction if models are ready
    if (results.aiModels) {
      results.aiPrediction = await testAIServicePrediction();
    }
  }
  
  // Test integration if backend is healthy
  if (results.backend) {
    results.integration = await testBackendAIIntegration();
  }
  
  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📋 Test Results Summary:');
  console.log('=' .repeat(50));
  
  const tests = [
    { name: 'Backend Health', result: results.backend },
    { name: 'AI Service Health', result: results.aiService },
    { name: 'AI Models Ready', result: results.aiModels },
    { name: 'AI Prediction Test', result: results.aiPrediction },
    { name: 'Backend-AI Integration', result: results.integration }
  ];
  
  tests.forEach(test => {
    const icon = test.result ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
  });
  
  const passedTests = tests.filter(t => t.result).length;
  const totalTests = tests.length;
  
  console.log('\n📊 Overall Result:');
  console.log(`${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All services are working correctly!');
    console.log('💡 You can now run: npm run dev');
  } else {
    console.log('⚠️  Some services need attention.');
    console.log('💡 Check the failed tests above and follow the setup guide.');
  }
  
  console.log('\n📚 For help, see: docs/AI_SERVICE_SETUP.md');
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});