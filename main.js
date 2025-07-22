import { Client, GatewayIntentBits } from "npm:discord.js@14";

// 🛡️ Track if we've already logged in
let hasLoggedIn = false;

// 🧠 Create client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// 🧮 Stats tracking
let messageStats: Record<string, Record<string, number>> = {};
let totalMessages: Record<string, number> = {};

// ♻️ Reset every week
setInterval(() => {
  messageStats = {};
  totalMessages = {};
  console.log("🔄 Weekly stats reset.");
}, 7 * 24 * 60 * 60 * 1000);

// 📨 Count messages
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

// 📊 Handle command
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith("!generalstats")) return;

  const guildId = message.guild.id;
  const guildStats = messageStats[guildId] || {};
  const total = totalMessages[guildId] || 0;

  const sorted = Object.entries(guildStats).sort((a, b) => b[1] - a[1]);
  const topFive = sorted.slice(0, 5);

  if (topFive.length === 0) {
    message.channel.send("No stats available yet.");
    return;
  }

  let reply = `📊 **Stats for this server (WEEKLY):**\n`;
  reply += `Total messages sent: **${total}**\n\n`;
  reply += `**Top 5 users:**\n`;

  for (const [userId, count] of topFive) {
    const user = await client.users.fetch(userId);
    reply += `- **${user.tag}**: ${count} messages\n`;
  }

  message.channel.send(reply);
});

// ✅ Login once when client is ready
client.once("ready", () => {
  console.log(`🤖 Logged in as ${client.user?.tag}`);
});

// ✅ Make sure login happens once only
if (!hasLoggedIn) {
  hasLoggedIn = true;
  client.login(Deno.env.get("DISCORD_BOT_TOKEN"));
}

// 🌐 REQUIRED FOR DENO DEPLOY
Deno.serve(() => {
  return new Response("Bot is running!", {
    headers: { "Content-Type": "text/plain" },
  });
});
