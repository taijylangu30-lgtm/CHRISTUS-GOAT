const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

let fonts;
try {
  fonts = require("../func/fonts.js");
} catch (error) {
  try {
    fonts = require("../../func/font.js");
  } catch (err) {}
}

const apiUrlSource = "https://raw.githubusercontent.com/Saim-x69x/sakura/main/ApiUrl.json";

async function getApiUrl() {
  const res = await axios.get(apiUrlSource);
  return res.data.apiv3;
}

async function urlToBase64(url) {
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data).toString("base64");
}

module.exports = {
  config: {
    name: "gem",
    author: "Shade x Christus",
    version: "3.0",
    cooldowns: 5,
    role: 3,
    shortDescription: "Generate artistic images using New API",
    longDescription: "Generates/Edits AI images. Use --nw for artistic mode. Support ratios like 16:9, 9:16, 1:1, etc.",
    category: "ai",
    guide: "{pn} <prompt> [--r X:Y] [--nw]\n({pn} <prompt> en répondant à une image pour l'éditer)"
  },

  onStart: async function ({ message, args, api, event }) {
    let promptParts = [];
    let ratioArg = "1:1"; // Default ratio
    let unfilteredMode = false;

    for (let i = 0; i < args.length; i++) {
      if (args[i] === "--r" && i + 1 < args.length) {
        ratioArg = args[i + 1];
        i++;
      } else if (args[i] === "--nw") {
        unfilteredMode = true;
      } else {
        promptParts.push(args[i]);
      }
    }

    const userPrompt = promptParts.join(" ").trim();
    const repliedImage = event.messageReply?.attachments?.[0];

    if (!userPrompt && !repliedImage) {
      const msg = "🎨 | Please provide a prompt or reply to an image.";
      return message.reply(fonts?.christus ? fonts.christus(msg) : msg);
    }

    const cacheFolder = path.join(__dirname, "/tmp");
    await fs.ensureDir(cacheFolder);

    try {
      api.setMessageReaction("🎨", event.messageID, () => {}, true);
    } catch (e) {}

    const imgPath = path.join(cacheFolder, `gem_${Date.now()}.jpg`);

    try {
      const API_URL = await getApiUrl();

      let finalPrompt = userPrompt;
      if (unfilteredMode) {
        finalPrompt = `Sophisticated fine art photography, classical figure study, artistic lighting, gallery quality: ${userPrompt}`;
      }

      let payload = {
        prompt: repliedImage
          ? `Edit the given image based on this description:\n${finalPrompt || "Enhance this image"}`
          : `Create a high quality image based on this description:\n${finalPrompt}`,
        format: "jpg"
      };

      // Si pas en mode édition, on ajoute le ratio géré par votre ancienne API
      if (!repliedImage) {
        payload.ratio = ratioArg;
      }

      // Vérification de la réponse à une image (Mode Édition)
      if (repliedImage && (repliedImage.type === "photo" || repliedImage.type === "image")) {
        const base64Img = await urlToBase64(repliedImage.url);
        payload.images = [base64Img];
      }

      const res = await axios.post(API_URL, payload, {
        responseType: "arraybuffer",
        timeout: 180000
      });

      await fs.writeFile(imgPath, Buffer.from(res.data));

      try {
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      } catch (e) {}

      const successText = `🎨✨ | Masterpiece created!${unfilteredMode ? " [Artistic Mode]" : ""}${repliedImage ? " (Edited)" : ""}`;
      
      return message.reply({
        body: fonts?.christus ? fonts.christus(successText) : successText,
        attachment: fs.createReadStream(imgPath)
      });

    } catch (error) {
      try {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      } catch (e) {}
      
      console.error("Generation error:", error?.response?.data || error.message);
      const errText = `❌ | Failed: ${error.message}`;
      return message.reply(fonts?.christus ? fonts.christus(errText) : errText);
    } finally {
      if (await fs.pathExists(imgPath)) {
        await fs.remove(imgPath);
      }
    }
  }
};
