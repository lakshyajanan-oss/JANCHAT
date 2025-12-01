/* ---------------------------------------------------
   JAN CHat - Media Bridge Bot
   ---------------------------------------------------
   1. Install dependencies: npm install node-telegram-bot-api
   2. Run: node bot.js
*/

const TelegramBot = require('node-telegram-bot-api');

// YOUR CONFIGURATION
const TOKEN = '8483887845:AAGxmYWQDNbmSqxtBOZUcBPn5rUVrWpl-wk'; // Replace if you revoked it
const WEB_APP_URL = 'https://erosive-dorothea-unfilling.ngrok-free.dev/';

// REPLACE THIS with the ID you found in Step 1 (e.g., -100123456789)
const MEDIA_GROUP_ID = '-1003337042293'; 

// Initialize Bot
const bot = new TelegramBot(TOKEN, { polling: true });

// Store temporary state: { telegramUserId: "jan_chat_group_id" }
const userSessions = {};

console.log('Bot is running...');

// 1. Handle /start command (Incoming from Web App)
// The web app sends users here via: t.me/botname?start=group_id
bot.onText(/\/start (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const janGroupId = match[1]; // The group ID from the web app

    // Save state so we know where to tag the file
    userSessions[chatId] = janGroupId;

    const opts = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: "📱 Open JAN CHat", web_app: { url: WEB_APP_URL } }
                ]
            ]
        }
    };

    bot.sendMessage(chatId, 
        `🔗 **Connected to Anonymous Group:** \`${janGroupId}\`\n\n` +
        `Send me any photo, video, or file here. I will forward it to the secure media channel anonymously.`, 
        { parse_mode: 'Markdown', ...opts }
    );
});

// 2. Handle /start (No params)
bot.onText(/\/start$/, (msg) => {
    bot.sendMessage(msg.chat.id, "Please open this bot via the JAN CHat Web App to link a group.", {
        reply_markup: {
            inline_keyboard: [[{ text: "Open App", web_app: { url: WEB_APP_URL } }]]
        }
    });
});

// 3. Handle File Uploads (Photos, Documents, Videos, Audio)
bot.on('message', async (msg) => {
    // Ignore text commands
    if (msg.text && msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const janGroupId = userSessions[chatId];

    // Check if user has connected via the web app link first
    if (!janGroupId) {
        return bot.sendMessage(chatId, "⚠️ I don't know which group to send this to. Please click the 'Attachment' button inside the Web App again.");
    }

    // Check if message contains media
    if (msg.photo || msg.document || msg.video || msg.audio || msg.voice) {
        try {
            // Forward (Copy) to the Public Media Group
            // We use copyMessage so it looks like the BOT sent it (Anonymity)
            await bot.copyMessage(MEDIA_GROUP_ID, chatId, msg.message_id, {
                caption: `📂 **File for Group:** #${janGroupId}\nfrom user: ${msg.from.first_name}`,
                parse_mode: 'Markdown'
            });

            // Confirm to user
            bot.sendMessage(chatId, "✅ Sent! Check the group.", {
                reply_markup: {
                    inline_keyboard: [[{ text: "🔙 Back to App", web_app: { url: WEB_APP_URL } }]]
                }
            });

        } catch (error) {
            console.error("Error forwarding:", error.message);
            bot.sendMessage(chatId, `❌ Error: Make sure the bot is an Admin in the target channel.\nRef: ${error.message}`);
        }
    }
});