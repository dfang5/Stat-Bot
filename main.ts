// Import from discord.js and std HTTP server
import { Client, GatewayIntentBits, User, Message } from "npm:discord.js@14";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Define types for tracking stats
type GuildStats = Record<string, number>; // userId -> message count
type MessageStats = Record<string, GuildStats>; // guildId -> GuildStats
type TotalMessages = Record<string, number>; // guildId -> total messages

// Initialize client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Stats tracking
let messageStats: MessageStats = {};
let totalMessages: TotalMessages = {};

// Bot ready
client.once("ready", () => {
  if (client.user) {
    console.log(`🤖 Logged in as ${client.user.tag}`);
  }
});

// Handle new messages
client.on("messageCreate", async (message: Message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  if (!messageStats[guildId]) messageStats[guildId] = {};
  if (!messageStats[guildId][userId]) messageStats[guildId][userId] = 0;
  if (!totalMessages[guildId]) totalMessages[guildId] = 0;

  messageStats[guildId][userId]++;
  totalMessages[guildId]++;

  if (!message.content.startsWith("!generalstats")) return;

  const guildStats = messageStats[guildId];
  const totalMsgCount = totalMessages[guildId];

  const sortedUsers = Object.entries(guildStats).sort(([, a], [, b]) => b - a);
  const topFive = sortedUsers.slice(0, 5);

  if (topFive.length === 0) {
    message.channel.send("No stats available yet for this server.");
    return;
  }

  let reply = `📊 **Stats for this server (WEEKLY):**\n`;
  reply += `Total messages sent: **${totalMsgCount}**\n\n`;
  reply += `**Top 5 users by messages sent:**\n`;

  for (const [uid, count] of topFive) {
    try {
      const user: User = await client.users.fetch(uid);
      reply += `- **${user.tag}**: ${count} messages\n`;
    } catch (_err) {
      reply += `- **Unknown User**: ${count} messages\n`;
    }
  }

  message.channel.send(reply);
});

// Reset stats weekly
setInterval(() => {
  messageStats = {};
  totalMessages = {};
  console.log("🔄 Stats reset.");
}, 7 * 24 * 60 * 60 * 1000); // weekly reset

// ✅ Wrap everything in a serve() to access environment variables in Deno Deploy
let botStarted = false;

serve(async () => {
  if (!botStarted) {
    const token = Deno.env.get("DISCORD_BOT_TOKEN");

    if (!token) {
      console.error("❌ DISCORD_BOT_TOKEN not set.");
      return new Response("Token missing.", { status: 500 });
    }

    try {
      await client.login(token);
      botStarted = true;
      console.log("✅ Bot logged in.");
    } catch (err) {
      console.error("❌ Failed to log in bot:", err);
      return new Response("Login failed.", { status: 500 });
    }
  }

  return new Response("Bot is online.");
});
