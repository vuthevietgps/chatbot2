// Test đơn giản với timestamp để tạo user mới mỗi lần
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSingleMessage() {
  const timestamp = Date.now();
  const uniqueUserId = `user-${timestamp}`;
  const testPageId = 'fp_test_fashion_2024';

  console.log(`🧪 Testing with user: ${uniqueUserId}`);

  const webhookData = {
    object: 'page',
    entry: [{
      id: testPageId,
      time: timestamp,
      messaging: [{
        sender: { id: uniqueUserId },
        recipient: { id: testPageId },
        timestamp: timestamp,
        message: {
          mid: `msg-${timestamp}`,
          text: 'xin chào'
        }
      }]
    }]
  };

  try {
    const response = await axios.post(`${BASE_URL}/webhook/facebook`, webhookData);
    console.log('✅ Webhook success:', response.data);

    // Đợi 2 giây để processing hoàn thành
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Kiểm tra kết quả
    const conversations = await axios.get(`${BASE_URL}/conversations`);
    console.log(`📊 Total conversations: ${conversations.data.length}`);

    const messages = await axios.get(`${BASE_URL}/messages`);
    console.log(`📊 Total messages: ${messages.data.length}`);

    if (messages.data.length > 0) {
      const latestMessage = messages.data[0];
      console.log(`📱 Latest message:`, {
        text: latestMessage.text,
        direction: latestMessage.direction,
        status: latestMessage.status
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSingleMessage();