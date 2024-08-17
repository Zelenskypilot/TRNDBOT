require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const bot = new Telegraf(process.env.BOT_TOKEN);
const apiKey = process.env.API_KEY;
const channelUsername = 'trendifysmmtelebot'; // Replace with your actual channel username (without @)
const apiBaseURL = 'https://trendifysmm.com/api/v2';

// Basic Express route to keep the app alive
app.get('/', (req, res) => {
  res.send('Trendifysmm Bot is running...');
});

// Listen to the specified port
app.listen(PORT, () => {
  console.log(`HTTPS server is running on port ${PORT}`);
});

// Telegram bot logic
bot.start(async (ctx) => {
  try {
    await ctx.reply(
      '🎉 Welcome to the Trendifysmm SMM Panel Bot! To use this bot, you must first join our channel.',
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Join our channel',
                url: `https://t.me/${channelUsername}`
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
    const chatMember = await bot.telegram.getChatMember(`@${channelUsername}`, ctx.from.id);
    if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
      await ctx.reply('Thank you for joining our channel! How can I assist you today?', {
        reply_markup: {
          keyboard: [
            ['New Order', 'Wallet'],
            ['FAQ', 'Help'],
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
bot.hears('New Order', (ctx) => {
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

// Instagram service actions
const instagramServices = {
  insta_followers: [6443, 7128, 5333, 5341],
  insta_likes: [6828, 6827],
  insta_comments: [5457, 5458, 5459]
};

Object.keys(instagramServices).forEach(service => {
  bot.action(service, async (ctx) => {
    const serviceIDs = instagramServices[service];
    try {
      const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}`);
      const serviceDetails = services.filter(s => serviceIDs.includes(s.service));
      const serviceInfo = serviceDetails.map(s => 
        `📦 Service: ${s.name}\n🗄️ Category: ${s.category}\n💵 Price: ${s.rate}$ per 1000\n`).join('\n');
      
      await ctx.reply(`🔥 Available Services:\n${serviceInfo}\n👇 Enter the order quantity:`);
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Failed to retrieve services.');
    }
  });
});

// TikTok service actions
const tiktokServices = {
  tiktok_followers: [6784, 6785, 6786],
  tiktok_views: [5639, 5634, 5635, 5637],
  tiktok_likes: [5612, 5611, 5610]
};

Object.keys(tiktokServices).forEach(service => {
  bot.action(service, async (ctx) => {
    const serviceIDs = tiktokServices[service];
    try {
      const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}`);
      const serviceDetails = services.filter(s => serviceIDs.includes(s.service));
      const serviceInfo = serviceDetails.map(s => 
        `📦 Service: ${s.name}\n🗄️ Category: ${s.category}\n💵 Price: ${s.rate}$ per 1000\n`).join('\n');
      
      await ctx.reply(`🔥 Available Services:\n${serviceInfo}\n👇 Enter the order quantity:`);
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Failed to retrieve services.');
    }
  });
});

// Facebook service actions
const facebookServices = {
  fb_profile_followers: [7215],
  fb_page_followers: [6793, 7221],
  fb_likes: [6159, 6160, 6153]
};

Object.keys(facebookServices).forEach(service => {
  bot.action(service, async (ctx) => {
    const serviceIDs = facebookServices[service];
    try {
      const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}`);
      const serviceDetails = services.filter(s => serviceIDs.includes(s.service));
      const serviceInfo = serviceDetails.map(s => 
        `📦 Service: ${s.name}\n🗄️ Category: ${s.category}\n💵 Price: ${s.rate}$ per 1000\n`).join('\n');
      
      await ctx.reply(`🔥 Available Services:\n${serviceInfo}\n👇 Enter the order quantity:`);
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Failed to retrieve services.');
    }
  });
});

bot.hears('Back', (ctx) => {
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

// Handling wallet, FAQ, and help commands
bot.hears('Wallet', (ctx) => {
  ctx.reply('🔍 Checking your balance...');
  // Handle wallet logic here
});

bot.hears('FAQ', (ctx) => {
  ctx.reply('❓ Frequently Asked Questions');
  // Handle FAQ logic here
});

bot.hears('Help', (ctx) => {
  ctx.reply('🆘 How can I assist you?');
  // Handle help logic here
});

bot.launch();
console.log('Bot is running...');
