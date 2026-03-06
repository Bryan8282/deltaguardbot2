require("dotenv").config()

const { REST, Routes, SlashCommandBuilder } = require("discord.js")

const commands = [

new SlashCommandBuilder()
.setName("setlog")
.setDescription("Definir canal de logs")
.addChannelOption(option =>
option.setName("canal")
.setDescription("Canal de logs")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("setmute")
.setDescription("Definir cargo de mute")
.addRoleOption(option =>
option.setName("cargo")
.setDescription("Cargo de mute")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("ban")
.setDescription("Banir um usuário")
.addUserOption(option =>
option.setName("usuario")
.setDescription("Usuário")
.setRequired(true)
)
.addStringOption(option =>
option.setName("motivo")
.setDescription("Motivo do ban")
),

new SlashCommandBuilder()
.setName("mute")
.setDescription("Mutar usuário")
.addUserOption(option =>
option.setName("usuario")
.setDescription("Usuário")
.setRequired(true)
)
.addIntegerOption(option =>
option.setName("tempo")
.setDescription("Tempo em minutos")
.setRequired(true)
)
.addStringOption(option =>
option.setName("motivo")
.setDescription("Motivo")
)

].map(command => command.toJSON())

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)

;(async () => {

try {

console.log("Registrando comandos...")

await rest.put(
Routes.applicationCommands(process.env.CLIENT_ID),
{ body: commands }
)

console.log("Comandos registrados!")

} catch (error) {
console.error(error)
}

})()
