require("dotenv").config()

const { 
Client, 
GatewayIntentBits, 
PermissionsBitField 
} = require("discord.js")

const mongoose = require("mongoose")

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
})

mongoose.connect(process.env.MONGO)

const configSchema = new mongoose.Schema({
guildId: String,
logChannel: String,
muteRole: String
})

const Config = mongoose.model("Config", configSchema)

client.once("ready", () => {
console.log(`Bot online: ${client.user.tag}`)
})

/* ============================= */
/* SISTEMA DE CONFIGURAÇÃO */
/* ============================= */

client.on("interactionCreate", async (interaction) => {

if (!interaction.isChatInputCommand()) return

const config = await Config.findOne({ guildId: interaction.guild.id })

if (interaction.commandName === "setlog") {

if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
return interaction.reply({ content: "Sem permissão.", ephemeral: true })

const canal = interaction.options.getChannel("canal")

await Config.findOneAndUpdate(
{ guildId: interaction.guild.id },
{ logChannel: canal.id },
{ upsert: true }
)

interaction.reply(`✅ Canal de logs definido para ${canal}`)

}

if (interaction.commandName === "setmute") {

if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
return interaction.reply({ content: "Sem permissão.", ephemeral: true })

const cargo = interaction.options.getRole("cargo")

await Config.findOneAndUpdate(
{ guildId: interaction.guild.id },
{ muteRole: cargo.id },
{ upsert: true }
)

interaction.reply(`✅ Cargo de mute definido para ${cargo}`)
}

/* ============================= */
/* BAN */
/* ============================= */

if (interaction.commandName === "ban") {

const user = interaction.options.getUser("usuario")
const motivo = interaction.options.getString("motivo") || "Sem motivo"

const member = interaction.guild.members.cache.get(user.id)

await member.ban({ reason: motivo })

interaction.reply(`🔨 ${user.tag} foi banido.`)

if (config?.logChannel) {

const log = interaction.guild.channels.cache.get(config.logChannel)

log.send(`🔨 **BAN**
Usuário: ${user.tag}
Moderador: ${interaction.user.tag}
Motivo: ${motivo}`)
}

}

/* ============================= */
/* MUTE */
/* ============================= */

if (interaction.commandName === "mute") {

const user = interaction.options.getUser("usuario")
const tempo = interaction.options.getInteger("tempo")
const motivo = interaction.options.getString("motivo") || "Sem motivo"

const member = interaction.guild.members.cache.get(user.id)

await member.roles.add(config.muteRole)

interaction.reply(`🔇 ${user.tag} mutado por ${tempo} minutos.`)

setTimeout(async () => {
await member.roles.remove(config.muteRole)
}, tempo * 60000)

if (config?.logChannel) {

const log = interaction.guild.channels.cache.get(config.logChannel)

log.send(`🔇 **MUTE**
Usuário: ${user.tag}
Moderador: ${interaction.user.tag}
Tempo: ${tempo} minutos
Motivo: ${motivo}`)
}

}

})

/* ============================= */
/* AUTOMOD PORNOGRAFIA */
/* ============================= */

client.on("messageCreate", async (message) => {

if (message.author.bot) return

const config = await Config.findOne({ guildId: message.guild.id })

const pornWords = [
"xvideos",
"pornhub",
"xhamster",
"redtube",
"xnxx"
]

if (message.content.includes("http")) {

for (let word of pornWords) {

if (message.content.toLowerCase().includes(word)) {

await message.delete().catch(() => {})

if (!config?.muteRole) return

await message.member.roles.add(config.muteRole)

setTimeout(async () => {
await message.member.roles.remove(config.muteRole)
}, 86400000)

try {
await message.author.send(
"🚫 Você enviou um link pornográfico e recebeu mute de 1 dia."
)
} catch {}

if (config?.logChannel) {

const log = message.guild.channels.cache.get(config.logChannel)

log.send(`🚫 **AutoMod**
Usuário: ${message.author.tag}
Ação: Mute 1 dia
Motivo: Link pornográfico`)
}

}

}

}

})

/* ============================= */
/* LOG DE ENTRADA */
/* ============================= */

client.on("guildMemberAdd", async (member) => {

const config = await Config.findOne({ guildId: member.guild.id })

if (!config?.logChannel) return

const log = member.guild.channels.cache.get(config.logChannel)

log.send(`👤 ${member.user.tag} entrou no servidor.`)

})

/* ============================= */
/* LOG DE SAÍDA */
/* ============================= */

client.on("guildMemberRemove", async (member) => {

const config = await Config.findOne({ guildId: member.guild.id })

if (!config?.logChannel) return

const log = member.guild.channels.cache.get(config.logChannel)

log.send(`👋 ${member.user.tag} saiu do servidor.`)

})

client.login(process.env.TOKEN)
