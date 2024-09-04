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

// Start command and custom keyboard with advanced welcome message
bot.start((ctx) => {
  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔔 Subscribe to Our Channel', url: 'https://t.me/trendifysmmtelebot' }],
        [{ text: '✅ Verify Subscription', callback_data: 'verify_subscription' }],
      ],
    },
  };

  const welcomeMessage = `🎉 Welcome to Trendifysmm.com Bot! 🎉\n\n` +
    `📱 Here, you can easily purchase social media services such as followers, likes, views, and more for all major platforms.\n\n` +
    `👉 To get started, please subscribe to our channel for the latest updates and exclusive offers:\n` +
    `🔗 https://t.me/trendifysmmtelebot`;

  ctx.reply(welcomeMessage, keyboard);
});

// Handle subscription verification
bot.action('verify_subscription', async (ctx) => {
  const userStatus = await bot.telegram.getChatMember('@trendifysmmtelebot', ctx.from.id);
  if (userStatus.status === 'member' || userStatus.status === 'administrator' || userStatus.status === 'creator') {
    ctx.reply(
      '🎉 Subscription verified! You can now use the bot services.',
      {
        reply_markup: {
          keyboard: [
            [{ text: '🆕 New Order' }, { text: '💰 Wallet' }],
            [{ text: '📞 Customer Care' }],
          ],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  } else {
    ctx.reply('⚠️ You must subscribe to our channel before using the bot.');
  }
});

// Handle the "Customer Care" button
bot.hears('📞 Customer Care', (ctx) => {
  ctx.reply('Need help? Contact our support team via WhatsApp:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 WhatsApp Support', url: 'https://wa.me/message/OV5BS7MPRIMRO1' }],
      ],
    },
  });
});

// Handle the "Wallet" button
bot.hears('💰 Wallet', async (ctx) => {
  try {
    const { data: wallet } = await axios.get(`${apiBaseURL}?action=balance&key=${apiKey}`);
    await ctx.reply(`💵 Your current wallet balance is: ${wallet.balance}$`);
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to retrieve your wallet balance.');
  }
});

// Handle the "New Order" button
bot.hears('🆕 New Order', async (ctx) => {
  try {
    const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}`);
    const categories = [...new Set(services.map(s => s.category))];
    
    const categoryButtons = categories.map(category => [{ text: `📱 ${category}`, callback_data: `category_${category}` }]);

    await ctx.reply('Please select a category to view available services:', {
      reply_markup: {
        inline_keyboard: categoryButtons,
      },
    });
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to retrieve services.');
  }
});

// Handle category selection
bot.action(/category_(.+)/, async (ctx) => {
  const category = ctx.match[1];

  try {
    const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}`);
    const filteredServices = services.filter(s => s.category === category);

    const serviceInfo = filteredServices.map((s, index) =>
      `${index + 1}. 📦 Service: ${s.name}\n💵 Price: ${s.rate}$ per 1000\n`
    ).join('\n');

    await ctx.reply(`Available services in ${category}:\n\n${serviceInfo}\n👇 Select a service by entering its number:`);
    ctx.session.services = filteredServices; // Store the services in session
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to retrieve services.');
  }
});

// Handle user input for selecting a service and placing an order
bot.on('text', async (ctx) => {
  const userText = ctx.message.text;
  const services = ctx.session.services || [];

  if (/^\d+$/.test(userText)) {
    const serviceIndex = parseInt(userText, 10) - 1;

    if (serviceIndex >= 0 && serviceIndex < services.length) {
      const selectedService = services[serviceIndex];
      ctx.session.selectedService = selectedService;  // Store the selected service
      await ctx.reply(`You selected service #${userText}: ${selectedService.name}. Please enter the amount:`);
    } else if (ctx.session.selectedService) {
      const amount = parseInt(userText, 10);
      if (amount > 0) {
        ctx.session.amount = amount;
        await ctx.reply(`You entered amount: ${amount}. Please provide the link:`);
      } else {
        await ctx.reply('⚠️ Please enter a valid amount.');
      }
    } else {
      await ctx.reply('⚠️ Please select a service first by entering its number.');
    }
  } else if (ctx.session.amount) {
    ctx.session.link = userText;  // Store the link
    await ctx.reply('✅ Order details received. Confirming your order...', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Confirm Order', callback_data: 'confirm_order' }],
          [{ text: 'Cancel Order', callback_data: 'cancel_order' }],
        ],
      },
    });
  } else {
    await ctx.reply('⚠️ Please follow the steps properly.');
  }
});

// Confirm order logic
bot.action('confirm_order', async (ctx) => {
  try {
    await ctx.reply('🚀 Processing your order...');
    const { selectedService, amount, link } = ctx.session;

    const response = await axios.post(`${apiBaseURL}?action=add&service=${selectedService.service}&link=${encodeURIComponent(link)}&quantity=${amount}&key=${apiKey}`);
    
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

// Launch the bot
bot.launch();
