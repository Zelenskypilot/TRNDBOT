require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');

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

// New Order command
bot.hears('🆕 New Order', async (ctx) => {
  userState[ctx.from.id] = { stage: 'select_service' }; // Set user state to selecting service

  try {
    // Get the list of all services from the API
    const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}`);
    
    // Filter services by the predefined IDs
    const serviceIDs = [
      6443, 7128, 5333, 6449, 6828, 6827, 5457, 5458, 5459, 6784,
      6785, 6786, 5639, 5634, 5635, 5637, 5612, 5611, 5610, 7215,
      6793, 7221, 6159, 6160, 6153
    ];

    const serviceDetails = services.filter(s => serviceIDs.includes(s.service));
    const serviceInfo = serviceDetails.map((s, index) =>
      `${index + 1}. 📦 Service: ${s.name}\n🗄️ Category: ${s.category}\n💵 Price: ${s.rate}$ per 1000\n`).join('\n');

    await ctx.reply(`🔥 Available Services:\n${serviceInfo}\n👇 Select the service by entering its number:`);
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to retrieve services.');
  }
});

// Capture user's service selection by number
bot.on('text', async (ctx) => {
  const userText = ctx.message.text;
  const user = userState[ctx.from.id];

  if (user && user.stage === 'select_service' && /^\d+$/.test(userText)) {
    const serviceIndex = parseInt(userText, 10) - 1;
    const serviceIDs = [
      6443, 7128, 5333, 6449, 6828, 6827, 5457, 5458, 5459, 6784,
      6785, 6786, 5639, 5634, 5635, 5637, 5612, 5611, 5610, 7215,
      6793, 7221, 6159, 6160, 6153
    ];

    if (serviceIndex >= 0 && serviceIndex < serviceIDs.length) {
      userState[ctx.from.id].service = serviceIDs[serviceIndex];
      userState[ctx.from.id].stage = 'enter_amount';
      await ctx.reply(`You selected service #${userText}.\nPlease enter the amount:`);
    } else {
      await ctx.reply('⚠️ Please enter a valid service number.');
    }
  } else if (user && user.stage === 'enter_amount' && /^\d+$/.test(userText)) {
    const amount = parseInt(userText, 10);
    const serviceId = user.service;
    const minRequired = minAmount[serviceId] || 1;

    if (amount >= minRequired) {
      userState[ctx.from.id].amount = amount;
      userState[ctx.from.id].stage = 'enter_link';
      await ctx.reply(`You entered amount: ${userText}. Please provide the link:`);
    } else {
      await ctx.reply(`⚠️ The minimum amount for this service is ${minRequired}. Please enter a valid amount.`);
    }
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
      const response = await axios.post(`${apiBaseURL}?action=add&service=${user.service}&link=${encodeURIComponent(user.link)}&quantity=${user.amount}&key=${apiKey}`);
      
      if (response.data.order) {
        await ctx.reply('✅ Your order has been placed successfully!');
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
  userState[ctx.from.id] = null; // Cancel any ongoing flow
  ctx.reply('How can we assist you? Please choose one of the following options:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 Contact via WhatsApp', url: 'https://wa.me/+123456789' }],
        [{ text: '📞 Call Us', url: 'tel:+123456789' }],
      ]
    }
  });
});

// Wallet button logic
bot.hears('💰 Wallet', async (ctx) => {
  userState[ctx.from.id] = null; // Cancel any ongoing flow
  try {
    const { data: wallet } = await axios.get(`${apiBaseURL}?action=balance&key=${apiKey}`);
    await ctx.reply(`💵 Your current wallet balance is: ${wallet.balance}$`);
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to retrieve your wallet balance.');
  }
});

// FAQ button logic
bot.hears('❓ FAQ', (ctx) => {
  userState[ctx.from.id] = null; // Cancel any ongoing flow
  ctx.reply(
    'Frequently Asked Questions (FAQ):\n' +
    '1️⃣ How to create an order?\n' +
    '2️⃣ How to check my order status?\n' +
    '3️⃣ What payment methods are accepted?\n' +
    '4️⃣ How long does it take to deliver?\n' +
    '5️⃣ What should I do if I face an issue?',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔍 Learn more', callback_data: 'faq_details' }]
        ]
      }
    }
  );
});

bot.action('faq_details', (ctx) => {
  ctx.reply(
    '1️⃣ To create an order, select "🆕 New Order" from the main menu, then follow the steps.\n' +
    '2️⃣ To check your order status, go to "📞 Support" and choose "Check Order Status" or visit our website.\n' +
    '3️⃣ We accept various payment methods including credit cards, PayPal, and cryptocurrencies.\n' +
    '4️⃣ Delivery time depends on the service you order. Most orders are completed within 24-48 hours.\n' +
    '5️⃣ If you encounter any issues, please contact our support team via "📞 Support" for assistance.'
  );
});

// Start the bot
bot.launch().then(() => {
  console.log('Bot has been launched successfully.');
}).catch((err) => {
  console.error('Failed to launch bot:', err);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
