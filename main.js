import { Client, GatewayIntentBits } from "npm:discord.js@14";
import express from "npm:express@4";

// ✅ Setup express app (whether or not it's needed by Deno)
const app = express();
const PORT = process.env.PORT || 3000;

// Dummy route to keep the process 'alive'
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

// 👇 Start express server immediately so Deno sees a persistent process
app.listen(PORT, () => {
  console.log(`✅ Express keep-alive server listening on port ${PORT}`);
});

// 🟢 Create and configure the bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

let messageStats = {};
let totalMessages = {};

function resetStats() {
  messageStats = {};
  totalMessages = {};
  console.log("🔄 Stats reset.");
}

// 🔁 Reset every 7 days
setInterval(resetStats, 7 * 24 * 60 * 60 * 1000);

// Track messages
client.on("messageCreate", (message) => {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  if (!messageStats[guildId]) messageStats[guildId] = {};
  if (!messageStats[guildId][userId]) messageStats[guildId][userId] = 0;
  if (!totalMessages[guildId]) totalMessages[guildId] = 0;

  messageStats[guildId][userId]++;
  totalMessages[guildId]++;
});

// Handle `!generalstats` command
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith("!generalstats")) return;

  const guildId = message.guild.id;
  const guildStats = messageStats[guildId] || {};
  const totalMsgCount = totalMessages[guildId] || 0;

  const sortedUsers = Object.entries(guildStats).sort((a, b) => b[1] - a[1]);
  const topFive = sortedUsers.slice(0, 5);

  if (topFive.length === 0) {
    message.channel.send("No stats available yet for this server.");
    return;
  }

  let reply = `📊 **Stats for this server (WEEKLY):**\n`;
  reply += `Total messages sent: **${totalMsgCount}**\n\n`;
  reply += `**Top 5 users by messages sent:**\n`;

  for (const [userId, count] of topFive) {
    const user = await client.users.fetch(userId);
    reply += `- **${user.tag}**: ${count} messages\n`;
  }

  message.channel.send(reply);
});

// 🔐 Login only ONCE
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_BOT_TOKEN);
