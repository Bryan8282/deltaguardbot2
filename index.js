// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, SlashCommandBuilder } = require('discord.js');
const mongoose = require('mongoose');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

// ---------------------- MONGODB ----------------------
if (process.env.MONGO_URI) {
    mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => console.log('MongoDB conectado ✅'))
      .catch(err => console.log('Erro MongoDB:', err));
}

// ---------------------- COMANDOS ----------------------
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Responde com pong!'),
    new SlashCommandBuilder().setName('ban').setDescription('Bane um usuário do servidor'),
    new SlashCommandBuilder().setName('kick').setDescription('Expulsa um usuário do servidor')
].map(cmd => cmd.toJSON());

// Registrar comandos
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
(async () => {
    try {
        console.log('Registrando comandos...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: commands }
        );
        console.log('Comandos registrados ✅');
    } catch (err) {
        console.error(err);
    }
})();

// ---------------------- EVENTOS ----------------------
client.once('ready', () => {
    console.log(`Bot online como ${client.user.tag} ✅`);
});

// Comandos prefixo "!"
client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    if (cmd === '!ping') {
        message.reply('Pong!');
    }

    if (cmd === '!ban') {
        if (!message.member.permissions.has('BAN_MEMBERS')) return message.reply('Você não tem permissão!');
        const user = message.mentions.members.first();
        if (!user) return message.reply('Mencione um usuário para banir.');
        await user.ban().catch(err => message.reply('Não foi possível banir o usuário.'));
        message.reply(`${user.user.tag} foi banido ✅`);
    }

    if (cmd === '!kick') {
        if (!message.member.permissions.has('KICK_MEMBERS')) return message.reply('Você não tem permissão!');
        const user = message.mentions.members.first();
        if (!user) return message.reply('Mencione um usuário para expulsar.');
        await user.kick().catch(err => message.reply('Não foi possível expulsar o usuário.'));
        message.reply(`${user.user.tag} foi expulso ✅`);
    }
});

// Slash commands
client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }

    if (interaction.commandName === 'ban') {
        if (!interaction.member.permissions.has('BAN_MEMBERS')) return interaction.reply('Você não tem permissão!');
        const user = interaction.options.getUser('usuário');
        if (!user) return interaction.reply('Mencione um usuário para banir.');
        const member = interaction.guild.members.cache.get(user.id);
        await member.ban().catch(() => interaction.reply('Não foi possível banir o usuário.'));
        await interaction.reply(`${user.tag} foi banido ✅`);
    }

    if (interaction.commandName === 'kick') {
        if (!interaction.member.permissions.has('KICK_MEMBERS')) return interaction.reply('Você não tem permissão!');
        const user = interaction.options.getUser('usuário');
        if (!user) return interaction.reply('Mencione um usuário para expulsar.');
        const member = interaction.guild.members.cache.get(user.id);
        await member.kick().catch(() => interaction.reply('Não foi possível expulsar o usuário.'));
        await interaction.reply(`${user.tag} foi expulso ✅`);
    }
});

// ---------------------- LOGIN ----------------------
client.login(process.env.TOKEN);
