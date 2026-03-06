require("dotenv").config()

const { 
Client,
GatewayIntentBits,
Partials,
EmbedBuilder,
PermissionsBitField,
ActionRowBuilder,
ButtonBuilder,
ButtonStyle,
SlashCommandBuilder,
REST,
Routes
} = require("discord.js")

const mongoose = require("mongoose")

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent
],
partials: [Partials.Message, Partials.Channel]
})

mongoose.connect(process.env.MONGO_URI)

const configSchema = new mongoose.Schema({
guildId: String,
logChannel: String,
})

const Config = mongoose.model("Config", configSchema)

const palavrasProibidas = [
"estrupado",
"estrupada"
]

const pornLinks = [
"porn",
"xvideos",
"pornhub",
"xnxx",
"redtube"
]

const comandos = [

new SlashCommandBuilder()
.setName("config-logs")
.setDescription("Definir canal de logs")
.addChannelOption(o =>
o.setName("canal")
.setDescription("Canal de logs")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("ban")
.setDescription("Banir usuário")
.addUserOption(o => o.setName("usuario").setRequired(true).setDescription("Usuário"))
.addStringOption(o => o.setName("motivo").setRequired(false).setDescription("Motivo")),

new SlashCommandBuilder()
.setName("kick")
.setDescription("Expulsar usuário")
.addUserOption(o => o.setName("usuario").setRequired(true).setDescription("Usuário"))
.addStringOption(o => o.setName("motivo").setRequired(false).setDescription("Motivo")),

new SlashCommandBuilder()
.setName("mute")
.setDescription("Mutar usuário")
.addUserOption(o => o.setName("usuario").setRequired(true).setDescription("Usuário"))
.addStringOption(o => o.setName("tempo").setRequired(true).setDescription("Tempo exemplo 1d"))
.addStringOption(o => o.setName("motivo").setRequired(false).setDescription("Motivo")),

new SlashCommandBuilder()
.setName("unmute")
.setDescription("Remover mute")
.addUserOption(o => o.setName("usuario").setRequired(true).setDescription("Usuário"))

].map(c => c.toJSON())

client.once("ready", async () => {

console.log("BOT ONLINE")

const rest = new REST({version:"10"}).setToken(process.env.TOKEN)

await rest.put(
Routes.applicationCommands(process.env.CLIENT_ID),
{ body: comandos }
)

console.log("Comandos registrados")

})

client.on("interactionCreate", async interaction => {

if(!interaction.isChatInputCommand()) return

const config = await Config.findOne({guildId:interaction.guild.id})

if(interaction.commandName === "config-logs"){

const canal = interaction.options.getChannel("canal")

let data = await Config.findOne({guildId:interaction.guild.id})

if(!data){

data = new Config({
guildId: interaction.guild.id,
logChannel: canal.id
})

}else{

data.logChannel = canal.id

}

await data.save()

interaction.reply("Canal de logs configurado")

}

if(interaction.commandName === "ban"){

const user = interaction.options.getUser("usuario")
const motivo = interaction.options.getString("motivo") || "Sem motivo"

const member = interaction.guild.members.cache.get(user.id)

await member.ban({reason: motivo})

interaction.reply(`Banido: ${user.tag}`)

if(config){

const canal = interaction.guild.channels.cache.get(config.logChannel)

canal.send(`🔨 Ban | ${user.tag} | Motivo: ${motivo}`)

}

}

if(interaction.commandName === "kick"){

const user = interaction.options.getUser("usuario")
const motivo = interaction.options.getString("motivo") || "Sem motivo"

const member = interaction.guild.members.cache.get(user.id)

await member.kick(motivo)

interaction.reply(`Expulso: ${user.tag}`)

}

if(interaction.commandName === "mute"){

const user = interaction.options.getUser("usuario")
const tempo = interaction.options.getString("tempo")
const motivo = interaction.options.getString("motivo") || "Sem motivo"

const member = interaction.guild.members.cache.get(user.id)

const cargo = interaction.guild.roles.cache.find(r => r.name === "Muted")

await member.roles.add(cargo)

interaction.reply(`Mutado: ${user.tag} por ${tempo}`)

setTimeout(()=>{

member.roles.remove(cargo)

}, 86400000)

}

if(interaction.commandName === "unmute"){

const user = interaction.options.getUser("usuario")

const member = interaction.guild.members.cache.get(user.id)

const cargo = interaction.guild.roles.cache.find(r => r.name === "Muted")

await member.roles.remove(cargo)

interaction.reply(`Unmute em ${user.tag}`)

}

})

client.on("messageCreate", async msg => {

if(msg.author.bot) return

const config = await Config.findOne({guildId:msg.guild.id})

const texto = msg.content.toLowerCase()

for(const palavra of palavrasProibidas){

if(texto.includes(palavra)){

msg.delete()

const cargo = msg.guild.roles.cache.find(r=>r.name==="Muted")

const member = msg.guild.members.cache.get(msg.author.id)

member.roles.add(cargo)

setTimeout(()=>{
member.roles.remove(cargo)
},86400000)

msg.author.send("Você foi mutado por linguagem proibida")

if(config){

const canal = msg.guild.channels.cache.get(config.logChannel)

canal.send(`🚨 Automod | Palavra proibida | ${msg.author.tag}`)

}

}

}

for(const link of pornLinks){

if(texto.includes(link)){

msg.delete()

const cargo = msg.guild.roles.cache.find(r=>r.name==="Muted")

const member = msg.guild.members.cache.get(msg.author.id)

member.roles.add(cargo)

setTimeout(()=>{
member.roles.remove(cargo)
},86400000)

msg.author.send("Link pornográfico detectado")

if(config){

const canal = msg.guild.channels.cache.get(config.logChannel)

canal.send(`🔞 Porn detectado | ${msg.author.tag}`)

}

}

}

})

client.on("guildMemberAdd", async member => {

const contaIdade = Date.now() - member.user.createdTimestamp

const dias = contaIdade / 1000 / 60 / 60 / 24

let risco = 0

if(dias < 7) risco += 5

if(!member.user.avatar) risco += 2

const config = await Config.findOne({guildId:member.guild.id})

if(config){

const canal = member.guild.channels.cache.get(config.logChannel)

canal.send(`⚠️ Usuário suspeito entrou

Usuário: ${member.user.tag}
Conta criada há: ${Math.floor(dias)} dias
Risco: ${risco}/10

<@1465203429864374476>
`)

}

})

client.login(process.env.TOKEN)
