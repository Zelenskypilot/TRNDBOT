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

app.get('/', (req, res) => {
  res.send('Trendifysmm Bot is running...');
});

app.listen(PORT, () => {
  console.log(`HTTPS server is running on port ${PORT}`);
});

bot.start(async (ctx) => {
  try {
    await ctx.reply(
      '🎉 Welcome to the Trendifysmm SMM Panel Bot! To use this bot, you must first join our channel.',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Join our channel', url: `https://t.me/${channelUsername}` }],
            [{ text: 'Confirm join', callback_data: 'confirm_join' }]
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
            ['FAQ', 'Support']
          ],
          resize_keyboard: true,
          one_time_keyboard: true
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

bot.hears('New Order', (ctx) => {
  ctx.reply('Please choose a platform:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📸 Instagram', callback_data: 'platform_instagram' }],
        [{ text: '📘 Facebook', callback_data: 'platform_facebook' }],
        [{ text: '🎵 TikTok', callback_data: 'platform_tiktok' }]
      ]
    }
  });
});

const serviceActions = {
  platform_instagram: 'instagram',
  platform_facebook: 'facebook',
  platform_tiktok: 'tiktok'
};

Object.entries(serviceActions).forEach(([platformCallback, platform]) => {
  bot.action(platformCallback, async (ctx) => {
    try {
      const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}&platform=${platform}`);
      const availableServices = services.filter(s => s.platform === platform);

      const serviceButtons = availableServices.map(s => ({
        text: `📦 ${s.name}`,
        callback_data: `${platform}_${s.id}`
      }));

      await ctx.reply('🔥 Available Services:', {
        reply_markup: {
          inline_keyboard: [
            ...serviceButtons,
            [{ text: '🔙 Back', callback_data: 'back_to_platforms' }]
          ]
        }
      });
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Failed to retrieve services.');
    }
  });
});

bot.action(/(instagram|facebook|tiktok)_(\d+)/, async (ctx) => {
  const [_, platform, serviceId] = ctx.match;
  try {
    const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}&platform=${platform}`);
    const service = services.find(s => s.id == serviceId);
    
    if (service) {
      await ctx.reply(`📦 Service: ${service.name}\n🗄️ Category: ${service.category}\n💵 Price: ${service.rate}$ per 1000\n\nPlease enter the amount:`);
      ctx.session.service = service;
      ctx.session.platform = platform;
    } else {
      await ctx.reply('❌ Service not found.');
    }
  } catch (err) {
    console.error(err);
    ctx.reply('❌ Failed to retrieve service details.');
  }
});

bot.on('text', async (ctx) => {
  if (ctx.session.service) {
    const amount = parseInt(ctx.message.text, 10);
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply('⚠️ Please enter a valid amount.');
    }

    ctx.session.amount = amount;
    await ctx.reply('🔗 Please provide the link:');
    return;
  }

  if (ctx.message.text.startsWith('http')) {
    const link = ctx.message.text;
    try {
      const { data: response } = await axios.post(`${apiBaseURL}?action=create_order&key=${apiKey}`, {
        platform: ctx.session.platform,
        service_id: ctx.session.service.id,
        amount: ctx.session.amount,
        link
      });

      if (response.success) {
        await ctx.reply('✅ Your order has been created successfully!');
      } else {
        await ctx.reply('❌ Failed to create order.');
      }
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ An error occurred while creating the order.');
    } finally {
      delete ctx.session.service;
      delete ctx.session.amount;
      delete ctx.session.platform;
    }
    return;
  }

  if (ctx.message.text === 'Back') {
    return ctx.reply('Please choose a platform:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '📸 Instagram', callback_data: 'platform_instagram' }],
          [{ text: '📘 Facebook', callback_data: 'platform_facebook' }],
          [{ text: '🎵 TikTok', callback_data: 'platform_tiktok' }]
        ]
      }
    });
  }
});

bot.hears('FAQ', (ctx) => {
  ctx.reply(
    '❓ Frequently Asked Questions:\n' +
    '1. How do I place an order?\n\n' +
    '2. What payment methods do you accept?\n\n' +
    '3. How long does it take to deliver?\n\n' +
    '4. What is the refund policy?\n\n' +
    '5. How do I contact support?\n\n' +
    'Please enter the number of the FAQ you want the answer to (1-5).'
  );
});

bot.hears(/^\d+$/, (ctx) => {
  const faqNumber = parseInt(ctx.message.text, 10);
  const faqs = [
    '1. To place an order, choose a platform and service, then provide the necessary details.',
    '2. We accept payments via PayPal, credit card, and bank transfer.',
    '3. Delivery times vary by service. Typically, it takes 1-3 days.',
    '4. Refunds are processed on a case-by-case basis. Please contact support.',
    '5. Contact support via WhatsApp at https://wa.me/message/OV5BS7MPRIMRO1 or call +255747437093.'
  ];

  if (faqNumber >= 1 && faqNumber <= 5) {
    ctx.reply(faqs[faqNumber - 1]);
  } else {
    ctx.reply('⚠️ Please enter a valid FAQ number (1-5).');
  }
});

bot.hears('Support', (ctx) => {
  ctx.reply(
    '📞 Support Information:\n' +
    'For any issues, contact us on WhatsApp: [Support](https://wa.me/message/OV5BS7MPRIMRO1)\n' +
    'Or call us at +255747437093'
  );
});

bot.launch();
console.log('Bot is running...');
