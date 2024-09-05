require('dotenv').config();
const express = require('express');
const { Telegraf, session } = require('telegraf');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 3000;
const bot = new Telegraf(process.env.BOT_TOKEN);
const apiKey = process.env.API_KEY;
const apiBaseURL = 'https://trendifysmm.com/api/v2';

// Cache setup with a default TTL (Time-to-Live) of 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

// Basic Express route to keep the app alive
app.get('/', (req, res) => {
  res.send('Trendifysmm Bot is running...');
});

// Listen to the specified port
app.listen(PORT, () => {
  console.log(`HTTPS server is running on port ${PORT}`);
});

// Middleware to enable session management
bot.use(session());

// Helper to make API requests with retries
const fetchWithRetries = async (url, retries = 3, timeout = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await axios.get(url, { timeout });
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
};

// Fetch and cache services data
const getCachedServices = async () => {
  if (cache.has('services')) {
    return cache.get('services');
  }
  const services = await fetchWithRetries(`${apiBaseURL}?action=services&key=${apiKey}`);
  cache.set('services', services);
  return services;
};

// Start command and custom keyboard with new buttons
bot.start(async (ctx) => {
  const keyboard = {
    reply_markup: {
      keyboard: [
        [{ text: '🆕 New Order' }, { text: '💰 Wallet' }],
        [{ text: '📞 Customer Care' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: false,
    }
  };

  const welcomeMessage = `🔥 Welcome to Trendifysmm bot! I can help grow your social media account easily.\n` +
    `Please subscribe to our channel for updates and then verify your subscription to use this bot.`;

  await ctx.reply(welcomeMessage, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📢 Subscribe to Channel', url: 'https://t.me/trendifysmmtelebot' }],
        [{ text: '✅ Verify Subscription', callback_data: 'verify_subscription' }]
      ]
    }
  });

  // Display the custom keyboard after the welcome message
  ctx.reply('Use the options below to start:', keyboard);
});

// Handle subscription verification
bot.action('verify_subscription', async (ctx) => {
  ctx.replyWithChatAction('typing');
  const isSubscribed = true; // Placeholder for subscription status

  if (isSubscribed) {
    await ctx.reply('✅ You have successfully subscribed! You can now use the bot.');
  } else {
    await ctx.reply('❌ You have not subscribed. Please subscribe to the channel and try again.');
  }
});

// Handle the "New Order" button
bot.hears('🆕 New Order', async (ctx) => {
  ctx.replyWithChatAction('typing');
  try {
    const services = await getCachedServices();
    
    // Filter services by the predefined IDs
    const serviceIDs = [7469, 7525, 7521, 7518];
    const serviceDetails = services.filter(s => serviceIDs.includes(s.service));
    const serviceInfo = serviceDetails.map((s, index) =>
      `${index + 1}. 📦 Service: ${s.name}\n🗄️ Category: ${s.category}\n💵 Price: ${s.rate}$ per 1000\n`).join('\n');

    await ctx.reply(`🔥 Available Services:\n${serviceInfo}\n👇 Select the service by entering its number:`);
    
    // Store the list of service IDs in session data
    ctx.session.serviceIDs = serviceIDs;
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to retrieve services.');
  }
});

// Handle user input for ordering services
bot.on('text', async (ctx) => {
  ctx.replyWithChatAction('typing');
  const userText = ctx.message.text;
  const serviceIDs = ctx.session.serviceIDs || [];

  if (/^\d+$/.test(userText)) {
    const serviceIndex = parseInt(userText, 10) - 1;

    if (serviceIndex >= 0 && serviceIndex < serviceIDs.length) {
      const selectedServiceId = serviceIDs[serviceIndex];
      ctx.session.selectedServiceId = selectedServiceId;  // Store the selected service ID
      await ctx.reply(`You selected service #${userText}. Please enter the amount:`);
    } else if (ctx.session.selectedServiceId) {
      const amount = parseInt(userText, 10);
      const minRequired = 1; // Set minimum required amount here

      if (amount >= minRequired) {
        ctx.session.amount = amount; // Store the amount in session data
        await ctx.reply(`You entered amount: ${userText}. Please provide the link:`);
      } else {
        await ctx.reply(`⚠️ The minimum amount for this service is ${minRequired}. Please enter a valid amount.`);
      }
    } else {
      await ctx.reply('⚠️ Please select a service first by entering its number.');
    }
  } else if (ctx.session.amount) {
    ctx.session.link = userText; // Store the link in session data
    await ctx.reply('✅ Order details received. Confirming your order...', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Confirm Order', callback_data: 'confirm_order' }],
          [{ text: 'Cancel Order', callback_data: 'cancel_order' }],
        ]
      }
    });
  } else {
    await ctx.reply('⚠️ Please follow the steps properly.');
  }
});

// Handle "Wallet" button
bot.hears('💰 Wallet', async (ctx) => {
  ctx.replyWithChatAction('typing');
  try {
    const wallet = await fetchWithRetries(`${apiBaseURL}?action=balance&key=${apiKey}`);
    await ctx.reply(`💵 Your current wallet balance is: ${wallet.balance}$`);
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to retrieve your wallet balance.');
  }
});

// Handle "Customer Care" button
bot.hears('📞 Customer Care', (ctx) => {
  ctx.reply('Please contact our support via WhatsApp:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 Contact via WhatsApp', url: 'https://wa.me/message/OV5BS7MPRIMRO1' }]
      ]
    }
  });
});

// Confirm order logic
bot.action('confirm_order', async (ctx) => {
  ctx.replyWithChatAction('typing');
  try {
    const { selectedServiceId, amount, link } = ctx.session;
    const response = await axios.post(`${apiBaseURL}?action=add&service=${selectedServiceId}&link=${encodeURIComponent(link)}&quantity=${amount}&key=${apiKey}`);
    
    if (response.data.order) {
      await ctx.reply(`✅ Your order has been placed successfully! Order ID: ${response.data.order}`);
    } else {
      await ctx.reply('❌ Failed to place the order. Please try again.');
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to place the order. Please try again.');
  }
});

// Middleware to catch unsupported commands or inputs
bot.on('message', (ctx) => {
  ctx.reply('⚠️ Please use the provided buttons to interact with the bot.');
});

bot.launch();
