require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');
const Iconify = require('@iconify/iconify');

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
            [{ text: '📦 New Order', callback_data: 'new_order' }],
            [{ text: '💼 Wallet', callback_data: 'wallet' }],
            [{ text: '❓ FAQ', callback_data: 'faq' }],
            [{ text: '🆘 Support', callback_data: 'support' }],
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
bot.hears('📦 New Order', (ctx) => {
  ctx.reply('Please choose a platform:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: `${Iconify.renderHTML('fa-brands:instagram')} Instagram`, callback_data: 'instagram' }],
        [{ text: `${Iconify.renderHTML('fa-brands:facebook')} Facebook`, callback_data: 'facebook' }],
        [{ text: `${Iconify.renderHTML('fa-brands:tiktok')} TikTok`, callback_data: 'tiktok' }],
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

// Back button functionality
bot.hears('🔙 Back', (ctx) => {
  ctx.reply('Please choose a platform:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: `${Iconify.renderHTML('fa-brands:instagram')} Instagram`, callback_data: 'instagram' }],
        [{ text: `${Iconify.renderHTML('fa-brands:facebook')} Facebook`, callback_data: 'facebook' }],
        [{ text: `${Iconify.renderHTML('fa-brands:tiktok')} TikTok`, callback_data: 'tiktok' }],
      ]
    }
  });
});

// Wallet, FAQ, and Support commands
bot.hears('💼 Wallet', (ctx) => {
  ctx.reply('🔍 Checking your balance...');
  // Handle wallet logic here
});

bot.hears('❓ FAQ', (ctx) => {
  ctx.reply('❓ Frequently Asked Questions:\n1. How to place an order?\n2. How to track my order?\n3. What is the delivery time?\n4. Can I cancel an order?\n5. What payment methods do you accept?');
});

bot.hears('🆘 Support', (ctx) => {
  ctx.reply('💬 How can I assist you?\n\n📞 Call us: +255747437093\n💬 WhatsApp us: [Click here](https://wa.me/message/OV5BS7MPRIMRO1)', {
    parse_mode: 'Markdown'
  });
});

// Handle the bot's launch
bot.launch();
console.log('Bot is running...');
