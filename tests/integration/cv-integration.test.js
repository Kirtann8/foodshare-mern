/**
 * Integration test for FoodShare CV service
 * Tests the connection and functionality of the Python CV service
 */
const axios = require('axios');

const testCVIntegration = async () => {
  console.log('🧪 Testing FoodShare CV Integration...\n');

  // Test 1: Check if Python CV service is running
  try {
    console.log('[1/3] Testing Python CV Service...');
    const healthResponse = await axios.get('http://localhost:5001/health');
    console.log('✅ Python CV Service is running');
    console.log(`   Status: ${healthResponse.data.status}`);
  } catch (error) {
    console.log('❌ Python CV Service is not running');
    console.log('   Please start it with: python backend/services/foodCV.py');
    return;
  }

  // Test 2: Test CV assessment with sample data
  try {
    console.log('\n[2/3] Testing CV Assessment...');
    const sampleImage = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    
    const assessmentResponse = await axios.post('http://localhost:5001/assess-food', {
      image: sampleImage
    });
    
    console.log('✅ CV Assessment working');
    console.log(`   Quality Grade: ${assessmentResponse.data.data.quality_grade}`);
    console.log(`   Freshness: ${assessmentResponse.data.data.freshness_score}%`);
  } catch (error) {
    console.log('❌ CV Assessment failed');
    console.log(`   Error: ${error.message}`);
    return;
  }

  // Test 3: Check Node.js backend integration
  try {
    console.log('\n[3/3] Testing Backend Integration...');
    console.log('   Note: This requires your Node.js backend to be running');
    console.log('   Start with: npm run dev (in backend folder)');
    
    // This would test the actual API endpoint
    // const backendResponse = await axios.post('http://localhost:5000/api/food/assess-quality', {
    //   image: sampleImage
    // }, {
    //   headers: { Authorization: 'Bearer YOUR_TOKEN' }
    // });
    
    console.log('⚠️  Backend test skipped (requires authentication)');
  } catch (error) {
    console.log('❌ Backend integration test failed');
  }

  console.log('\n🎉 CV Integration Test Complete!');
  console.log('\nNext Steps:');
  console.log('1. Start your Node.js backend: npm run dev (in backend folder)');
  console.log('2. Start your React frontend: npm start (in frontend folder)');
  console.log('3. Go to Share Food page and test the AI Scanner');
};

// Export for testing framework
module.exports = { testCVIntegration };

// Run if called directly
if (require.main === module) {
  testCVIntegration().catch(console.error);
}