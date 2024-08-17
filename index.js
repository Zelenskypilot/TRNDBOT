const { Telegraf, Markup } = require('telegraf');
const axios = require('axios');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

let userState = {};

const stopCurrentFlow = (chatId) => {
    if (userState[chatId]) {
        delete userState[chatId];
    }
};

bot.start((ctx) => {
    ctx.reply(
        '🎉 Welcome to the Trendifysmm Marketing Agency Admin Bot! I can help manage www.trendifysmm.com website. Choose an option from the menu below:',
        Markup.keyboard([
            ['📋 New Order', '📄 FAQ'],
            ['🛠️ Support', '💼 Wallet']
        ]).resize().extra()
    );
});

// Handle New Order Flow
bot.hears('📋 New Order', (ctx) => {
    stopCurrentFlow(ctx.chat.id);
    userState[ctx.chat.id] = { stage: 'selectPlatform' };
    ctx.reply(
        'Please select the platform:',
        Markup.inlineKeyboard([
            [Markup.button.callback('Instagram', 'platform_instagram')],
            [Markup.button.callback('TikTok', 'platform_tiktok')],
            [Markup.button.callback('Facebook', 'platform_facebook')],
        ]).extra()
    );
});

// Handle Platform Selection
bot.action(/^platform_(.+)$/, (ctx) => {
    if (!userState[ctx.chat.id] || userState[ctx.chat.id].stage !== 'selectPlatform') return;

    const platform = ctx.match[1];
    userState[ctx.chat.id] = { platform, stage: 'selectService' };

    ctx.reply(
        `🔥 Select the service category for ${platform}:`,
        Markup.inlineKeyboard([
            [Markup.button.callback('Followers', `service_followers`)],
            [Markup.button.callback('Likes', `service_likes`)],
            [Markup.button.callback('Comments', `service_comments`)],
        ]).extra()
    );
});

// Handle Service Category Selection
bot.action(/^service_(.+)$/, async (ctx) => {
    if (!userState[ctx.chat.id] || userState[ctx.chat.id].stage !== 'selectService') return;

    const serviceType = ctx.match[1];
    userState[ctx.chat.id] = { ...userState[ctx.chat.id], serviceType, stage: 'selectSpecificService' };

    try {
        const services = await axios.get(`https://trendifysmm.com/api/v2?action=get_services&key=${process.env.API_KEY}&category=${serviceType}`);

        let servicesMessage = '🔥 Select the Instagram service that you want:\n\n';
        services.data.forEach((service, index) => {
            servicesMessage += `${index + 1}. 📦 Service: ${service.name}\n💵 Price: ${service.rate}$ per 1000\n\n`;
        });
        servicesMessage += '👇 Select the service by its number:';

        ctx.reply(servicesMessage);
    } catch (error) {
        ctx.reply('❌ Failed to retrieve services.');
    }
});

// Handle Service Selection by Number
bot.on('text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;

    if (!userState[chatId]) {
        return;
    }

    switch (userState[chatId].stage) {
        case 'selectSpecificService':
            const serviceIndex = parseInt(text) - 1;
            if (isNaN(serviceIndex) || serviceIndex < 0) {
                ctx.reply('⚠️ Please select a valid service number.');
                return;
            }
            userState[chatId] = { ...userState[chatId], serviceIndex, stage: 'enterAmount' };
            ctx.reply('💰 Enter the amount you want:');
            break;

        case 'enterAmount':
            const amount = parseInt(text);
            if (isNaN(amount)) {
                ctx.reply('⚠️ Please enter a valid amount.');
                return;
            }
            userState[chatId] = { ...userState[chatId], amount, stage: 'enterLink' };
            ctx.reply('🔗 Enter the link you want to promote:');
            break;

        case 'enterLink':
            const link = text;
            userState[chatId] = { ...userState[chatId], link, stage: 'confirmOrder' };
            ctx.reply(
                '✅ Confirm your order by clicking below:',
                Markup.inlineKeyboard([
                    Markup.button.callback('Confirm Order', 'confirm_order'),
                    Markup.button.callback('Cancel Order', 'cancel_order'),
                ]).extra()
            );
            break;

        default:
            ctx.reply('⚠️ Please follow the steps properly.');
            break;
    }
});

// Handle Order Confirmation
bot.action('confirm_order', async (ctx) => {
    const { platform, serviceType, serviceIndex, amount, link } = userState[ctx.chat.id];
    if (!platform || serviceIndex === undefined || !amount || !link) {
        ctx.reply('⚠️ Please follow the steps properly.');
        return;
    }

    try {
        const response = await axios.get(`https://trendifysmm.com/api/v2?action=add&service=${serviceIndex + 1}&link=${link}&quantity=${amount}&key=${process.env.API_KEY}`);
        if (response.data.order) {
            ctx.reply(`🚀 Order placed successfully! Order ID: ${response.data.order}`);
        } else {
            ctx.reply('❌ Failed to place the order. Please try again.');
        }
    } catch (error) {
        ctx.reply('❌ Failed to place the order. Please try again.');
    }
    delete userState[ctx.chat.id];
});

// Handle Order Cancellation
bot.action('cancel_order', (ctx) => {
    ctx.reply('❌ Order canceled.');
    delete userState[ctx.chat.id];
});

// Handle Support Button
bot.hears('🛠️ Support', (ctx) => {
    stopCurrentFlow(ctx.chat.id);
    ctx.reply('📞 Contact Support: +1 234 567 8901 or email us at support@trendifysmm.com');
});

// Handle FAQ Button
bot.hears('📄 FAQ', (ctx) => {
    stopCurrentFlow(ctx.chat.id);
    ctx.reply(
        '❓ Frequently Asked Questions:\n\n' +
        '1️⃣ How do I place an order?\n' +
        '2️⃣ What payment methods do you accept?\n' +
        '3️⃣ How long does it take to deliver?\n' +
        '4️⃣ What is the refund policy?\n' +
        '5️⃣ How do I contact support?\n\n' +
        '👇 Please enter the FAQ number for more details.'
    );
});

bot.launch();
