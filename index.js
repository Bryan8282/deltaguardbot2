require("dotenv").config();

const { 
Client, 
GatewayIntentBits, 
Partials,
PermissionsBitField 
} = require("discord.js");

const mongoose = require("mongoose");

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.GuildMembers,
GatewayIntentBits.MessageContent
],
partials: [Partials.Channel]
});


// -------------------
// CONEXÃO MONGODB
// -------------------

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB conectado"))
.catch(err => console.log(err));


// -------------------
// BOT ONLINE
// -------------------

client.once("ready", () => {

console.log(`Bot online como ${client.user.tag}`);

});


// -------------------
// COMANDOS
// -------------------

client.on("interactionCreate", async interaction => {

if (!interaction.isChatInputCommand()) return;

const { commandName } = interaction;


// -------------------
// PING
// -------------------

if (commandName === "ping") {

return interaction.reply(`🏓 Pong! ${client.ws.ping}ms`);

}


// -------------------
// HELP
// -------------------

if (commandName === "help") {

return interaction.reply({

content:
`
📜 **Comandos disponíveis**

/ping → Testar bot  
/ban → Banir membro  
/kick → Expulsar membro  
/mute → Mutar membro  
/help → Lista de comandos
`,
ephemeral: true

});

}


// -------------------
// BAN
// -------------------

if (commandName === "ban") {

if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers))
return interaction.reply({content:"❌ Sem permissão.",ephemeral:true});

const user = interaction.options.getUser("usuario");
const motivo = interaction.options.getString("motivo") || "Sem motivo";

const member = interaction.guild.members.cache.get(user.id);

if (!member)
return interaction.reply("Usuário não encontrado.");

await member.ban({ reason: motivo });

interaction.reply(`🔨 ${user.tag} foi banido.\nMotivo: ${motivo}`);

}


// -------------------
// KICK
// -------------------

if (commandName === "kick") {

if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers))
return interaction.reply({content:"❌ Sem permissão.",ephemeral:true});

const user = interaction.options.getUser("usuario");
const motivo = interaction.options.getString("motivo") || "Sem motivo";

const member = interaction.guild.members.cache.get(user.id);

if (!member)
return interaction.reply("Usuário não encontrado.");

await member.kick(motivo);

interaction.reply(`👢 ${user.tag} foi expulso.\nMotivo: ${motivo}`);

}


// -------------------
// MUTE
// -------------------

if (commandName === "mute") {

if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers))
return interaction.reply({content:"❌ Sem permissão.",ephemeral:true});

const user = interaction.options.getUser("usuario");
const tempo = interaction.options.getInteger("tempo");
const motivo = interaction.options.getString("motivo") || "Sem motivo";

const member = interaction.guild.members.cache.get(user.id);

if (!member)
return interaction.reply("Usuário não encontrado.");

await member.timeout(tempo * 60 * 1000, motivo);

interaction.reply(`🔇 ${user.tag} foi mutado por ${tempo} minutos.\nMotivo: ${motivo}`);

}

});


// -------------------
// LOGIN BOT
// -------------------

client.login(process.env.TOKEN);
