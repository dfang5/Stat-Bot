// ✅ Use ESM imports via npm specifiers
import { Client, GatewayIntentBits } from "npm:discord.js@14";

// ✅ Use globalThis flag to prevent double login (across isolates in Deno Deploy)
if (!globalThis.__STAT_BOT_INITIALIZED__) {
  globalThis.__STAT_BOT_INITIALIZED__ = true;

  // 🟢 Discord bot setup
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  // 📦 Message tracking maps
  let messageStats = {};       // { guildId: { userId: count } }
  let totalMessages = {};      // { guildId: total }

  // ♻️ Weekly stat reset
  setInterval(() => {
    messageStats = {};
    totalMessages = {};
    console.log("🔄 Stats reset.");
  }, 7 * 24 * 60 * 60 * 1000); // Every 7 days

  // 📨 On bot ready
  client.once("ready", () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
  });

  // 📊 Track messages
  client.on("messageCreate", (message) => {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    messageStats[guildId] ??= {};
    messageStats[guildId][userId] ??= 0;
    totalMessages[guildId] ??= 0;

    messageStats[guildId][userId]++;
    totalMessages[guildId]++;
  });

  // 📈 Respond to !generalstats command
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

  // 🔐 Login to Discord
  client.login(Deno.env.get("DISCORD_BOT_TOKEN"));
}

// 🛰️ Required for Deno Deploy to respond to health checks and not hang
if (Deno.env.get("DENO_REGION")) {
  Deno.serve(() =>
    new Response("🛰️ Stat Bot active.", {
      headers: { "Content-Type": "text/plain" },
    })
  );
}
