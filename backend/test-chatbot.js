// Test script để kiểm tra chatbot automation
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Lấy test user có sẵn
async function getTestUser() {
  try {
    const response = await axios.get(`${BASE_URL}/users`);
    const user = response.data.find(u => u.role === 'employee' && u.isActive);
    if (user) {
      console.log('✅ Using existing user:', user.fullName);
      return user;
    }
    console.error('❌ No active employee user found');
    return null;
  } catch (error) {
    console.error('❌ Failed to get users:', error.message);
    return null;
  }
}

// Lấy test fanpage có sẵn
async function getTestFanpage() {
  try {
    const response = await axios.get(`${BASE_URL}/fanpages`);
    const fanpage = response.data.find(f => f.status === 'active');
    if (fanpage) {
      console.log('✅ Using existing fanpage:', fanpage.pageName);
      return fanpage;
    }
    console.error('❌ No active fanpage found');
    return null;
  } catch (error) {
    console.error('❌ Failed to get fanpages:', error.message);
    return null;
  }
}

// Lấy test script group có sẵn
async function getTestScriptGroup() {
  try {
    const response = await axios.get(`${BASE_URL}/script-groups`);
    const scriptGroup = response.data.find(sg => sg.status === 'active');
    if (scriptGroup) {
      console.log('✅ Using existing script group:', scriptGroup.name);
      return scriptGroup;
    }
    console.error('❌ No active script group found');
    return null;
  } catch (error) {
    console.error('❌ Failed to get script groups:', error.message);
    return null;
  }
}

// Tạo test sub-scripts
async function createTestSubScripts(scriptGroupId) {
  const subScripts = [
    {
      name: 'Greeting Bot',
      keywords: ['xin chào', 'hello', 'hi', 'chào bạn'],
      responseTemplate: 'Xin chào {{customerName}}! Tôi là bot hỗ trợ. Bạn có thể hỏi về sản phẩm, giá cả hoặc liên hệ nhân viên.',
      priority: 10,
      status: 'active',
      scenarioId: scriptGroupId,
      confidenceThreshold: 0.8
    },
    {
      name: 'Product Inquiry Bot',
      keywords: ['sản phẩm', 'product', 'mua', 'buy', 'giá', 'price', 'bao nhiêu'],
      responseTemplate: 'Chúng tôi có nhiều sản phẩm tuyệt vời! Để biết thêm chi tiết, vui lòng cho biết bạn quan tâm đến loại sản phẩm nào?',
      priority: 8,
      status: 'active',
      scenarioId: scriptGroupId,
      confidenceThreshold: 0.7
    },
    {
      name: 'Contact Support Bot',
      keywords: ['nhân viên', 'support', 'hỗ trợ', 'liên hệ', 'contact', 'help'],
      responseTemplate: 'Tôi sẽ kết nối bạn với nhân viên hỗ trợ. Vui lòng chờ trong giây lát...',
      priority: 5,
      status: 'active',
      scenarioId: scriptGroupId,
      confidenceThreshold: 0.6,
      action: 'TRANSFER_TO_AGENT'
    }
  ];

  const createdScripts = [];
  for (const script of subScripts) {
    try {
      const response = await axios.post(`${BASE_URL}/sub-scripts`, script);
      console.log('✅ Sub-script created:', response.data.name);
      createdScripts.push(response.data);
    } catch (error) {
      console.log('ℹ️ Sub-script might already exist:', script.name);
    }
  }
  
  return createdScripts;
}

// Test webhook message processing
async function testWebhookMessage(fanpageId, messageText, testIndex) {
  try {
    const uniqueUserId = `test-user-${Date.now()}-${testIndex}`;
    const webhookData = {
      object: 'page',
      entry: [{
        id: fanpageId,
        time: Date.now(),
        messaging: [{
          sender: { id: uniqueUserId },
          recipient: { id: fanpageId },
          timestamp: Date.now(),
          message: {
            mid: `test-message-${Date.now()}-${testIndex}`,
            text: messageText
          }
        }]
      }]
    };

    console.log(`\n🧪 Testing webhook with message: "${messageText}"`);
    const response = await axios.post(`${BASE_URL}/webhook/facebook`, webhookData);
    console.log('✅ Webhook processed successfully:', response.data);
    
    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.error('❌ Webhook test failed:', error.response?.data || error.message);
  }
}

// Main test function
async function runChatbotTests() {
  console.log('🚀 Starting ChatBot Automation Tests...\n');

  try {
    // 1. Get test user
    const user = await getTestUser();
    if (!user) {
      console.error('❌ Failed to create/get test user');
      return;
    }

    // 2. Get test fanpage
    const fanpage = await getTestFanpage();
    if (!fanpage) {
      console.error('❌ Failed to create/get test fanpage');
      return;
    }

    // 3. Get test script group  
    const scriptGroup = await getTestScriptGroup();
    if (!scriptGroup) {
      console.error('❌ Failed to create/get test script group');
      return;
    }

    // 4. Create test sub-scripts
    const subScripts = await createTestSubScripts(scriptGroup._id);
    console.log(`✅ Created/verified ${subScripts.length} sub-scripts\n`);

    // 5. Test different message scenarios
    console.log('📝 Testing chatbot responses...\n');
    
    await testWebhookMessage(fanpage.pageId, 'xin chào', 1);
    await testWebhookMessage(fanpage.pageId, 'tôi muốn mua sản phẩm', 2);
    await testWebhookMessage(fanpage.pageId, 'tôi cần hỗ trợ từ nhân viên', 3);
    await testWebhookMessage(fanpage.pageId, 'câu hỏi không có trong script', 4);

    console.log('\n✅ ChatBot automation tests completed!');
    console.log('\n📊 Check the following:');
    console.log('- Webhook logs: GET /webhook-logs');
    console.log('- Messages: GET /messages');
    console.log('- Conversations: GET /conversations');
    console.log('- Customers: GET /customers');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run tests
runChatbotTests();