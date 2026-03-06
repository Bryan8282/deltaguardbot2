const { 
Client, 
GatewayIntentBits, 
Partials, 
SlashCommandBuilder, 
REST, 
Routes, 
PermissionsBitField 
} = require("discord.js");

const TOKEN = "SEU_TOKEN";
const CLIENT_ID = "SEU_CLIENT_ID";

const client = new Client({
intents: [
GatewayIntentBits.Guilds,
GatewayIntentBits.GuildMessages,
GatewayIntentBits.MessageContent,
GatewayIntentBits.GuildMembers
],
partials: [Partials.Channel]
});

let config = {
logChannel: null
};

const bannedWords = [
"estrupado",
"estrupada"
];

const commands = [

new SlashCommandBuilder()
.setName("config-logs")
.setDescription("Definir canal de logs")
.addChannelOption(option =>
option.setName("canal")
.setDescription("Canal de logs")
.setRequired(true)
),

new SlashCommandBuilder()
.setName("mute")
.setDescription("Mutar um usuário")
.addUserOption(option =>
option.setName("usuario")
.setDescription("Usuário para mutar")
.setRequired(true)
)
.addIntegerOption(option =>
option.setName("tempo")
.setDescription("Tempo em minutos")
.setRequired(true)
)

].map(cmd => cmd.toJSON());


async function registerCommands() {

const rest = new REST({ version: "10" }).setToken(TOKEN);

try {

console.log("Registrando comandos...");

await rest.put(
Routes.applicationCommands(CLIENT_ID),
{ body: commands }
);

console.log("Comandos registrados automaticamente");

} catch (error) {
console.error(error);
}

}

client.once("ready", async () => {

console.log(`Bot online como ${client.user.tag}`);

await registerCommands();

});


client.on("interactionCreate", async interaction => {

if (!interaction.isChatInputCommand()) return;

if (interaction.commandName === "config-logs") {

const canal = interaction.options.getChannel("canal");

config.logChannel = canal.id;

interaction.reply("Canal de logs configurado.");

}


if (interaction.commandName === "mute") {

const user = interaction.options.getUser("usuario");
const tempo = interaction.options.getInteger("tempo");

const member = await interaction.guild.members.fetch(user.id);

await member.timeout(tempo * 60 * 1000);

interaction.reply(`${user.tag} foi mutado por ${tempo} minutos.`);

if (config.logChannel) {

const canal = interaction.guild.channels.cache.get(config.logChannel);

canal.send(`🔇 ${user.tag} foi mutado por ${tempo} minutos.`);

}

}

});


client.on("messageCreate", async message => {

if (message.author.bot) return;

const content = message.content.toLowerCase();

const palavraDetectada = bannedWords.find(word => content.includes(word));

if (!palavraDetectada) return;

try {

await message.delete();

const member = message.member;

await member.timeout(24 * 60 * 60 * 1000);

message.channel.send(`${member}, palavra proibida detectada. Você foi mutado por 1 dia.`);

if (config.logChannel) {

const canal = message.guild.channels.cache.get(config.logChannel);

canal.send(`🚨 AutoMod detectou palavra proibida.

Usuário: ${member.user.tag}
Palavra: ${palavraDetectada}
Mute: 1 dia`);

}

} catch (err) {
console.log("Erro no AutoMod:", err);
}

});

client.login(TOKEN);
