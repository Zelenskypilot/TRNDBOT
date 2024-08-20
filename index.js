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

// Start command and custom keyboard with the ADMIN button for the admin user
bot.start((ctx) => {
  const keyboard = {
    reply_markup: {
      keyboard: [
        [{ text: '🆕 New Order' }, { text: '💰 Wallet' }],
        [{ text: '📞 Support' }, { text: '❓ FAQ' }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    }
  };

  // Add the ADMIN button if the user is the admin
  if (ctx.from.id === 5357517490) { // Replace with your admin's Telegram ID
    keyboard.reply_markup.keyboard.push([{ text: 'ADMIN' }]);
  }

  ctx.reply('🎉 Welcome to the Trendifysmm Marketing Agency Admin Bot! I can help manage www.trendifysmm.com website.', keyboard);
});

// Handle the "New Order" button
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

// Handle user input after selecting a service
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
    const minRequired = 1; // Set minimum required amount here

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
  } else if (user && user.stage === 'add_balance') {
    const input = ctx.message.text;
    const [username, amount] = input.split(':');
    
    if (username && amount && !isNaN(amount)) {
      try {
        // Implement logic to add balance to the user's wallet
        await ctx.reply(`✅ Successfully added ${amount}$ to ${username}'s wallet.`);
        userState[ctx.from.id] = null; // Reset admin state
      } catch (err) {
        console.error(err);
        await ctx.reply('❌ Failed to add balance.');
      }
    } else {
      await ctx.reply('⚠️ Invalid format. Please use the format `username:amount`.');
    }
  } else if (user && user.stage === 'block_user') {
    const username = ctx.message.text;
    
    try {
      // Implement logic to block the user from the bot
      await ctx.reply(`🚫 Successfully blocked ${username} from the bot.`);
      userState[ctx.from.id] = null; // Reset admin state
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Failed to block the user.');
    }
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

// Handle the "Support" button
bot.hears('📞 Support', (ctx) => {
  userState[ctx.from.id] = null; // Cancel any ongoing flow
  ctx.reply('How can we assist you? Please choose one of the following options:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 Contact via WhatsApp', url: 'https://wa.me/message/OV5BS7MPRIMRO1' }],
        [{ text: '📞 Call Us', url: 'tel:+255747437093' }],
      ]
    }
  });
});

// Handle the "Wallet" button
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

// Handle the "FAQ" button
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
          [{ text: '🔍 Learn more', callback_data: 'learn_more' }]
        ]
      }
    }
  );
});

// Handle "Learn more" callback for FAQ
bot.action('learn_more', (ctx) => {
  ctx.reply(
    'Here are the answers to the most common questions:\n\n' +
    '1️⃣ How to create an order?\n' +
    'To create an order, click on the "🆕 New Order" button and follow the instructions.\n\n' +
    '2️⃣ How to check my order status?\n' +
    'After placing an order, you can check its status by selecting "📦 Check Order Status" and entering your order ID.\n\n' +
    '3️⃣ What payment methods are accepted?\n' +
    'We accept various payment methods including credit cards, cryptocurrencies, and other online payment gateways.\n\n' +
    '4️⃣ How long does it take to deliver?\n' +
    'The delivery time varies depending on the service, but most orders are delivered within a few hours.\n\n' +
    '5️⃣ What should I do if I face an issue?\n' +
    'If you encounter any issues, please contact our support by clicking "📞 Support" and choose your preferred contact method.'
  );
});

// Handle the "ADMIN" button, available only to the admin user
bot.hears('ADMIN', (ctx) => {
  if (ctx.from.id === 5357517490) { // Replace with your admin's Telegram ID
    ctx.reply('🛠 Admin Panel:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👥 GET ALL BOT USERS LIST', callback_data: 'get_users_list' }],
          [{ text: '💵 ADD BALANCE TO USER WALLET', callback_data: 'add_balance' }],
          [{ text: '🚫 BLOCK USER FROM BOT', callback_data: 'block_user' }]
        ]
      }
    });
  } else {
    ctx.reply('❌ You do not have permission to access this feature.');
  }
});

// Handle "GET ALL BOT USERS LIST" callback
bot.action('get_users_list', async (ctx) => {
  if (ctx.from.id === 5357517490) { // Admin check
    try {
      // Fetch users list (this requires implementation based on your backend)
      const users = await getAllUsers(); // Define this function according to your database
      const userNames = users.map(user => user.username).join('\n');

      await ctx.reply(`👥 List of all bot users:\n${userNames}`);
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Failed to retrieve the users list.');
    }
  }
});

// Handle "ADD BALANCE TO USER WALLET" callback
bot.action('add_balance', (ctx) => {
  if (ctx.from.id === 5357517490) { // Admin check
    ctx.reply('📝 Please enter the username and the amount in the format: `username:amount`');
    userState[ctx.from.id] = { stage: 'add_balance' }; // Set the state for adding balance
  }
});

// Handle "BLOCK USER FROM BOT" callback
bot.action('block_user', (ctx) => {
  if (ctx.from.id === 5357517490) { // Admin check
    ctx.reply('🚫 Please enter the username of the user to block:');
    userState[ctx.from.id] = { stage: 'block_user' }; // Set the state for blocking a user
  }
});

// Launch the bot
bot.launch().then(() => {
  console.log('Bot started successfully');
}).catch(err => {
  console.error('Failed to start the bot:', err);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

// Dummy function to simulate getting all users (replace this with your database logic)
async function getAllUsers() {
  return [
    { username: 'user1' },
    { username: 'user2' },
    { username: 'user3' }
    // Add more users as needed
  ];
           }
