// Test chatbot automation with existing data
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Test với một message mới từ user mới hoàn toàn
async function testChatbotAutomation() {
  console.log('🚀 Testing ChatBot Automation...\n');

  try {
    // Tạo unique user ID để tránh conflict
    const uniqueUserId = `unique-user-${Date.now()}`;
    const testPageId = 'fp_test_fashion_2024'; // Sử dụng pageId có sẵn

    // Test 1: Message có keyword matching
    console.log('Test 1: Message with keyword matching');
    const webhookData1 = {
      object: 'page',
      entry: [{
        id: testPageId,
        time: Date.now(),
        messaging: [{
          sender: { id: uniqueUserId + '_1' },
          recipient: { id: testPageId },
          timestamp: Date.now(),
          message: {
            mid: `msg_${Date.now()}_1`,
            text: 'xin chào'
          }
        }]
      }]
    };

    const response1 = await axios.post(`${BASE_URL}/webhook/facebook`, webhookData1);
    console.log('✅ Test 1 result:', response1.data);

    // Đợi một chút để xử lý
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 2: Message không có keyword matching
    console.log('\nTest 2: Message without keyword matching');
    const webhookData2 = {
      object: 'page',
      entry: [{
        id: testPageId,
        time: Date.now(),
        messaging: [{
          sender: { id: uniqueUserId + '_2' },
          recipient: { id: testPageId },
          timestamp: Date.now(),
          message: {
            mid: `msg_${Date.now()}_2`,
            text: 'câu hỏi rất phức tạp không có trong database'
          }
        }]
      }]
    };

    const response2 = await axios.post(`${BASE_URL}/webhook/facebook`, webhookData2);
    console.log('✅ Test 2 result:', response2.data);

    // Đợi để xử lý
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Kiểm tra kết quả
    console.log('\n📊 Checking results...');
    
    // Kiểm tra webhook logs
    const webhookLogs = await axios.get(`${BASE_URL}/webhook-logs`);
    console.log(`✅ Webhook logs: ${webhookLogs.data.length} entries`);

    // Kiểm tra messages
    const messages = await axios.get(`${BASE_URL}/messages`);
    console.log(`✅ Messages: ${messages.data.length} entries`);

    // Kiểm tra conversations
    const conversations = await axios.get(`${BASE_URL}/conversations`);
    console.log(`✅ Conversations: ${conversations.data.length} entries`);

    // Kiểm tra customers
    const customers = await axios.get(`${BASE_URL}/customers`);
    console.log(`✅ Customers: ${customers.data.length} entries`);

    // Kiểm tra sub-scripts
    const subScripts = await axios.get(`${BASE_URL}/sub-scripts`);
    console.log(`✅ Sub-scripts: ${subScripts.data.length} entries`);

    console.log('\n🎉 ChatBot automation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Chạy test
testChatbotAutomation();