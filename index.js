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
  const serviceIDs = [
    6443, 7128, 5333, 6449, 6828, 6827, 5457, 5458, 5459, 6784,
    6785, 6786, 5639, 5634, 5635, 5637, 5612, 5611, 5610, 7215,
    6793, 7221, 6159, 6160, 6153
  ];

  if (/^\d+$/.test(userText)) {
    const serviceIndex = parseInt(userText, 10) - 1;

    if (serviceIndex >= 0 && serviceIndex < serviceIDs.length) {
      const selectedServiceId = serviceIDs[serviceIndex];
      await ctx.reply(`You selected service #${userText}. Please enter the amount:`);
    } else {
      await ctx.reply('⚠️ Please enter a valid service number.');
    }
  } else if (/^\d+$/.test(userText)) {
    const amount = parseInt(userText, 10);
    const minRequired = 1; // Set minimum required amount here

    if (amount >= minRequired) {
      await ctx.reply(`You entered amount: ${userText}. Please provide the link:`);
    } else {
      await ctx.reply(`⚠️ The minimum amount for this service is ${minRequired}. Please enter a valid amount.`);
    }
  } else {
    await ctx.reply('⚠️ Please follow the steps properly.');
  }
});

// Confirm order logic
bot.action('confirm_order', async (ctx) => {
  try {
    await ctx.reply('🚀 Processing your order...');
    const response = await axios.post(`${apiBaseURL}?action=add&service=${selectedServiceId}&link=${encodeURIComponent(link)}&quantity=${amount}&key=${apiKey}`);
    
    if (response.data.order) {
      await ctx.reply('✅ Your order has been placed successfully!');
    } else {
      await ctx.reply('❌ Failed to place the order. Please try again.');
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to place the order. Please try again.');
  }
});

// Handle the "Support" button
bot.hears('📞 Support', (ctx) => {
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
      // Fetch the list of users from the database or API
      const users = await getAllUsers(); // Implement getAllUsers function
      const userList = users.map(user => `@${user.username}`).join('\n');
      await ctx.reply(`👥 List of all bot users:\n\n${userList}`);
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Failed to retrieve the users list.');
    }
  }
});

// Handle "ADD BALANCE TO USER WALLET" callback
bot.action('add_balance', (ctx) => {
  if (ctx.from.id === 5357517490) { // Admin check
    ctx.reply('💵 Please enter the username of the user you want to add balance to.');
    userState[ctx.from.id] = { stage: 'add_balance' }; // Set the state for adding balance
  }
});

// Handle "BLOCK USER FROM BOT" callback
bot.action('block_user', (ctx) => {
  if (ctx.from.id === 5357517490) { // Admin check
    ctx.reply('🚫 Please enter the username of the user you want to block.');
    userState[ctx.from.id] = { stage: 'block_user' }; // Set the state for blocking user
  }
});

// Function to get all users (you need to implement this according to your backend/database)
async function getAllUsers() {
  // Implement the logic to retrieve all bot users from your database
  // This is a placeholder example
  return [
    { username: 'user1' },
    { username: 'user2' },
    // Add more users here
  ];
}

// Handle user input after selecting an admin action
bot.on('text', async (ctx) => {
  const adminId = 5357517490; // Replace with your admin's Telegram ID
  const userInput = ctx.message.text;

  if (userState[ctx.from.id]?.stage === 'add_balance') {
    // Add balance to the user
    const [username, amount] = userInput.split(' ');
    if (username && amount) {
      try {
        // Implement the logic to add balance to the user's wallet
        await addBalanceToUser(username, amount); // Placeholder function
        await ctx.reply(`✅ Added ${amount}$ to @${username}'s wallet.`);
      } catch (err) {
        console.error(err);
        await ctx.reply('❌ Failed to add balance.');
      }
    } else {
      await ctx.reply('⚠️ Please enter the username and the amount separated by a space.');
    }
    delete userState[ctx.from.id]; // Clear the state
  } else if (userState[ctx.from.id]?.stage === 'block_user') {
    // Block the user
    const username = userInput;
    if (username) {
      try {
        // Implement the logic to block the user
        await blockUser(username); // Placeholder function
        await ctx.reply(`🚫 Blocked @${username} from using the bot.`);
      } catch (err) {
        console.error(err);
        await ctx.reply('❌ Failed to block the user.');
      }
    } else {
      await ctx.reply('⚠️ Please enter a valid username.');
    }
    delete userState[ctx.from.id]; // Clear the state
  }
});

// Placeholder functions for adding balance and blocking a user
async function addBalanceToUser(username, amount) {
  // Implement your logic to add balance to the user's wallet in your database or API
}

async function blockUser(username) {
  // Implement your logic to block the user in your database or API
}

// Launch the bot
bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
