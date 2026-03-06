require("dotenv").config()

const { 
Client, 
GatewayIntentBits, 
PermissionsBitField, 
SlashCommandBuilder, 
REST, 
Routes 
} = require("discord.js")

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
})

const commands = [

new SlashCommandBuilder()
.setName("ping")
.setDescription("Ver a latência do bot"),

new SlashCommandBuilder()
.setName("help")
.setDescription("Ver todos os comandos"),

new SlashCommandBuilder()
.setName("ban")
.setDescription("Banir um usuário")
.addUserOption(option =>
option.setName("usuario")
.setDescription("Usuário para banir")
.setRequired(true))
.addStringOption(option =>
option.setName("motivo")
.setDescription("Motivo do ban")
.setRequired(false)),

new SlashCommandBuilder()
.setName("mute")
.setDescription("Mutar um usuário")
.addUserOption(option =>
option.setName("usuario")
.setDescription("Usuário para mutar")
.setRequired(true))
.addIntegerOption(option =>
option.setName("tempo")
.setDescription("Tempo do mute em minutos")
.setRequired(true))
.addStringOption(option =>
option.setName("motivo")
.setDescription("Motivo do mute")
.setRequired(false))

].map(command => command.toJSON())

client.once("ready", async () => {

console.log(`Bot online como ${client.user.tag}`)

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)

try {

await rest.put(
Routes.applicationCommands(process.env.CLIENT_ID),
{ body: commands }
)

console.log("Comandos registrados com sucesso")

} catch (error) {
console.error(error)
}

})

client.on("interactionCreate", async interaction => {

if (!interaction.isChatInputCommand()) return

const { commandName } = interaction

if (commandName === "ping") {

await interaction.reply("🏓 Pong!")

}

if (commandName === "help") {

await interaction.reply(`
📜 **Comandos disponíveis**

/ping → Testar o bot  
/help → Lista de comandos  
/ban → Banir usuário  
/mute → Mutar usuário
`)

}

if (commandName === "ban") {

if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
return interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true })

const user = interaction.options.getUser("usuario")
const reason = interaction.options.getString("motivo") || "Sem motivo"

const member = interaction.guild.members.cache.get(user.id)

if (!member)
return interaction.reply("Usuário não encontrado.")

await member.ban({ reason })

interaction.reply(`🔨 ${user.tag} foi banido.\nMotivo: ${reason}`)

}

if (commandName === "mute") {

if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
return interaction.reply({ content: "❌ Você não tem permissão.", ephemeral: true })

const user = interaction.options.getUser("usuario")
const tempo = interaction.options.getInteger("tempo")
const reason = interaction.options.getString("motivo") || "Sem motivo"

const member = interaction.guild.members.cache.get(user.id)

if (!member)
return interaction.reply("Usuário não encontrado.")

await member.timeout(tempo * 60 * 1000, reason)

interaction.reply(`🔇 ${user.tag} foi mutado por ${tempo} minutos.\nMotivo: ${reason}`)

}

})

client.login(process.env.TOKEN)
