import { REST, Routes, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const commands = [
  new SlashCommandBuilder()
    .setName("takım")
    .setDescription("Takım kurma panelini açar")
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log("Slash komutları başarıyla yüklendi.");
  } catch (err) {
    console.error(err);
  }
})();
