const { Client, GatewayIntentBits, Partials, REST, Routes, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const mongoose = require("mongoose");
require("dotenv").config();

// ===== Conexão MongoDB =====
mongoose
  .connect("mongodb+srv://deltaadmin:bryanana020925*@deltaguardultra.mongodb.net/DeltaBotDB?retryWrites=true&w=majority")
  .then(() => console.log("✅ Conectado ao MongoDB"))
  .catch((err) => {
    console.error("🚨 Erro ao conectar no MongoDB:", err);
    process.exit(1);
  });

// ===== Schemas =====
const configSchema = new mongoose.Schema({
  guildId: String,
  logChannel: String,
});
const Config = mongoose.model("Config", configSchema);

// ===== Cliente Discord =====
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

// ===== Comandos =====
const commands = [
  {
    name: "config",
    description: "Configura o canal de logs do servidor",
    options: [
      { type: 7, name: "canal", description: "Escolha o canal de logs", required: true }
    ]
  },
  {
    name: "ban",
    description: "Bane um usuário",
    options: [
      { type: 6, name: "usuario", description: "Usuário a ser banido", required: true },
      { type: 3, name: "motivo", description: "Motivo do ban", required: false }
    ]
  },
  {
    name: "mute",
    description: "Da mute em um usuário",
    options: [
      { type: 6, name: "usuario", description: "Usuário a ser mutado", required: true },
      { type: 3, name: "tempo", description: "Tempo do mute (ex: 1d, 2h)", required: true }
    ]
  }
];

// ===== Registro automático de comandos =====
const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
(async () => {
  try {
    console.log("🔄 Registrando comandos...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
    console.log("✅ Comandos registrados com sucesso");
  } catch (error) {
    console.error(error);
  }
})();

// ===== Eventos =====
client.on("ready", () => console.log(`✅ BOT ONLINE: ${client.user.tag}`));

// ===== AutoMod e Limpeza Automática =====
const blockedWords = ["estrupado", "estrupada"];
const pornPatterns = [/https?:\/\/.*\.(?:jpg|png|gif|mp4)/gi];

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // Checa palavras bloqueadas
  if (blockedWords.some(word => message.content.toLowerCase().includes(word))) {
    const muteRole = message.guild.roles.cache.find(r => r.name === "Muted");
    if (muteRole) await message.member.roles.add(muteRole);
    message.delete().catch(() => {});
    const config = await Config.findOne({ guildId: message.guild.id });
    if (config && config.logChannel) {
      const logChannel = message.guild.channels.cache.get(config.logChannel);
      logChannel.send(`${message.member} enviou palavra proibida e foi mutado por 1 dia.`);
    }
    return;
  }

  // Checa links pornográficos
  if (pornPatterns.some(pattern => pattern.test(message.content))) {
    const muteRole = message.guild.roles.cache.find(r => r.name === "Muted");
    if (muteRole) await message.member.roles.add(muteRole);
    message.delete().catch(() => {});
    const config = await Config.findOne({ guildId: message.guild.id });
    if (config && config.logChannel) {
      const logChannel = message.guild.channels.cache.get(config.logChannel);
      logChannel.send(`${message.member} enviou link proibido e foi mutado por 1 dia.`);
    }
    return;
  }
});

// ===== Comandos de Slash =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  const { commandName } = interaction;

  if (commandName === "config") {
    const canal = interaction.options.getChannel("canal");
    let config = await Config.findOne({ guildId: interaction.guild.id });
    if (!config) config = new Config({ guildId: interaction.guild.id });
    config.logChannel = canal.id;
    await config.save();
    interaction.reply(`✅ Canal de logs definido: ${canal}`);
  }

  if (commandName === "ban") {
    const usuario = interaction.options.getUser("usuario");
    const motivo = interaction.options.getString("motivo") || "Sem motivo";
    const member = interaction.guild.members.cache.get(usuario.id);
    if (member) {
      const config = await Config.findOne({ guildId: interaction.guild.id });
      if (config && config.logChannel) {
        const logChannel = interaction.guild.channels.cache.get(config.logChannel);
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`confirmBan_${usuario.id}`).setLabel("Confirmar Ban").setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`cancelBan_${usuario.id}`).setLabel("Não Banir").setStyle(ButtonStyle.Secondary)
        );
        logChannel.send({ content: `<@1465203429864374476> quer banir ${usuario.tag}`, components: [row] });
      }
      interaction.reply("⚠️ Pedido de ban enviado para aprovação.");
    } else {
      interaction.reply("❌ Usuário não encontrado.");
    }
  }

  if (commandName === "mute") {
    const usuario = interaction.options.getUser("usuario");
    const tempo = interaction.options.getString("tempo");
    const member = interaction.guild.members.cache.get(usuario.id);
    if (member) {
      const muteRole = interaction.guild.roles.cache.find(r => r.name === "Muted");
      if (muteRole) {
        await member.roles.add(muteRole);
        interaction.reply(`✅ ${usuario.tag} foi mutado por ${tempo}`);
        setTimeout(async () => {
          await member.roles.remove(muteRole);
          const config = await Config.findOne({ guildId: interaction.guild.id });
          if (config && config.logChannel) {
            const logChannel = interaction.guild.channels.cache.get(config.logChannel);
            logChannel.send(`${usuario.tag} teve o mute removido após ${tempo}`);
          }
        }, parseTime(tempo));
      } else {
        interaction.reply("❌ Role Muted não encontrada.");
      }
    }
  }
});

// ===== Função para converter tempo em milissegundos =====
function parseTime(time) {
  const match = time.match(/(\d+)([dhms])/);
  if (!match) return 0;
  const [, num, unit] = match;
  const multipliers = { d: 86400000, h: 3600000, m: 60000, s: 1000 };
  return parseInt(num) * multipliers[unit];
}

client.login(process.env.TOKEN);
