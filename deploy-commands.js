require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const commands = [

new SlashCommandBuilder()
.setName("ping")
.setDescription("Ver latência do bot"),

new SlashCommandBuilder()
.setName("help")
.setDescription("Lista de comandos"),

new SlashCommandBuilder()
.setName("ban")
.setDescription("Banir membro")
.addUserOption(option =>
option.setName("usuario")
.setDescription("Usuário para banir")
.setRequired(true))
.addStringOption(option =>
option.setName("motivo")
.setDescription("Motivo do ban")
.setRequired(false)),

new SlashCommandBuilder()
.setName("kick")
.setDescription("Expulsar membro")
.addUserOption(option =>
option.setName("usuario")
.setDescription("Usuário")
.setRequired(true))
.addStringOption(option =>
option.setName("motivo")
.setDescription("Motivo")
.setRequired(false)),

new SlashCommandBuilder()
.setName("mute")
.setDescription("Mutar membro")
.addUserOption(option =>
option.setName("usuario")
.setDescription("Usuário")
.setRequired(true))
.addIntegerOption(option =>
option.setName("tempo")
.setDescription("Tempo em minutos")
.setRequired(true))
.addStringOption(option =>
option.setName("motivo")
.setDescription("Motivo")
.setRequired(false))

].map(command => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {

try {

console.log("Registrando comandos...");

await rest.put(
Routes.applicationCommands(process.env.CLIENT_ID),
{ body: commands }
);

console.log("Comandos registrados!");

} catch (error) {
console.error(error);
}

})();
