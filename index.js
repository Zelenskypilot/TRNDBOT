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
let walletBalances = {}; // Mock wallet balance for users
let adminId = '5357517490'; // Admin Telegram ID

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
            ['📞 Support'],
            ['ADMIN'],
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

// Add logic for the Admin commands
bot.hears('ADMIN', (ctx) => {
  if (ctx.from.id.toString() === adminId) {
    ctx.reply('Admin Panel:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'GET ALL BOT USERS LIST', callback_data: 'get_all_users' }],
          [{ text: 'ADD BALANCE TO USER WALLET', callback_data: 'add_balance' }],
          [{ text: 'BLOCK USER FROM BOT', callback_data: 'block_user' }]
        ]
      }
    });
  } else {
    ctx.reply('⚠️ You are not authorized to access this option.');
  }
});

bot.action('get_all_users', (ctx) => {
  const allUsers = Object.keys(userState).map(id => `- User ID: ${id}`).join('\n');
  ctx.reply(`📋 List of all bot users:\n${allUsers}`);
});

bot.action('add_balance', (ctx) => {
  userState[ctx.from.id] = { stage: 'enter_username_for_balance' };
  ctx.reply('Enter the username of the user you want to add balance to:');
});

bot.action('block_user', (ctx) => {
  userState[ctx.from.id] = { stage: 'enter_username_for_block' };
  ctx.reply('Enter the username of the user you want to block:');
});

bot.on('text', async (ctx) => {
  const userText = ctx.message.text;
  const user = userState[ctx.from.id];

  if (user && user.stage === 'enter_username_for_balance') {
    userState[ctx.from.id].username = userText;
    userState[ctx.from.id].stage = 'enter_amount_for_balance';
    ctx.reply(`Enter the amount you want to add to ${userText}'s wallet:`);
  } else if (user && user.stage === 'enter_amount_for_balance') {
    const username = user.username;
    const amount = parseFloat(userText);
    if (amount > 0) {
      walletBalances[username] = (walletBalances[username] || 0) + amount;
      ctx.reply(`✅ Added ${amount} to ${username}'s wallet. Current balance: ${walletBalances[username]}`);
      userState[ctx.from.id] = null; // Reset the user state after adding balance
    } else {
      ctx.reply('⚠️ Please enter a valid amount.');
    }
  } else if (user && user.stage === 'enter_username_for_block') {
    const username = userText;
    userState[username] = { blocked: true };
    ctx.reply(`🚫 User ${username} has been blocked.`);
    userState[ctx.from.id] = null; // Reset the user state after blocking
  } else {
    // Existing logic for selecting service, entering amount, etc.
  }
});

// Confirm order logic with wallet balance check
bot.action('confirm_order', async (ctx) => {
  const user = userState[ctx.from.id];
  if (user && user.stage === 'confirm_order') {
    try {
      const username = ctx.from.username;
      const serviceId = user.service;
      const amount = user.amount;
      const costPerThousand = 0.5; // Example rate, should be fetched from API
      const totalCost = (amount / 1000) * costPerThousand;

      if (walletBalances[username] >= totalCost) {
        walletBalances[username] -= totalCost;
        await ctx.reply(`🚀 Processing your order...`);

        const response = await axios.post(`${apiBaseURL}?action=add&service=${serviceId}&link=${encodeURIComponent(user.link)}&quantity=${amount}&key=${apiKey}`);
        
        if (response.data.order) {
          await ctx.reply(`✅ Your order has been placed successfully! Order ID: ${response.data.order}`);
        } else {
          await ctx.reply('❌ Failed to place the order. Please try again.');
        }

        userState[ctx.from.id] = null; // Reset the user state after order is placed
      } else {
        ctx.reply('❌ Insufficient balance. Please add funds to your wallet.');
      }
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Failed to place the order. Please try again.');
    }
  }
});

// Order status command
bot.hears('🆕 Check Order Status', (ctx) => {
  userState[ctx.from.id] = { stage: 'enter_order_id' };
  ctx.reply('Please enter your order ID:');
});

bot.on('text', async (ctx) => {
  const userText = ctx.message.text;
  const user = userState[ctx.from.id];

  if (user && user.stage === 'enter_order_id') {
    const orderId = userText;
    try {
      const response = await axios.get(`${apiBaseURL}?action=status&order=${orderId}&key=${apiKey}`);
      const { charge, start_count, status, remains, currency } = response.data;

      await ctx.reply(`📋 Order Status:\n- Charge: ${charge} ${currency}\n- Start Count: ${start_count}\n- Status: ${status}\n- Remains: ${remains}`);
      
      userState[ctx.from.id] = null; // Reset the user state after checking order status
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Failed to fetch the order status. Please try again.');
    }
  }
});

// Support command
bot.hears('📞 Support', async (ctx) => {
  try {
    await ctx.reply('For support, you can contact us via the following methods:', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '📞 Call Us', url: 'tel:+255747437093' },
            { text: '💬 WhatsApp', url: 'https://wa.me/message/OV5BS7MPRIMRO1' }
          ]
        ]
      }
    });
  } catch (err) {
    console.error(err);
  }
});

// Launch the bot
bot.launch();
