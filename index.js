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
                text: 'Join our channel',
                url: `https://t.me/${process.env.CHANNEL_USERNAME}`
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
    const chatMember = await bot.telegram.getChatMember(`@${process.env.CHANNEL_USERNAME}`, ctx.from.id);
    if (chatMember.status === 'member' || chatMember.status === 'administrator' || chatMember.status === 'creator') {
      await ctx.reply('Thank you for joining our channel! How can I assist you today?', {
        reply_markup: {
          keyboard: [
            ['🆕 New Order', '💰 Wallet'],
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

// Service categories for each platform
const platformServices = {
  instagram: {
    followers: [6443, 7128, 5333, 5341],
    likes: [6828, 6827],
    comments: [5457, 5458, 5459]
  },
  tiktok: {
    followers: [6784, 6785, 6786],
    views: [5639, 5634, 5635, 5637],
    likes: [5612, 5611, 5610]
  },
  facebook: {
    profile_followers: [7215],
    page_followers: [6793, 7221],
    likes: [6159, 6160, 6153]
  }
};

Object.keys(platformServices).forEach(platform => {
  bot.action(platform, async (ctx) => {
    const services = platformServices[platform];
    await ctx.reply('Select the service:', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Followers', callback_data: `${platform}_followers` }],
          [{ text: 'Likes', callback_data: `${platform}_likes` }],
          [{ text: 'Comments', callback_data: `${platform}_comments` }]
        ]
      }
    });
  });
});

// Handle service selection
Object.keys(platformServices).forEach(platform => {
  Object.keys(platformServices[platform]).forEach(category => {
    bot.action(`${platform}_${category}`, async (ctx) => {
      const serviceIDs = platformServices[platform][category];
      try {
        const { data: services } = await axios.get(`${apiBaseURL}?action=services&key=${apiKey}`);
        const serviceDetails = services.filter(s => serviceIDs.includes(s.service));
        const serviceInfo = serviceDetails.map((s, index) =>
          `${index + 1}. 📦 Service: ${s.name}\n🗄️ Category: ${s.category}\n💵 Price: ${s.rate}$ per 1000\n`).join('\n');

        await ctx.reply(`🔥 Available Services:\n${serviceInfo}\n👇 Select the service by its number:`);
      } catch (err) {
        console.error(err);
        ctx.reply('❌ Failed to retrieve services.');
      }
    });
  });
});

// Handle user's service selection by number
bot.on('text', async (ctx) => {
  const userText = ctx.message.text;

  if (/^\d$/.test(userText)) {
    try {
      // Simulating service selection here
      const selectedService = parseInt(userText, 10);
      // Assuming you have the service details stored in a variable
      const serviceInfo = "Service Info Here"; // Replace with actual service info

      await ctx.reply(`You selected service #${selectedService}.\nPlease enter the amount:`);
      
      // Capture next step: amount
      bot.on('text', async (ctx) => {
        const amount = ctx.message.text;
        await ctx.reply(`You entered amount: ${amount}. Please provide the link:`);
        
        // Capture next step: link
        bot.on('text', async (ctx) => {
          const link = ctx.message.text;
          await ctx.reply(`You provided the link: ${link}. Confirm your order.`, {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Confirm Order', callback_data: 'confirm_order' }]
              ]
            }
          });

          bot.action('confirm_order', async (ctx) => {
            try {
              // Call your API to process the order here
              // e.g., await axios.post('API_ENDPOINT', { serviceId: selectedService, amount, link });

              await ctx.reply('✅ Your order has been placed successfully!');
            } catch (err) {
              console.error(err);
              await ctx.reply('❌ Failed to place the order. Please try again.');
            }
          });
        });
      });
    } catch (err) {
      console.error(err);
      await ctx.reply('❌ Failed to process your request. Please try again.');
    }
  }
});

// Support button logic
bot.hears('📞 Support', (ctx) => {
  ctx.reply(`📞 Need help? Contact us:
  WhatsApp: https://wa.me/message/OV5BS7MPRIMRO1
  Call: +255747437093`);
});

// FAQ button logic
bot.hears('❓ FAQ', (ctx) => {
  ctx.reply(`❓ Frequently Asked Questions:
1. How do I place an order?
2. What payment methods do you accept?
3. How long does it take to deliver?
4. What is the refund policy?
5. How do I contact support?

Please select the FAQ by its number:`);
});

bot.on('text', async (ctx) => {
  const userText = ctx.message.text;

  // Handle FAQ responses
  if (/^\d$/.test(userText)) {
    switch (userText) {
      case '1':
        await ctx.reply('📦 To place an order, simply choose a platform, select the service you want, and follow the instructions.');
        break;
      case '2':
        await ctx.reply('💳 We accept various payment methods, including credit cards, PayPal, and cryptocurrency.');
        break;
      case '3':
        await ctx.reply('⏱️ Delivery times vary depending on the service. Most orders are completed within 24 hours.');
        break;
      case '4':
        await ctx.reply('💵 We offer refunds on orders that cannot be fulfilled as per our policy. Please contact support for more details.');
        break;
      case '5':
        await ctx.reply('📞 You can contact support through our website or by using the "Support" option in this bot.');
        break;
      default:
        await ctx.reply('⚠️ Please enter a valid FAQ number (1-5).');
        break;
    }
  } else {
    await ctx.reply('⚠️ Please enter a valid command.');
  }
});

bot.launch();
console.log('Bot is running...');
