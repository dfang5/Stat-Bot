import { Client, GatewayIntentBits } from "npm:discord.js@14";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

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

  client.once("ready", () => {
    console.log(`🤖 Logged in as ${client.user.tag}`);
  });

  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;

    const guildId = message.guild.id;
    const userId = message.author.id;

    if (!messageStats[guildId]) messageStats[guildId] = {};
    if (!messageStats[guildId][userId]) messageStats[guildId][userId] = 0;
    if (!totalMessages[guildId]) totalMessages[guildId] = 0;

    messageStats[guildId][userId]++;
    totalMessages[guildId]++;

    if (!message.content.startsWith("!generalstats")) return;

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
      try {
        const user = await client.users.fetch(userId);
        reply += `- **${user.tag}**: ${count} messages\n`;
      } catch (err) {
        reply += `- **Unknown User**: ${count} messages\n`;
      }
    }

    message.channel.send(reply);
  });

  // Weekly reset timer
  setInterval(() => {
    messageStats = {};
    totalMessages = {};
    console.log("🔄 Stats reset.");
  }, 7 * 24 * 60 * 60 * 1000);

  client.login(Deno.env.get("DISCORD_BOT_TOKEN"));
}

// Ensure the bot starts, AND the HTTP server keeps the deploy alive
if (import.meta.main) {
  startBot();

  // Add Deno Deploy keep-alive HTTP server
  serve((_req) => new Response("Bot is active!"));
}
