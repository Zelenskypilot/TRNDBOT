require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const bot = new Telegraf(process.env.BOT_TOKEN);
const apiKey = process.env.API_KEY;
const apiBaseURL = 'https://trendifysmm.com/api/v2';

app.get('/', (req, res) => {
  res.send('Trendifysmm Bot is running...');
});

app.listen(PORT, () => {
  console.log(`HTTPS server is running on port ${PORT}`);
});

let userState = {};

const serviceMinimumAmounts = {
  7128: 10,
  6443: 10,
  5333: 10,
  6449: 10,
  6828: 10,
  6827: 10,
  5457: 10,
  5458: 50,
  5459: 15,
  6784: 50,
  5637: 50,
  5611: 50,
  6785: 10,
  6786: 10,
  5612: 10,
  5610: 10,
  6159: 10,
  5639: 100,
  7215: 100,
  6793: 100,
  7221: 100,
  5635: 100,
  5634: 100,
  6160: 20,
  6153: 50
};

bot.start(async (ctx) => {
  userState[ctx.from.id] = { stage: 'start' };
  await ctx.reply(
    '🎉 Welcome to the Trendifysmm SMM Panel Bot! To use this bot, you must first join our channel.',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Join our channel', url: 'https://t.me/trendifysmmtelebot' }],
          [{ text: 'Confirm join', callback_data: 'confirm_join' }]
        ]
      }
    }
  );
});

bot.action('confirm_join', async (ctx) => {
  try {
    const chatMember = await bot.telegram.getChatMember('@trendifysmmtelebot', ctx.from.id);
    if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
      await ctx.reply('Thank you for joining our channel! How can I assist you today?', {
        reply_markup: {
          keyboard: [
            ['🆕 New Order', '💰 Wallet'],
            ['❓ FAQ', '📞 Support', '📋 Order Status', '👮 ADMIN'],
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

const resetUserState = async (ctx) => {
  userState[ctx.from.id] = null;
};

bot.hears('📞 Support', async (ctx) => {
  await resetUserState(ctx);
  await ctx.reply('How can we assist you? Please choose one of the following options:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📱 Contact via WhatsApp', url: 'https://wa.me/+255747437093' }],
        [{ text: '📞 Call Us', url: 'tel:+255747437093' }],
      ]
    }
  });
});

bot.hears('💰 Wallet', async (ctx) => {
  await resetUserState(ctx);
  try {
    const { data: wallet } = await axios.get(`${apiBaseURL}?action=balance&key=${apiKey}`);
    await ctx.reply(`💵 Your current wallet balance is: ${wallet.balance}$`);
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to retrieve your wallet balance.');
  }
});

bot.hears('❓ FAQ', async (ctx) => {
  await resetUserState(ctx);
  await ctx.reply(
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

bot.hears('📋 Order Status', async (ctx) => {
  await resetUserState(ctx);
  await ctx.reply('Please enter your order ID:');
  userState[ctx.from.id] = { stage: 'order_status' };
});

bot.hears('👮 ADMIN', async (ctx) => {
  if (ctx.from.id == '5357517490') {
    await resetUserState(ctx);
    await ctx.reply('Admin Panel:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📋 GET ALL BOT USERS LIST', callback_data: 'admin_get_users' }],
          [{ text: '💰 ADD BALANCE TO USER WALLET', callback_data: 'admin_add_balance' }],
          [{ text: '🚫 BLOCK USER FROM BOT', callback_data: 'admin_block_user' }]
        ]
      }
    });
  } else {
    await ctx.reply('🚫 You do not have permission to access this option.');
  }
});

bot.action('admin_get_users', async (ctx) => {
  // Logic to get the list of all bot users by usernames
});

bot.action('admin_add_balance', async (ctx) => {
  // Logic to add balance to a user's wallet
});

bot.action('admin_block_user', async (ctx) => {
  await ctx.reply('Please enter the username of the user to block:');
  userState[ctx.from.id] = { stage: 'admin_block_user' };
});

bot.hears('🆕 New Order', async (ctx) => {
  await resetUserState(ctx);
  await ctx.reply('Please select a service:', {
    reply_markup: {
      inline_keyboard: Object.keys(serviceMinimumAmounts).map(serviceId => 
        [{ text: `Service ${serviceId}`, callback_data: `service_${serviceId}` }]
      )
    }
  });
});

bot.action(/service_\d+/, async (ctx) => {
  const serviceId = ctx.match[0].replace('service_', '');
  userState[ctx.from.id] = { stage: 'confirm_order', service: serviceId };
  await ctx.reply(`You have selected service ID ${serviceId}. Please enter the amount:`);
});

bot.on('text', async (ctx) => {
  const user = userState[ctx.from.id];
  const userText = ctx.message.text;

  if (user && user.stage === 'order_status' && /^\d+$/.test(userText)) {
    try {
      const { data: orderStatus } = await axios.get(`${apiBaseURL}?action=status&order=${userText}&key=${apiKey}`);
      await ctx.reply(
        `📋 Order ID: ${userText}\n` +
        `💵 Charge: ${orderStatus.charge}$\n` +
        `🔢 Start Count: ${orderStatus.start_count}\n` +
        `🚦 Status: ${orderStatus.status}\n` +
        `📉 Remains: ${orderStatus.remains}\n` +
        `💱 Currency: ${orderStatus.currency}`
      );
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Failed to retrieve order status. Please check your Order ID and try again.');
    }
  } else if (user && user.stage === 'admin_block_user') {
    const username = ctx.message.text;
    try {
      await axios.post(`${apiBaseURL}?action=block_user&username=${encodeURIComponent(username)}&key=${apiKey}`);
      await ctx.reply(`🚫 User ${username} has been blocked.`);
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Failed to block the user. Please try again.');
    }
    userState[ctx.from.id] = null;
  } else if (user && user.stage === 'confirm_order') {
    if (/^\d+$/.test(userText)) {
      const minAmount = serviceMinimumAmounts[user.service];
      if (parseInt(userText, 10) < minAmount) {
        await ctx.reply(`❌ The minimum amount for service ID ${user.service} is ${minAmount}. Please enter a higher amount.`);
        return;
      }
      user.amount = parseInt(userText, 10);
      await ctx.reply('Please provide the link for your order:');
      userState[ctx.from.id].stage = 'provide_link';
    } else if (user && user.stage === 'provide_link') {
      user.link = userText;
      await ctx.reply('Please confirm your order by clicking the button below:', {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Confirm Order', callback_data: 'confirm_order' }]
          ]
        }
      });
    } else {
      await ctx.reply('⚠️ Please follow the steps properly.');
    }
  }
});

bot.action('confirm_order', async (ctx) => {
  const user = userState[ctx.from.id];
  if (user && user.stage === 'confirm_order') {
    try {
      const response = await axios.post(`${apiBaseURL}?action=add&service=${user.service}&link=${encodeURIComponent(user.link)}&quantity=${user.amount}&key=${apiKey}`);
      
      if (response.data.order) {
        await ctx.reply(`✅ Your order has been placed successfully!\nOrder ID: ${response.data.order}`);
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

bot.launch();
