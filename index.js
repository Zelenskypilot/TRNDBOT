require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const http = require('http');

// Telegram Bot setup
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const API_KEY = 'xHevD2QoIiR6hiwO5SKyHsxFivrKYScHHlsQjySNnF1KDkI2laCFpxBJ0WAF';
const API_BASE_URL = 'https://trendifysmm.com/api/v2';

const CHANNEL_ID = '@trendifysmmtelebot';

let userState = {};

// Check if a user is a member of a channel
async function checkMembership(userId) {
    const member = await bot.getChatMember(CHANNEL_ID, userId);
    return member.status === 'member' || member.status === 'administrator' || member.status === 'creator';
}

// Start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const isMember = await checkMembership(userId);

    if (!isMember) {
        bot.sendMessage(chatId, '🚨 You need to join our channel to use this bot.', {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Join Our Channel', url: 'https://t.me/trendifysmmtelebot' }],
                    [{ text: 'Confirm Join', callback_data: 'confirm_join' }]
                ]
            }
        });
    } else {
        showMainMenu(chatId);
    }
});

// Handle callback queries
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    if (callbackQuery.data === 'confirm_join') {
        const isMember = await checkMembership(userId);

        if (isMember) {
            bot.sendMessage(chatId, '✅ Thank you for subscribing! You can now use the bot.');
            showMainMenu(chatId);
        } else {
            bot.sendMessage(chatId, '❌ You need to join our channel to use this bot.');
        }
    }
});

function showMainMenu(chatId) {
    const opts = {
        reply_markup: {
            keyboard: [
                [{ text: '🆕 New Order' }],
                [{ text: '💰 Wallet' }],
                [{ text: '❓ FAQ' }, { text: '🆘 Help' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true,
        },
    };
    bot.sendMessage(chatId, 'Welcome to Trendifysmm Panel! What would you like to do?', opts);
}

// Handle text messages
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text.trim();

    if (text === '🆕 New Order') {
        showSocialMediaOptions(chatId);
    } else if (userState[chatId] && userState[chatId].step === 'select_platform') {
        handlePlatformSelection(chatId, text);
    } else if (userState[chatId] && userState[chatId].step === 'select_service') {
        handleServiceSelection(chatId, text);
    } else if (userState[chatId] && userState[chatId].step === 'enter_quantity') {
        handleQuantityEntry(chatId, text);
    }
});

function showSocialMediaOptions(chatId) {
    userState[chatId] = { step: 'select_platform' };
    const opts = {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Instagram', callback_data: 'instagram' }],
                [{ text: 'Facebook', callback_data: 'facebook' }],
                [{ text: 'TikTok', callback_data: 'tiktok' }],
                [{ text: 'Twitter', callback_data: 'twitter' }]
            ]
        }
    };
    bot.sendMessage(chatId, 'Please choose a social media platform:', opts);
}

function handlePlatformSelection(chatId, platform) {
    const platformMap = {
        instagram: 'Instagram',
        facebook: 'Facebook',
        tiktok: 'TikTok',
        twitter: 'Twitter'
    };

    if (platformMap[platform.toLowerCase()]) {
        userState[chatId].platform = platformMap[platform.toLowerCase()];
        userState[chatId].step = 'select_service';

        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Followers', callback_data: 'followers' }],
                    [{ text: 'Likes', callback_data: 'likes' }],
                    [{ text: 'Comments', callback_data: 'comments' }],
                ]
            }
        };

        if (platform.toLowerCase() === 'twitter') {
            opts.reply_markup.inline_keyboard.push([{ text: 'Retweets', callback_data: 'retweets' }]);
        }

        if (platform.toLowerCase() === 'facebook') {
            opts.reply_markup.inline_keyboard = [
                [{ text: 'Profile Followers', callback_data: 'profile_followers' }],
                [{ text: 'Page Followers', callback_data: 'page_followers' }],
                [{ text: 'Likes', callback_data: 'likes' }],
                [{ text: 'Comments', callback_data: 'comments' }]
            ];
        }

        bot.sendMessage(chatId, `You chose ${userState[chatId].platform}. Now, please select the service:`, opts);
    } else {
        bot.sendMessage(chatId, 'Invalid platform. Please select again.');
        showSocialMediaOptions(chatId);
    }
}

function handleServiceSelection(chatId, service) {
    const serviceMap = {
        followers: 'Followers',
        likes: 'Likes',
        comments: 'Comments',
        retweets: 'Retweets',
        profile_followers: 'Profile Followers',
        page_followers: 'Page Followers'
    };

    if (serviceMap[service.toLowerCase()]) {
        userState[chatId].service = serviceMap[service.toLowerCase()];
        userState[chatId].step = 'enter_quantity';

        bot.sendMessage(chatId, `You selected ${userState[chatId].service}. Please enter the quantity:`);
    } else {
        bot.sendMessage(chatId, 'Invalid service. Please select again.');
        handlePlatformSelection(chatId, userState[chatId].platform);
    }
}

async function handleQuantityEntry(chatId, quantity) {
    if (!isNaN(quantity)) {
        userState[chatId].quantity = parseInt(quantity, 10);

        const serviceDetails = await getServiceDetails(userState[chatId].platform, userState[chatId].service);
        const pricePerUnit = serviceDetails.rate / 1000;
        const totalPrice = pricePerUnit * userState[chatId].quantity;

        bot.sendMessage(chatId, `🔥 Create a new order!
    └📦 Quantity: ${userState[chatId].quantity}

🗄️ Category: ${userState[chatId].platform}
🗃️ Subcategory: ${serviceDetails.category}
🧾 Service: ${serviceDetails.name}
💵 Price: ${pricePerUnit}$ per unit

👇 Total Cost: ${totalPrice}$`);

        // Now, you would proceed to place the order using the API
        // Example: createOrder(chatId, serviceDetails.service, userState[chatId].quantity);
    } else {
        bot.sendMessage(chatId, 'Invalid quantity. Please enter a valid number:');
    }
}

// Helper to fetch service details (for now, it's a placeholder)
async function getServiceDetails(platform, service) {
    // Placeholder - Replace with actual API call to fetch service details
    return {
        service: 1,
        name: service,
        category: `${platform} Services`,
        rate: 100 // Example rate
    };
}

// HTTP server setup to keep the bot running on Render
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bot is running...\n');
}).listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
