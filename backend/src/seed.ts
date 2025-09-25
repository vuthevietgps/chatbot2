import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { UsersService } from './users/users.service';
import { UserRole } from './users/schemas/user.schema';
import { ProductGroupsService } from './product-groups/product-groups.service';
import { ProductsService } from './products/products.service';
import { ProductCurrency, ProductStatus } from './products/schemas/product.schema';
import { FanpagesService } from './fanpages/fanpages.service';
import { FanpageStatus } from './fanpages/schemas/fanpage.schema';
import { ConversationsService } from './conversations/conversations.service';
import { MessagesService } from './messages/messages.service';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const productGroupsService = app.get(ProductGroupsService);
  const productsService = app.get(ProductsService);
  const fanpagesService = app.get(FanpagesService);
  const conversationsService = app.get(ConversationsService);
  const messagesService = app.get(MessagesService);

  console.log('🌱 Seeding database with sample data...');

  try {
    // Create sample users
    const sampleUsers = [
      {
        fullName: 'Nguyễn Văn An',
        email: 'admin@chatbot.com',
        phone: '0123456789',
        password: 'admin123',
        role: UserRole.DIRECTOR,
        department: 'Ban Giám đốc',
        position: 'Giám đốc điều hành',
        isActive: true,
      },
      {
        fullName: 'Trần Thị Bình',
        email: 'manager@chatbot.com',
        phone: '0987654321',
        password: 'manager123',
        role: UserRole.MANAGER,
        department: 'Phòng Kinh doanh',
        position: 'Trưởng phòng Kinh doanh',
        isActive: true,
      },
      {
        fullName: 'Lê Văn Cường',
        email: 'employee1@chatbot.com',
        phone: '0369852147',
        password: 'employee123',
        role: UserRole.EMPLOYEE,
        department: 'Phòng IT',
        position: 'Senior Developer',
        isActive: true,
      },
      {
        fullName: 'Phạm Thị Dung',
        email: 'employee2@chatbot.com',
        phone: '0741258963',
        password: 'employee123',
        role: UserRole.EMPLOYEE,
        department: 'Phòng Marketing',
        position: 'Marketing Specialist',
        isActive: false,
      },
      {
        fullName: 'Hoàng Văn Minh',
        email: 'manager2@chatbot.com',
        phone: '0852741963',
        password: 'manager123',
        role: UserRole.MANAGER,
        department: 'Phòng Kỹ thuật',
        position: 'Trưởng phòng Kỹ thuật',
        isActive: true,
      },
    ];

    for (const userData of sampleUsers) {
      try {
        await usersService.create(userData);
        console.log(`✅ Created user: ${userData.email}`);
      } catch (error) {
        if (error.message.includes('Email already exists')) {
          console.log(`⚠️  User already exists: ${userData.email}`);
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
        }
      }
    }

    console.log('👥 Users seeded.');

    // Create sample product groups
    const groups = [
      { name: 'Thời trang', color: '#e91e63' },
      { name: 'Mỹ phẩm', color: '#9c27b0' },
      { name: 'Đồ gia dụng', color: '#3f51b5' },
    ];

    const createdGroups: Record<string, any> = {};
    for (const g of groups) {
      try {
        const res = await productGroupsService.create(g);
        createdGroups[g.name] = res;
        console.log(`✅ Created product group: ${g.name}`);
      } catch (error) {
        const exists = await productGroupsService.findAll();
        const found = exists.data.find((x: any) => x.name === g.name);
        if (found) {
          createdGroups[g.name] = found;
          console.log(`⚠️  Product group already exists: ${g.name}`);
        } else {
          console.error(`❌ Error creating group ${g.name}:`, error?.message || error);
        }
      }
    }

    // Pick a creator
    const admin = await usersService.findAll().then((us: any) => Array.isArray(us) ? us.find((u: any) => u.email === 'admin@chatbot.com') || us[0] : null);

    // Create sample products
    const prods = [
      {
        name: 'Áo thun basic',
        groupName: 'Thời trang',
        price: 150000,
        currency: ProductCurrency.VND,
        status: ProductStatus.ACTIVE,
        stock: 120,
        description: 'Áo thun cotton 100% thoáng mát.',
        attributes: [ { key: 'màu', value: 'đen' }, { key: 'size', value: 'M' } ],
        images: ['https://picsum.photos/seed/tee/600/400'],
      },
      {
        name: 'Son môi matte',
        groupName: 'Mỹ phẩm',
        price: 299000,
        currency: ProductCurrency.VND,
        status: ProductStatus.ACTIVE,
        stock: 45,
        description: 'Chất son lì, lâu trôi.',
        attributes: [ { key: 'màu', value: 'Đỏ cam' } ],
        images: ['https://picsum.photos/seed/lip/600/400'],
      },
      {
        name: 'Ấm siêu tốc 1.8L',
        groupName: 'Đồ gia dụng',
        price: 459000,
        currency: ProductCurrency.VND,
        status: ProductStatus.ACTIVE,
        stock: 30,
        description: 'Công suất 1800W, đun sôi nhanh.',
        attributes: [ { key: 'công suất', value: '1800W' } ],
        images: ['https://picsum.photos/seed/kettle/600/400'],
      },
    ];

    for (const p of prods) {
      const g = createdGroups[p.groupName];
      if (!g?._id) {
        console.warn(`⚠️  Skip product ${p.name}: missing group ${p.groupName}`);
        continue;
      }
      try {
        await productsService.create({
          groupId: g._id,
          name: p.name,
          price: p.price,
          currency: p.currency,
          status: p.status,
          stock: p.stock,
          description: p.description,
          attributes: p.attributes as any,
          images: p.images,
          createdBy: admin?._id,
        } as any);
        console.log(`✅ Created product: ${p.name}`);
      } catch (error) {
        console.log(`⚠️  Product may already exist: ${p.name}`);
      }
    }

    console.log('🎉 Seeding completed!');

    // Create sample fanpages
    const fanpages = [
      {
        pageId: 'fp_test_fashion_2024',
        pageName: 'Thời Trang Sài Gòn',
        accessToken: 'EAAGtest123tokenforFashionPage456789',
        status: FanpageStatus.ACTIVE,
        connectedAt: new Date('2024-01-15T10:30:00.000Z'),
        lastRefreshed: new Date('2024-09-20T14:25:00.000Z'),
        connectedBy: admin?._id,
        categories: ['thời trang', 'retail'],
        avatarUrl: 'https://picsum.photos/seed/fashion/200/200',
        subscriberCount: 15420,
        defaultProductGroupId: createdGroups['Thời trang']?._id,
        webhookSubscribed: true,
        messageQuota: 50000,
        messagesSentThisMonth: 12340,
        aiEnabled: true,
        timeZone: 'Asia/Ho_Chi_Minh',
      },
      {
        pageId: 'fp_beauty_store_vn',
        pageName: 'Beauty Store Vietnam',
        accessToken: 'EAAGbeauty987tokentest654321expired',
        status: FanpageStatus.EXPIRED,
        connectedAt: new Date('2024-03-10T08:15:00.000Z'),
        lastRefreshed: new Date('2024-07-15T16:45:00.000Z'),
        connectedBy: admin?._id,
        categories: ['mỹ phẩm', 'beauty', 'skincare'],
        avatarUrl: 'https://picsum.photos/seed/beauty/200/200',
        subscriberCount: 8750,
        defaultProductGroupId: createdGroups['Mỹ phẩm']?._id,
        webhookSubscribed: false,
        messageQuota: 25000,
        messagesSentThisMonth: 5670,
        aiEnabled: false,
        timeZone: 'Asia/Ho_Chi_Minh',
      },
      {
        pageId: 'fp_home_appliances',
        pageName: 'Đồ Gia Dụng Thông Minh',
        accessToken: 'EAAGhome111tokenactive999888777',
        status: FanpageStatus.ACTIVE,
        connectedAt: new Date('2024-05-20T13:45:00.000Z'),
        connectedBy: admin?._id,
        categories: ['đồ gia dụng', 'smart home'],
        avatarUrl: 'https://picsum.photos/seed/appliance/200/200',
        subscriberCount: 6320,
        defaultProductGroupId: createdGroups['Đồ gia dụng']?._id,
        webhookSubscribed: true,
        messageQuota: 30000,
        messagesSentThisMonth: 2890,
        aiEnabled: true,
        timeZone: 'Asia/Ho_Chi_Minh',
      },
      {
        pageId: 'fp_demo_removed_page',
        pageName: 'Demo Page (Removed)',
        accessToken: 'EAAGremoved000invalid111222',
        status: FanpageStatus.REMOVED,
        connectedAt: new Date('2024-02-01T09:00:00.000Z'),
        lastRefreshed: new Date('2024-06-01T12:00:00.000Z'),
        connectedBy: admin?._id,
        categories: ['demo', 'test'],
        subscriberCount: 0,
        webhookSubscribed: false,
        messageQuota: 10000,
        messagesSentThisMonth: 0,
        aiEnabled: false,
        timeZone: 'Asia/Ho_Chi_Minh',
      }
    ];

    for (const fp of fanpages) {
      try {
        await fanpagesService.create(fp as any);
        console.log(`✅ Created fanpage: ${fp.pageName} (${fp.pageId})`);
      } catch (error) {
        if (error.message?.includes('pageId already exists') || error.code === 11000) {
          console.log(`⚠️  Fanpage already exists: ${fp.pageName} (${fp.pageId})`);
        } else {
          console.error(`❌ Error creating fanpage ${fp.pageName}:`, error.message);
        }
      }
    }

    console.log('📄 Fanpages seeded.');

    // Create sample conversations and messages
    const activePages = Array.isArray(await fanpagesService.findAll()) ? 
      (await fanpagesService.findAll()).filter((f: any) => f.status === 'active') : [];
    
    if (activePages.length > 0) {
      const conversations = [
        {
          pageId: activePages[0].pageId,
          psid: 'user_12345678901234567',
          status: 'open',
          lastMessage: 'Cho mình xem các mẫu áo thun mới nhất',
          lastUpdated: new Date('2024-09-23T10:15:00.000Z'),
        },
        {
          pageId: activePages[0].pageId,
          psid: 'user_98765432109876543',
          status: 'pending',
          lastMessage: 'Tôi muốn đổi trả sản phẩm',
          lastUpdated: new Date('2024-09-23T09:30:00.000Z'),
        },
        {
          pageId: activePages.length > 1 ? activePages[1].pageId : activePages[0].pageId,
          psid: 'user_11111111111111111',
          status: 'open',
          lastMessage: 'Son màu gì đẹp nhất vậy shop?',
          lastUpdated: new Date('2024-09-23T11:45:00.000Z'),
        },
      ];

      for (let i = 0; i < conversations.length; i++) {
        const convData = conversations[i];
        try {
          const conversation = await conversationsService.create({
            id: `conv_${Date.now()}_${i}`,
            ...convData,
            lastUpdated: convData.lastUpdated.toISOString(),
          });

          console.log(`✅ Created conversation: ${convData.psid} on ${convData.pageId}`);

          // Create sample messages for each conversation
          const messages = [
            {
              conversationId: (conversation as any)._id.toString(),
              pageId: convData.pageId,
              psid: convData.psid,
              direction: 'in',
              senderType: 'customer',
              text: convData.lastMessage,
              attachments: [],
              status: 'received',
              createdAt: convData.lastUpdated.toISOString(),
            },
            {
              conversationId: (conversation as any)._id.toString(),
              pageId: convData.pageId,
              psid: convData.psid,
              direction: 'out',
              senderType: 'bot',
              text: i === 0 ? 'Xin chào! Shop có nhiều mẫu áo thun đẹp. Bạn thích màu gì ạ?' :
                    i === 1 ? 'Chúng tôi sẽ hỗ trợ bạn đổi trả. Vui lòng cho biết mã đơn hàng.' :
                    'Chào bạn! Shop có son đỏ cam và đỏ cherry rất đẹp. Bạn muốn xem không?',
              attachments: [],
              status: 'sent',
              createdAt: new Date(convData.lastUpdated.getTime() + 60000).toISOString(),
            },
          ];

          for (const msgData of messages) {
            try {
              await messagesService.create(msgData as any);
              console.log(`✅ Created message: ${msgData.direction} - ${msgData.text.substring(0, 30)}...`);
            } catch (error) {
              console.log(`⚠️  Message may already exist for conversation ${convData.psid}`);
            }
          }

        } catch (error) {
          if (error.message?.includes('Hội thoại đã tồn tại') || error.code === 11000) {
            console.log(`⚠️  Conversation already exists: ${convData.psid} on ${convData.pageId}`);
          } else {
            console.error(`❌ Error creating conversation ${convData.psid}:`, error.message);
          }
        }
      }

      console.log('💬 Conversations and messages seeded.');
    }

    console.log('🎉 Full seeding completed!');

    // Display statistics
    const stats = await usersService.getStatistics();
    const allFanpages = await fanpagesService.findAll();
    console.log('📊 Current Statistics:');
    console.log(`   Total users: ${stats.total}`);
    console.log(`   Active users: ${stats.active}`);
    console.log(`   Inactive users: ${stats.inactive}`);
    console.log(`   Directors: ${stats.roleDistribution.director || 0}`);
    console.log(`   Managers: ${stats.roleDistribution.manager || 0}`);
    console.log(`   Employees: ${stats.roleDistribution.employee || 0}`);
    console.log(`   Total fanpages: ${Array.isArray(allFanpages) ? allFanpages.length : 0}`);
    
    if (Array.isArray(allFanpages)) {
      const activePages = allFanpages.filter((f: any) => f.status === 'active').length;
      const expiredPages = allFanpages.filter((f: any) => f.status === 'expired').length;
      const removedPages = allFanpages.filter((f: any) => f.status === 'removed').length;
      const subscribedPages = allFanpages.filter((f: any) => f.webhookSubscribed).length;
      
      console.log(`   Active fanpages: ${activePages}`);
      console.log(`   Expired fanpages: ${expiredPages}`);
      console.log(`   Removed fanpages: ${removedPages}`);
      console.log(`   Webhook subscribed: ${subscribedPages}`);
    }
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }

  await app.close();
}

seed();