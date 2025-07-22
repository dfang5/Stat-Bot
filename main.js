import { Client, GatewayIntentBits } from "npm:discord.js@14";

// Core bot function
function startBot() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  let messageStats = {};
  let totalMessages = {};

  // Log when bot is ready
  client.once("ready", () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
  });

  // Listen for new messages
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    // Initialize storage if needed
    if (!messageStats[guildId]) messageStats[guildId] = {};
    if (!messageStats[guildId][userId]) messageStats[guildId][userId] = 0;
    if (!totalMessages[guildId]) totalMessages[guildId] = 0;

    // Increment message counts
    messageStats[guildId][userId]++;
    totalMessages[guildId]++;

    // Command handler
    if (!message.content.startsWith("!generalstats")) return;

    const guildStats = messageStats[guildId];
    const totalMsgCount = totalMessages[guildId];

    const sortedUsers = Object.entries(guildStats).sort((a, b) => b[1] - a[1]);
    const topFive = sortedUsers.slice(0, 5);

    if (topFive.length === 0) {
      await message.channel.send("No stats available yet for this server.");
      return;
    }

    let reply = `📊 **Stats for this server (WEEKLY):**\n`;
    reply += `Total messages sent: **${totalMsgCount}**\n\n`;
    reply += `**Top 5 users by messages sent:**\n`;

    for (const [userId, count] of topFive) {
      try {
        const user = await client.users.fetch(userId);
        reply += `- **${user.tag}**: ${count} messages\n`;
      } catch {
        reply += `- **Unknown User**: ${count} messages\n`;
      }
    }

    await message.channel.send(reply);
  });

  // Weekly reset timer
  setInterval(() => {
    messageStats = {};
    totalMessages = {};
    console.log("🔄 Stats reset.");
  }, 7 * 24 * 60 * 60 * 1000); // 1 week

  // Login bot with token from env vars
  client.login(Deno.env.get("DISCORD_BOT_TOKEN"));
}

// Run bot only if script is main module
if (import.meta.main) {
  startBot();

  // Keep-alive HTTP handler for Deno Deploy
  Deno.serve(() => new Response("Bot is alive!"));
}
