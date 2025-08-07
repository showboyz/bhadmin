// Test script for DynamoDB sync functionality
const testSyncAPI = async () => {
  try {
    console.log('🚀 Testing DynamoDB sync API...')
    
    const testData = {
      orgName: '영앤',
      adminIds: ['admin10', 'admin9', 'admin8', 'admin6']
    }
    
    const response = await fetch('http://localhost:3000/api/sync/dynamodb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅ Sync API test successful!')
      console.log('Response:', result)
    } else {
      console.log('❌ Sync API test failed!')
      console.log('Error:', result)
    }
    
    // Test status check
    console.log('\n🔍 Testing sync status check...')
    const statusResponse = await fetch(`http://localhost:3000/api/sync/dynamodb?orgName=${encodeURIComponent('영앤')}`)
    const statusResult = await statusResponse.json()
    
    if (statusResponse.ok) {
      console.log('✅ Status check successful!')
      console.log('Status:', statusResult)
    } else {
      console.log('❌ Status check failed!')
      console.log('Error:', statusResult)
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
  }
}

// Run test if this script is executed directly
if (typeof window === 'undefined') {
  testSyncAPI()
}

module.exports = { testSyncAPI }