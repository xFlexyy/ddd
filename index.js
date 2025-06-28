const { Telegraf } = require('telegraf');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const bot = new Telegraf(process.env.BOT_TOKEN);

function formatBytes(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

bot.start((ctx) => {
  ctx.reply('🔥 Welcome to FlexyyFork v2!\nUse /leech <link> to start downloading.');
});

bot.command('leech', async (ctx) => {
  const input = ctx.message.text.split(" ");
  const url = input[1];
  if (!url) return ctx.reply("❌ Please provide a valid download link!");

  const fileName = `file_${Date.now()}`;
  const outputPath = path.join("downloads", fileName);
  const msg = await ctx.reply(`📥 Download Starting...\n🔗 ${url}`);

  const ariaCmd = `aria2c -x16 -s16 -d downloads -o ${fileName} "${url}"`;
  let percent = 0;

  const interval = setInterval(() => {
    try {
      const stats = fs.statSync(outputPath);
      percent = ((stats.size / (1024 * 1024 * 100)) * 100).toFixed(2);
      ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null,
        `📥 Downloading: ${fileName}\nProgress: ${percent}% [${formatBytes(stats.size)}]`);
    } catch (e) {}
  }, 2000);

  exec(ariaCmd, async (err) => {
    clearInterval(interval);

    if (err) {
      await ctx.reply("❌ Download Failed!");
      return;
    }

    try {
      const stats = fs.statSync(outputPath);
      if (stats.size > 2097152000) {
        return ctx.reply("⚠️ File too large for Telegram (Limit: 2GB).");
      }

      await ctx.replyWithDocument({ source: outputPath, filename: fileName });
    } catch (e) {
      ctx.reply("❌ Upload failed!");
    }
  });
});

bot.launch();