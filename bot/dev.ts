import { bot } from "./bot";

bot.launch().then(() => {
  console.log("🐸 Bot PEPE MINE démarré en mode polling (local)");
});

// Arrêt propre du bot avec Ctrl+C
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));