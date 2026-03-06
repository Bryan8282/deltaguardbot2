require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  REST,
  Routes,
} = require("discord.js");
const mongoose = require("mongoose");

// ====== VERIFICAÇÃO DE VARIÁVEIS ======
if (!process.env.TOKEN || !process.env.CLIENT_ID || !process.env.MONGO_URI) {
  console.error("🚨 ERRO: Variáveis TOKEN, CLIENT_ID ou MONGO_URI não configuradas!");
  process.exit(1);
}

// ====== CLIENT ======
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Message, Partials.Channel],
});

// ====== MONGO ======
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch((err) => {
    console.error("🚨 Erro ao conectar no MongoDB:", err);
    process.exit(1);
  });

// ====== SCHEMAS ======
const configSchema = new mongoose.Schema({
  guildId: String,
  logChannel: String,
});

const Config = mongoose.model("Config", configSchema);

// ====== LISTAS ======
const palavrasProibidas = ["estrupado", "estrupada"];
const pornLinks = ["porn", "xvideos", "pornhub", "xnxx", "redtube"];
const seuID = "1465203429864374476"; // Você será marcado nas logs

// ====== COMANDOS SLASH ======
const comandos = [
  new SlashCommandBuilder()
    .setName("config-logs")
    .setDescription("Definir canal de logs")
    .addChannelOption((o) =>
      o.setName("canal").setDescription("Canal de logs").setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Banir usuário")
    .addUserOption((o) =>
      o.setName("usuario").setDescription("Usuário").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("motivo").setDescription("Motivo do ban").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Expulsar usuário")
    .addUserOption((o) =>
      o.setName("usuario").setDescription("Usuário").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("motivo").setDescription("Motivo do kick").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Mutar usuário")
    .addUserOption((o) =>
      o.setName("usuario").setDescription("Usuário").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("tempo").setDescription("Tempo ex: 1d").setRequired(true)
    )
    .addStringOption((o) =>
      o.setName("motivo").setDescription("Motivo").setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remover mute")
    .addUserOption((o) =>
      o.setName("usuario").setDescription("Usuário").setRequired(true)
    ),
].map((c) => c.toJSON());

// ====== READY ======
client.once("ready", async () => {
  console.log("✅ BOT ONLINE");

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  try {
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: comandos,
    });
    console.log("✅ Comandos registrados com sucesso");
  } catch (err) {
    console.error("🚨 Erro ao registrar comandos:", err);
  }
});

// ====== INTERAÇÕES ======
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const config = await Config.findOne({ guildId: interaction.guild.id });

  // ----- CONFIG LOGS -----
  if (interaction.commandName === "config-logs") {
    const canal = interaction.options.getChannel("canal");
    let data = await Config.findOne({ guildId: interaction.guild.id });
    if (!data) data = new Config({ guildId: interaction.guild.id, logChannel: canal.id });
    else data.logChannel = canal.id;
    await data.save();
    return interaction.reply("✅ Canal de logs configurado");
  }

  // ----- BAN -----
  if (interaction.commandName === "ban") {
    const user = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo") || "Sem motivo";
    const member = interaction.guild.members.cache.get(user.id);
    await member.ban({ reason: motivo });
    interaction.reply(`🔨 Banido: ${user.tag}`);
    if (config) interaction.guild.channels.cache.get(config.logChannel).send(`🔨 Ban | ${user.tag} | Motivo: ${motivo}`);
  }

  // ----- KICK -----
  if (interaction.commandName === "kick") {
    const user = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo") || "Sem motivo";
    const member = interaction.guild.members.cache.get(user.id);
    await member.kick(motivo);
    interaction.reply(`👢 Expulso: ${user.tag}`);
  }

  // ----- MUTE -----
  if (interaction.commandName === "mute") {
    const user = interaction.options.getUser("usuario");
    const tempo = interaction.options.getString("tempo");
    const motivo = interaction.options.getString("motivo") || "Sem motivo";
    const member = interaction.guild.members.cache.get(user.id);
    const cargo = interaction.guild.roles.cache.find((r) => r.name === "Muted");
    await member.roles.add(cargo);
    interaction.reply(`🔇 Mutado: ${user.tag} por ${tempo}`);
    setTimeout(() => member.roles.remove(cargo), 86400000); // 1 dia
  }

  // ----- UNMUTE -----
  if (interaction.commandName === "unmute") {
    const user = interaction.options.getUser("usuario");
    const member = interaction.guild.members.cache.get(user.id);
    const cargo = interaction.guild.roles.cache.find((r) => r.name === "Muted");
    await member.roles.remove(cargo);
    interaction.reply(`🔊 Unmute em ${user.tag}`);
  }
});

// ====== MENSAGENS ======
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  const config = await Config.findOne({ guildId: msg.guild.id });
  const texto = msg.content.toLowerCase();

  // ----- PALAVRAS PROIBIDAS -----
  for (const palavra of palavrasProibidas) {
    if (texto.includes(palavra)) {
      msg.delete();
      const cargo = msg.guild.roles.cache.find((r) => r.name === "Muted");
      const member = msg.guild.members.cache.get(msg.author.id);
      member.roles.add(cargo);
      setTimeout(() => member.roles.remove(cargo), 86400000);
      msg.author.send("Você foi mutado por linguagem proibida");
      if (config) config.logChannel && msg.guild.channels.cache.get(config.logChannel).send(`🚨 Automod | Palavra proibida | ${msg.author.tag}`);
    }
  }

  // ----- LINKS PORNOGRÁFICOS -----
  for (const link of pornLinks) {
    if (texto.includes(link)) {
      msg.delete();
      const cargo = msg.guild.roles.cache.find((r) => r.name === "Muted");
      const member = msg.guild.members.cache.get(msg.author.id);
      member.roles.add(cargo);
      setTimeout(() => member.roles.remove(cargo), 86400000);
      msg.author.send("Link pornográfico detectado");
      if (config) config.logChannel && msg.guild.channels.cache.get(config.logChannel).send(`🔞 Porn detectado | ${msg.author.tag}`);
    }
  }
});

// ====== NOVOS MEMBROS ======
client.on("guildMemberAdd", async (member) => {
  const diasConta = (Date.now() - member.user.createdTimestamp) / 1000 / 60 / 60 / 24;
  let risco = 0;
  if (diasConta < 7) risco += 5;
  if (!member.user.avatar) risco += 2;
  const config = await Config.findOne({ guildId: member.guild.id });
  if (config && config.logChannel) {
    const canal = member.guild.channels.cache.get(config.logChannel);
    canal.send(`⚠️ Usuário suspeito entrou
Usuário: ${member.user.tag}
Conta criada há: ${Math.floor(diasConta)} dias
Risco: ${risco}/10
<@${seuID}>`);
  }
});

client.login(process.env.TOKEN);
