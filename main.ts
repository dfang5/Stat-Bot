// ✅ Use ESM imports via npm: specifiers
import { Client, GatewayIntentBits } from "npm:discord.js@14";
import express from "npm:express@4";

// 🟢 Express server for UptimeRobot pings
const app = express();
const PORT = Deno.env.get("PORT") || 3000;

app.get("/", (_req, res) => res.send("Bot is alive!"));
app.listen(PORT, () => {
  console.log(`🌐 Web server running on port ${PORT}`);
});

// 🟢 Discord bot setup
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

let messageStats = {}; // { guildId: { userId: count } }
let totalMessages = {}; // { guildId: count }

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

// 🔑 Login with token from environment
client.login(Deno.env.get("DISCORD_BOT_TOKEN"));
