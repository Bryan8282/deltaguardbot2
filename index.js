require("dotenv").config()

const {
Client,
GatewayIntentBits,
PermissionsBitField,
REST,
Routes,
SlashCommandBuilder
} = require("discord.js")

const client = new Client({
intents:[
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
]
})

const config = {}

const commands = [

new SlashCommandBuilder()
.setName("ping")
.setDescription("Ver latência"),

new SlashCommandBuilder()
.setName("ban")
.setDescription("Banir usuário")
.addUserOption(o=>o.setName("usuario").setDescription("Usuário").setRequired(true))
.addStringOption(o=>o.setName("motivo").setDescription("Motivo")),

new SlashCommandBuilder()
.setName("mute")
.setDescription("Mutar usuário")
.addUserOption(o=>o.setName("usuario").setDescription("Usuário").setRequired(true))
.addIntegerOption(o=>o.setName("tempo").setDescription("Tempo em minutos").setRequired(true))
.addStringOption(o=>o.setName("motivo").setDescription("Motivo")),

new SlashCommandBuilder()
.setName("unmute")
.setDescription("Desmutar usuário")
.addUserOption(o=>o.setName("usuario").setDescription("Usuário").setRequired(true)),

new SlashCommandBuilder()
.setName("config")
.setDescription("Configurar bot")
.addSubcommand(s=>
s.setName("logs")
.setDescription("Definir canal de logs")
.addChannelOption(o=>
o.setName("canal")
.setDescription("Canal de logs")
.setRequired(true)
))

].map(c=>c.toJSON())

async function registrar(){

const rest = new REST({version:"10"}).setToken(process.env.TOKEN)

await rest.put(
Routes.applicationCommands(process.env.CLIENT_ID),
{body:commands}
)

}

client.once("ready", async ()=>{

console.log("Bot online")

await registrar()

})

client.on("interactionCreate", async interaction=>{

if(!interaction.isChatInputCommand()) return

const guildId = interaction.guild.id

if(interaction.commandName === "ping"){
return interaction.reply("🏓 Pong!")
}

if(interaction.commandName === "config"){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator))
return interaction.reply({content:"Sem permissão",ephemeral:true})

const canal = interaction.options.getChannel("canal")

config[guildId] = {
logChannel: canal.id
}

interaction.reply(`✅ Canal de logs definido: ${canal}`)
}

if(interaction.commandName === "ban"){

if(!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
return interaction.reply({content:"Sem permissão",ephemeral:true})

const user = interaction.options.getUser("usuario")
const motivo = interaction.options.getString("motivo") || "Sem motivo"

const member = interaction.guild.members.cache.get(user.id)

await member.ban({reason:motivo})

interaction.reply(`🔨 ${user.tag} foi banido`)

if(config[guildId]?.logChannel){

const log = interaction.guild.channels.cache.get(config[guildId].logChannel)

log.send(`🔨 Ban
Usuário: ${user.tag}
Motivo: ${motivo}`)
}

}

if(interaction.commandName === "mute"){

const user = interaction.options.getUser("usuario")
const tempo = interaction.options.getInteger("tempo")
const motivo = interaction.options.getString("motivo") || "Sem motivo"

const member = interaction.guild.members.cache.get(user.id)

let role = interaction.guild.roles.cache.find(r=>r.name==="Muted")

if(!role){

role = await interaction.guild.roles.create({
name:"Muted",
permissions:[]
})

interaction.guild.channels.cache.forEach(async c=>{
await c.permissionOverwrites.create(role,{SendMessages:false})
})

}

await member.roles.add(role)

interaction.reply(`🔇 ${user.tag} mutado por ${tempo} minutos`)

if(config[guildId]?.logChannel){

const log = interaction.guild.channels.cache.get(config[guildId].logChannel)

log.send(`🔇 Mute
Usuário: ${user.tag}
Tempo: ${tempo} minutos
Motivo: ${motivo}`)
}

setTimeout(async ()=>{
await member.roles.remove(role)
}, tempo*60000)

}

if(interaction.commandName === "unmute"){

const user = interaction.options.getUser("usuario")

const member = interaction.guild.members.cache.get(user.id)

const role = interaction.guild.roles.cache.find(r=>r.name==="Muted")

if(role) await member.roles.remove(role)

interaction.reply(`🔊 ${user.tag} desmutado`)
}

})

client.on("messageCreate", async message=>{

if(message.author.bot) return

const guildId = message.guild.id

const pornSites = [
"xvideos",
"pornhub",
"xnxx",
"xhamster",
"redtube"
]

if(message.content.includes("http")){

for(const site of pornSites){

if(message.content.toLowerCase().includes(site)){

await message.delete().catch(()=>{})

let role = message.guild.roles.cache.find(r=>r.name==="Muted")

if(role){

await message.member.roles.add(role)

setTimeout(()=>{
message.member.roles.remove(role)
},86400000)

}

try{
await message.author.send("🚫 Você enviou link pornográfico e recebeu mute de 1 dia.")
}catch{}

if(config[guildId]?.logChannel){

const log = message.guild.channels.cache.get(config[guildId].logChannel)

log.send(`🚫 AutoMod
Usuário: ${message.author.tag}
Motivo: link pornográfico
Ação: mute 1 dia`)
}

}

}

}

})

client.login(process.env.TOKEN)
