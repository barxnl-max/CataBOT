const fs = require('fs');
const path = require('path');
const Completion = require('../lib/Completion');

const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// ================= MEMORY =================

const completionSessions = new Map(); // per user

// ================= UTIL =================

function loadUserGroupData() {
    try {
        return JSON.parse(fs.readFileSync(USER_GROUP_DATA));
    } catch {
        return { chatbot: {} };
    }
}

function saveUserGroupData(data) {
    fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
}

async function showTyping(sock, chatId) {
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
    } catch {}
}

// normalize jid → number only
function normalizeJid(jid = '') {
    return jid.split('@')[0].split(':')[0];
}

// ================= COMMAND =================

async function handleChatbotCommand(sock, chatId, message, match) {
    const data = loadUserGroupData();

    if (!match) {
        return sock.sendMessage(chatId, {
            text: '*CHATBOT*\n\n.chatbot on\n.chatbot off',
            quoted: message
        });
    }

    if (match === 'on') {
        data.chatbot[chatId] = true;
        saveUserGroupData(data);
        return sock.sendMessage(chatId, {
            text: '✅ Chatbot enabled',
            quoted: message
        });
    }

    if (match === 'off') {
        delete data.chatbot[chatId];
        saveUserGroupData(data);
        return sock.sendMessage(chatId, {
            text: '❌ Chatbot disabled',
            quoted: message
        });
    }
}

// ================= CHAT RESPONSE =================

async function handleChatbotResponse(sock, chatId, message, userMessage, senderId) {
    const data = loadUserGroupData();
    if (!data.chatbot[chatId]) return;

    const botNumber = normalizeJid(sock.user.id);

    let isMentioned = false;
    let isReplyToBot = false;

    // ===== EXTENDED MESSAGE (reply / mention) =====
    if (message.message?.extendedTextMessage) {
        const ctx = message.message.extendedTextMessage.contextInfo || {};

        // ---- mention check ----
        const mentions = ctx.mentionedJid || [];
        isMentioned = mentions.some(jid =>
            normalizeJid(jid) === botNumber
        );

        // ---- reply check (PALING STABIL) ----
        if (ctx.quotedMessage) {
            // Cara 1: cek participant (kalau ada)
            if (ctx.participant) {
                if (normalizeJid(ctx.participant) === botNumber) {
                    isReplyToBot = true;
                }
            } else {
                // Cara 2: fallback → anggap reply ke bot
                // (ini yang bikin reply ke-2, ke-3 tetap jalan)
                isReplyToBot = true;
            }
        }
    }

    // ===== NORMAL MESSAGE (mention biasa) =====
    if (message.message?.conversation) {
        if (userMessage.includes(`@${botNumber}`)) {
            isMentioned = true;
        }
    }

    if (!isMentioned && !isReplyToBot) return;

    // ===== CLEAN MESSAGE =====
    let cleanedMessage = userMessage.replace(`@${botNumber}`, '').trim();
    if (!cleanedMessage) return;

    // ===== INIT COMPLETION =====
    let completion = completionSessions.get(senderId);
    if (!completion) {
        completion = new Completion(senderId);
        completionSessions.set(senderId, completion);
    }

    // safety: limit internal history
    if (completion.messages && completion.messages.length > 20) {
        completion.messages = completion.messages.slice(-20);
    }

    // typing indicator (no delay)
    showTyping(sock, chatId);

    try {
        const reply = await completion.chat(cleanedMessage);
        if (!reply) return;

        await sock.sendMessage(
            chatId,
            { text: reply },
            { quoted: message }
        );

    } catch (err) {
        console.error('Chatbot error:', err.message);
    }
}

// ================= EXPORT =================

module.exports = {
    handleChatbotCommand,
    handleChatbotResponse
};