require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const bot = new Telegraf(process.env.BOT_TOKEN);
const apiKey = process.env.API_KEY;
const apiBaseURL = 'https://trendifysmm.com/api/v2';

// Basic Express route to keep the app alive
app.get('/', (req, res) => {
  res.send('Trendifysmm Bot is running...');
});

// Listen to the specified port
app.listen(PORT, () => {
  console.log(`HTTPS server is running on port ${PORT}`);
});

// Track conversation state
let userState = {};

// Load user states from file
const stateFilePath = 'userState.json';
if (fs.existsSync(stateFilePath)) {
  const savedStates = fs.readFileSync(stateFilePath, 'utf-8');
  userState = JSON.parse(savedStates);
}

// Save user states to file periodically
setInterval(() => {
  fs.writeFileSync(stateFilePath, JSON.stringify(userState, null, 2));
}, 10000);

// Handle the /start command
bot.start(async (ctx) => {
  userState[ctx.from.id] = { stage: 'start' }; // Reset user state on start
  try {
    await ctx.reply(
      '🎉 Welcome to the Trendifysmm SMM Panel Bot! To use this bot, you must first join our channel.',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Join our channel',
                url: 'https://t.me/trendifysmmtelebot'
              },
            ],
            [
              {
                text: 'Confirm join',
                callback_data: 'confirm_join'
              }
            ]
          ]
        }
      }
    );
  } catch (err) {
    console.error(err);
  }
});

// Handle the "Confirm join" button
bot.action('confirm_join', async (ctx) => {
  try {
    const chatMember = await bot.telegram.getChatMember('@trendifysmmtelebot', ctx.from.id);
    if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
      await ctx.reply('Thank you for joining our channel! How can I assist you today?', {
        reply_markup: {
          keyboard: [
            ['🆕 New Order', '💰 Wallet'],
            ['❓ FAQ', '📞 Support'],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        }
      });
    } else {
      await ctx.reply('🚫 You must join our channel to use this bot.');
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ There was an error while checking your subscription status.');
  }
});

// Handle "New Order" command
bot.hears('🆕 New Order', (ctx) => {
  userState[ctx.from.id] = { stage: 'select_platform' }; // Set user state to selecting platform
  ctx.reply('Please choose a platform:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: 'Instagram', callback_data: 'instagram' }],
        [{ text: 'Facebook', callback_data: 'facebook' }],
        [{ text: 'TikTok', callback_data: 'tiktok' }],
      ]
    }
  });
});

// Service categories for each platform
const platformServices = {
  instagram: {
    followers: [6443, 7128, 5333, 5341],
    likes: [6828, 6827],
    comments: [5457, 5458, 5459]
  },
  tiktok: {
    followers: [6784, 6785, 6786],
    views: [5639, 5634, 5635, 5637],
    likes: [5612, 5611, 5610]
  },
  facebook: {
    profile_followers: [7215],
    page_followers: [6793, 7221],
    likes: [6159, 6160, 6153]
  }
};

// Customize message based on selected platform and service
Object.keys(platformServices).forEach(platform => {
  bot.action(platform, async (ctx) => {
    userState[ctx.from.id] = { platform, stage: 'select_category' };
    await ctx.reply(`Select the ${platform} service category:`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👍 Followers', callback_data: `${platform}_followers` }],
          [{ text: '❤️ Likes', callback_data: `${platform}_likes` }],
          [{ text: '💬 Comments', callback_data: `${platform}_comments` }]
        ]
      }
    });
  });
});

// Handle service selection
Object.keys(platformServices).forEach(platform => {
  Object.keys(platformServices[platform]).forEach(category => {
    bot.action(`${platform}_${category}`, async (ctx) => {
      const serviceIDs = platformServices[platform][category];
      userState[ctx.from.id] = { platform, category, serviceIDs, stage: 'select_service' };
      try {
        const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}`);
        const serviceDetails = services.filter(s => serviceIDs.includes(s.service));
        const serviceInfo = serviceDetails.map((s, index) =>
          `${index + 1}. 📦 Service: ${s.name}\n🗄️ Category: ${s.category}\n💵 Price: ${s.rate}$ per 1000\n`).join('\n');

        await ctx.reply(`🔥 Available Services:\n${serviceInfo}\n👇 Select the ${platform} service that you want by its number:`);
      } catch (err) {
        console.error(err);
        ctx.reply('❌ Failed to retrieve services.');
      }
    });
  });
});

// Capture user's service selection by number
bot.on('text', async (ctx) => {
  const userText = ctx.message.text;
  const user = userState[ctx.from.id];

  if (user && user.stage === 'select_service' && /^\d+$/.test(userText)) {
    const serviceIndex = parseInt(userText, 10) - 1;
    if (serviceIndex >= 0 && serviceIndex < user.serviceIDs.length) {
      userState[ctx.from.id].service = user.serviceIDs[serviceIndex];
      userState[ctx.from.id].stage = 'enter_amount';
      await ctx.reply(`You selected service #${userText}.\nPlease enter the amount:`);
    } else {
      await ctx.reply('⚠️ Please enter a valid service number.');
    }
  } else if (user && user.stage === 'enter_amount' && /^\d+$/.test(userText)) {
    userState[ctx.from.id].amount = parseInt(userText, 10);
    userState[ctx.from.id].stage = 'enter_link';
    await ctx.reply(`You entered amount: ${userText}. Please provide the link:`);
  } else if (user && user.stage === 'enter_link') {
    userState[ctx.from.id].link = userText;
    userState[ctx.from.id].stage = 'confirm_order';
    await ctx.reply(`You provided the link: ${userText}. Confirm your order.`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Confirm Order', callback_data: 'confirm_order' }]
        ]
      }
    });
  } else {
    await ctx.reply('⚠️ Please follow the steps properly.');
  }
});

// Confirm order logic
bot.action('confirm_order', async (ctx) => {
  const user = userState[ctx.from.id];
  if (user && user.stage === 'confirm_order') {
    try {
      await ctx.reply('🚀 Processing your order...');
      const response = await axios.post(`${apiBaseURL}?action=add`, {
        service: user.service,
        link: user.link,
        quantity: user.amount,
        key: apiKey
      });

      if (response.data.order) {
        await ctx.reply(`✅ Your order has been placed successfully! Order ID: ${response.data.order}`);
      } else {
        await ctx.reply('❌ Failed to place the order. Please try again.');
      }
      userState[ctx.from.id] = null; // Reset the user state after order is placed
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Failed to place the order. Please try again.');
    }
  }
});

// Support button logic
bot.hears('📞 Support', (ctx) => {
  ctx.reply(`📞 Need help? Contact us:
  WhatsApp: https://wa.me/message/OV5LFAMO3EOGE1
  Call: +1234567890`);
});

// FAQ button logic
bot.hears('❓ FAQ', (ctx) => {
  ctx.reply('Select an FAQ number to get the answer:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '1. How does this service work?', callback_data: 'faq_1' }],
        [{ text: '2. What payment methods are accepted?', callback_data: 'faq_2' }],
        [{ text: '3. How can I contact support?', callback_data: 'faq_3' }],
        [{ text: '4. Are there any discounts available?', callback_data: 'faq_4' }],
        [{ text: '5. How long does it take to complete an order?', callback_data: 'faq_5' }]
      ]
    }
  });
});

// Handle FAQ responses
bot.action('faq_1', (ctx) => {
  ctx.reply('Our service provides real-time social media marketing through a user-friendly platform. Simply choose a platform, select a service, and enter the required details to place an order.');
});

bot.action('faq_2', (ctx) => {
  ctx.reply('We accept various payment methods including PayPal, Bitcoin, Ethereum, and major credit cards.');
});

bot.action('faq_3', (ctx) => {
  ctx.reply('You can contact our support team via WhatsApp at https://wa.me/message/OV5LFAMO3EOGE1 or by calling us at +1234567890.');
});

bot.action('faq_4', (ctx) => {
  ctx.reply('Yes, we offer discounts for bulk orders. Contact support for more details.');
});

bot.action('faq_5', (ctx) => {
  ctx.reply('The time to complete an order depends on the service you select. Most orders are completed within a few hours.');
});

// Capture other commands and text
bot.on('message', (ctx) => {
  ctx.reply('🚫 I didn\'t understand that command. Please choose an option from the menu or type /start to begin.');
});

// Start the bot
bot.launch();
