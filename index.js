require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const bot = new Telegraf(process.env.BOT_TOKEN);
const apiKey = process.env.API_KEY;
const channelUsername = 'trendifysmmtelebot';
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
                url: `https://t.me/${channelUsername}`
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
    const chatMember = await bot.telegram.getChatMember(`@${channelUsername}`, ctx.from.id);
    if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
      await ctx.reply('🎉 Thank you for joining our channel! How can I assist you today?', {
        reply_markup: {
          keyboard: [
            ['🆕 New Order', '💼 Wallet'],
            ['❓ FAQ', '📞 Support'],
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
  ctx.reply('🔍 Please choose a platform:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📸 Instagram', callback_data: 'instagram' }],
        [{ text: '📘 Facebook', callback_data: 'facebook' }],
        [{ text: '🎵 TikTok', callback_data: 'tiktok' }],
        [{ text: '🔙 Back', callback_data: 'back_to_main' }],
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
      ctx.session.serviceType = service;
      bot.hears(/^\d+$/, async (ctx) => {
        ctx.session.quantity = ctx.message.text;
        await ctx.reply('🔗 Please send your Instagram link:');
        bot.on('text', async (ctx) => {
          ctx.session.link = ctx.message.text;
          await ctx.reply(`💬 Confirm your order details:\nPlatform: Instagram\nService: ${ctx.session.serviceType}\nQuantity: ${ctx.session.quantity}\nLink: ${ctx.session.link}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Confirm Order', callback_data: 'confirm_order' }],
                [{ text: '🔙 Back', callback_data: 'back_to_new_order' }]
              ]
            }
          });
        });
      });
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
      ctx.session.serviceType = service;
      bot.hears(/^\d+$/, async (ctx) => {
        ctx.session.quantity = ctx.message.text;
        await ctx.reply('🔗 Please send your TikTok link:');
        bot.on('text', async (ctx) => {
          ctx.session.link = ctx.message.text;
          await ctx.reply(`💬 Confirm your order details:\nPlatform: TikTok\nService: ${ctx.session.serviceType}\nQuantity: ${ctx.session.quantity}\nLink: ${ctx.session.link}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Confirm Order', callback_data: 'confirm_order' }],
                [{ text: '🔙 Back', callback_data: 'back_to_new_order' }]
              ]
            }
          });
        });
      });
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
      ctx.session.serviceType = service;
      bot.hears(/^\d+$/, async (ctx) => {
        ctx.session.quantity = ctx.message.text;
        await ctx.reply('🔗 Please send your Facebook link:');
        bot.on('text', async (ctx) => {
          ctx.session.link = ctx.message.text;
          await ctx.reply(`💬 Confirm your order details:\nPlatform: Facebook\nService: ${ctx.session.serviceType}\nQuantity: ${ctx.session.quantity}\nLink: ${ctx.session.link}`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: '✅ Confirm Order', callback_data: 'confirm_order' }],
                [{ text: '🔙 Back', callback_data: 'back_to_new_order' }]
              ]
            }
          });
        });
      });
    } catch (err) {
      console.error(err);
      ctx.reply('❌ Failed to retrieve services.');
    }
  });
});

// Back buttons and order confirmation logic
bot.action('back_to_main', (ctx) => {
  ctx.reply('How can I assist you today?', {
    reply_markup: {
      keyboard: [
        ['🆕 New Order', '💼 Wallet'],
        ['❓ FAQ', '📞 Support'],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    }
  });
});

bot.action('back_to_new_order', (ctx) => {
  ctx.reply('🔍 Please choose a platform:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📸 Instagram', callback_data: 'instagram' }],
        [{ text: '📘 Facebook', callback_data: 'facebook' }],
        [{ text: '🎵 TikTok', callback_data: 'tiktok' }],
        [{ text: '🔙 Back', callback_data: 'back_to_main' }],
      ]
    }
  });
});

bot.action('confirm_order', async (ctx) => {
  try {
    const { serviceType, quantity, link } = ctx.session;

    const response = await axios.post(`${apiBaseURL}?action=add`, {
      key: apiKey,
      service: serviceType,
      link: link,
      quantity: quantity,
    });

    if (response.data.order) {
      await ctx.reply(`✅ Your order has been placed successfully!\n\n🆔 Order ID: ${response.data.order}\n🔗 Link: ${link}\n📦 Service: ${serviceType}\n📝 Quantity: ${quantity}`);
    } else {
      await ctx.reply(`❌ Failed to place your order. Error: ${response.data.error}`);
    }
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ There was an error while placing your order.');
  }
});

// Wallet command
bot.hears('💼 Wallet', async (ctx) => {
  try {
    const { data: userInfo } = await axios.get(`${apiBaseURL}?action=user&key=${apiKey}`);

    await ctx.reply(`💼 Your Wallet:\n\n💵 Balance: ${userInfo.balance} USD\n💳 Spent: ${userInfo.spent} USD`, {
      reply_markup: {
        keyboard: [
          ['➕ Add Balance', '➖ Remove Balance'],
          ['🔙 Back'],
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      }
    });
  } catch (err) {
    console.error(err);
    await ctx.reply('❌ Failed to retrieve wallet information.');
  }
});

bot.hears('➕ Add Balance', async (ctx) => {
  await ctx.reply('🔢 Enter the amount you want to add:');
  bot.on('text', async (ctx) => {
    const amount = ctx.message.text;
    try {
      const response = await axios.post(`${apiBaseURL}?action=add_balance`, {
        key: apiKey,
        amount: amount,
      });

      if (response.data.status === 'success') {
        await ctx.reply(`✅ ${amount} USD has been added to your wallet.`);
      } else {
        await ctx.reply(`❌ Failed to add balance. Error: ${response.data.error}`);
      }
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ There was an error while adding balance.');
    }
  });
});

bot.hears('➖ Remove Balance', async (ctx) => {
  await ctx.reply('🔢 Enter the amount you want to remove:');
  bot.on('text', async (ctx) => {
    const amount = ctx.message.text;
    try {
      const response = await axios.post(`${apiBaseURL}?action=remove_balance`, {
        key: apiKey,
        amount: amount,
      });

      if (response.data.status === 'success') {
        await ctx.reply(`✅ ${amount} USD has been removed from your wallet.`);
      } else {
        await ctx.reply(`❌ Failed to remove balance. Error: ${response.data.error}`);
      }
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ There was an error while removing balance.');
    }
  });
});

// FAQ command
bot.hears('❓ FAQ', (ctx) => {
  ctx.reply('Here are some frequently asked questions:', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '❓ How do I place an order?', callback_data: 'faq_order' }],
        [{ text: '❓ What is the delivery time?', callback_data: 'faq_delivery' }],
        [{ text: '❓ What payment methods are accepted?', callback_data: 'faq_payment' }],
        [{ text: '❓ How do I add funds to my wallet?', callback_data: 'faq_wallet' }],
        [{ text: '❓ What is the refund policy?', callback_data: 'faq_refund' }],
        [{ text: '🔙 Back', callback_data: 'back_to_main' }],
      ]
    }
  });
});

bot.action('faq_order', (ctx) => {
  ctx.reply('To place an order, select "New Order" from the main menu, choose a platform, and follow the prompts.');
});

bot.action('faq_delivery', (ctx) => {
  ctx.reply('Delivery times vary by service, but most orders are completed within 24-48 hours.');
});

bot.action('faq_payment', (ctx) => {
  ctx.reply('We accept payments via credit/debit cards, PayPal, and cryptocurrency.');
});

bot.action('faq_wallet', (ctx) => {
  ctx.reply('You can add funds to your wallet by selecting "Wallet" from the main menu and then "Add Balance".');
});

bot.action('faq_refund', (ctx) => {
  ctx.reply('Refunds are provided only if the order is not delivered within the specified time.');
});

// Support command
bot.hears('📞 Support', (ctx) => {
  ctx.reply('How would you like to contact support?', {
    reply_markup: {
      inline_keyboard: [
        [{ text: '📲 WhatsApp', url: 'https://wa.me/your_number' }],
        [{ text: '📞 Phone', url: 'tel:your_phone_number' }],
        [{ text: '🔙 Back', callback_data: 'back_to_main' }],
      ]
    }
  });
});

// Handle generic back action to return to main menu
bot.action('back_to_main', (ctx) => {
  ctx.reply('How can I assist you today?', {
    reply_markup: {
      keyboard: [
        ['🆕 New Order', '💼 Wallet'],
        ['❓ FAQ', '📞 Support'],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    }
  });
});

// Bot Launch
bot.launch().then(() => {
  console.log('Bot started');
}).catch((error) => {
  console.error('Bot launch error:', error);
});
