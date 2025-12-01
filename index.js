// index.js
const express = require('express');
const Gun = require('gun');
const cors = require('cors');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

// --- CONFIGURATION ---
const PORT = process.env.PORT || 8000;
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; 
// The Render URL will be automatically set, or you can hardcode your domain later
const APP_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`; 
const MEDIA_GROUP_ID = process.env.MEDIA_GROUP_ID; // The ID of your private channel

// --- EXPRESS & GUN SERVER ---
const app = express();
app.use(cors());

// Serve the HTML file from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at ${APP_URL}`);
});

// Attach Gun to the server
const gun = Gun({ web: server });

// --- TELEGRAM BOT LOGIC ---
if (TELEGRAM_TOKEN) {
    const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
    const userSessions = {};

    console.log('🤖 Bot is running...');

    // 1. Handle /start command
    bot.onText(/\/start (.+)/, (msg, match) => {
        const chatId = msg.chat.id;
        const janGroupId = match[1]; 
        userSessions[chatId] = janGroupId;

        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [ { text: "📱 Open JAN CHat", web_app: { url: APP_URL } } ]
                ]
            }
        };

        bot.sendMessage(chatId, 
            `🔗 **Connected to Group:** \`${janGroupId}\`\nSend files here to forward them.`, 
            { parse_mode: 'Markdown', ...opts }
        );
    });

    // 2. Handle standard /start (no group)
    bot.onText(/\/start$/, (msg) => {
        bot.sendMessage(msg.chat.id, "Please open this bot via the Web App.", {
            reply_markup: {
                inline_keyboard: [[{ text: "Open App", web_app: { url: APP_URL } }]]
            }
        });
    });

    // 3. Handle Media
    bot.on('message', async (msg) => {
        if (msg.text && msg.text.startsWith('/')) return;
        const chatId = msg.chat.id;
        const janGroupId = userSessions[chatId];

        if (!janGroupId) {
            return bot.sendMessage(chatId, "⚠️ Please click the attachment button in the App first.");
        }

        if (msg.photo || msg.document || msg.video || msg.audio || msg.voice) {
            try {
                if (MEDIA_GROUP_ID) {
                    await bot.copyMessage(MEDIA_GROUP_ID, chatId, msg.message_id, {
                        caption: `📂 **Group:** #${janGroupId}\n👤 **User:** ${msg.from.first_name}`,
                        parse_mode: 'Markdown'
                    });
                    bot.sendMessage(chatId, "✅ Sent anonymously.");
                } else {
                    bot.sendMessage(chatId, "❌ Admin Error: MEDIA_GROUP_ID not set in env vars.");
                }
            } catch (error) {
                console.error("Bot Error:", error.message);
            }
        }
    });
} else {
    console.log("⚠️ Telegram Token not found. Bot functionality disabled.");
}