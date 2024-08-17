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
                text: '📢 Join our channel',
                url: `https://t.me/trendifysmmtelebot`
              },
            ],
            [
              {
                text: '✅ Confirm join',
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
    const chatMember = await bot.telegram.getChatMember(`@trendifysmmtelebot`, ctx.from.id);
    if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
      await ctx.reply('Thank you for joining our channel! How can I assist you today?', {
        reply_markup: {
          keyboard: [
            ['🆕 New Order', '💼 Wallet'],
            ['❓ FAQ', '🆘 Support'],
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

bot.hears('🆕 New Order', (ctx) => {
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

// Platform service actions
const platformServices = {
  instagram: {
    followers: [6443, 7128, 5333, 5341],
    likes: [6828, 6827],
    comments: [5457, 5458, 5459]
  },
  facebook: {
    followers: [7215, 6793, 7221],
    likes: [6159, 6160, 6153]
  },
  tiktok: {
    followers: [6784, 6785, 6786],
    likes: [5612, 5611, 5610],
    views: [5639, 5634, 5635, 5637]
  }
};

Object.keys(platformServices).forEach(platform => {
  bot.action(platform, (ctx) => {
    ctx.reply(`Please choose a service for ${platform.charAt(0).toUpperCase() + platform.slice(1)}:`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '👥 Followers', callback_data: `${platform}_followers` }],
          [{ text: '❤️ Likes', callback_data: `${platform}_likes` }],
          [{ text: '💬 Comments', callback_data: `${platform}_comments` }],
        ]
      }
    });
  });

  Object.keys(platformServices[platform]).forEach(serviceType => {
    bot.action(`${platform}_${serviceType}`, async (ctx) => {
      const serviceIDs = platformServices[platform][serviceType];
      try {
        const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}`);
        const serviceDetails = services.filter(s => serviceIDs.includes(s.service));
        const serviceInfo = serviceDetails.map((s, i) => 
          `${i + 1}. 📦 Service: ${s.name}\n🗄️ Category: ${s.category}\n💵 Price: ${s.rate}$ per 1000\n`).join('\n\n');
        
        await ctx.reply(`🔥 Available Services:\n${serviceInfo}\n👇 Select the service by its number:`);
        ctx.session.serviceDetails = serviceDetails;
      } catch (err) {
        console.error(err);
        ctx.reply('❌ Failed to retrieve services.');
      }
    });
  });
});

bot.on('text', async (ctx) => {
  const text = ctx.message.text.trim();
  const selectedService = ctx.session.serviceDetails && ctx.session.serviceDetails.find((_, i) => text == i + 1);

  if (selectedService) {
    ctx.session.selectedService = selectedService;
    await ctx.reply('👇 Enter the order quantity:');
  } else if (ctx.session.selectedService && !ctx.session.quantity) {
    ctx.session.quantity = text;
    await ctx.reply('🔗 Please provide the link:');
  } else if (ctx.session.selectedService && ctx.session.quantity && !ctx.session.link) {
    ctx.session.link = text;
    await ctx.reply('✅ Confirm your order:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Confirm Order', callback_data: 'confirm_order' }]
        ]
      }
    });
  } else if (/^\d+$/.test(text) && parseInt(text) <= 5) {
    await ctx.reply(`🗒 Answer to FAQ ${text}`);
  } else {
    await ctx.reply('⚠️ Please enter a valid FAQ number (1-5).');
  }
});

bot.action('confirm_order', async (ctx) => {
  const { selectedService, quantity, link } = ctx.session;
  
  try {
    const response = await axios.post(`${apiBaseURL}?action=add&key=${apiKey}&service=${selectedService.service}&quantity=${quantity}&link=${link}`);
    if (response.data.order) {
      await ctx.reply('✅ Your order has been successfully created!');
    } else {
      await ctx.reply('❌ Failed to create order. Please contact support.');
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Error processing your order. Please contact support.');
  }
});

bot.hears('💼 Wallet', (ctx) => {
  ctx.reply('🔍 Checking your balance...');
  // Handle wallet logic here
});

bot.hears('❓ FAQ', (ctx) => {
  ctx.reply('❓ Frequently Asked Questions:\n\n1️⃣ How do I place an order?\n\n2️⃣ What payment methods do you accept?\n\n3️⃣ How long does it take to deliver?\n\n4️⃣ What is the refund policy?\n\n5️⃣ How do I contact support?\n\nPlease select the FAQ number you need an answer for.');
});

bot.hears('🆘 Support', (ctx) => {
  ctx.reply('📞 Contact Support:\n\n💬 WhatsApp: https://wa.me/message/OV5BS7MPRIMRO1\n📞 Call: +255747437093');
});

// Start bot
bot.launch();
console.log('Bot is running...');
