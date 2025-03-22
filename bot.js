const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const REGISTRATION_FILE = './registrations.json';
const ADMIN_CHANNEL_ID = '1352691332166062110'; 
const APPROVAL_CHANNEL_ID = '1331303094033846382'; 
const REJECTION_CHANNEL_ID = '1331303161469603910'; 

function loadRegistrations() {
    if (!fs.existsSync(REGISTRATION_FILE)) {
        fs.writeFileSync(REGISTRATION_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(REGISTRATION_FILE));
}

function saveRegistrations(data) {
    fs.writeFileSync(REGISTRATION_FILE, JSON.stringify(data, null, 4));
}

let registrations = loadRegistrations();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates // Adicionado para silenciar usuários
    ]
});

client.once('ready', async () => {
    console.log(`🤖 Bot está online como ${client.user.tag}!`);
    
    const commands = [
        new SlashCommandBuilder()
            .setName('registro')
            .setDescription('📝 Registre seu nick do Minecraft'),
        new SlashCommandBuilder()
            .setName('limparchat')
            .setDescription('🧹 Limpa mensagens de um canal')
            .addIntegerOption(option => option.setName('quantidade').setDescription('Número de mensagens a serem limpas').setRequired(true)),
        new SlashCommandBuilder()
            .setName('ban')
            .setDescription('🚫 Bane um usuário do servidor')
            .addUserOption(option => option.setName('usuário').setDescription('Usuário a ser banido').setRequired(true)),
        new SlashCommandBuilder()
            .setName('kick')
            .setDescription('👢 Expulsa um usuário do servidor')
            .addUserOption(option => option.setName('usuário').setDescription('Usuário a ser expulso').setRequired(true)),
        new SlashCommandBuilder()
            .setName('mute')
            .setDescription('🔇 Silencia um usuário')
            .addUserOption(option => option.setName('usuário').setDescription('Usuário a ser silenciado').setRequired(true)),
        new SlashCommandBuilder()
            .setName('castigo')
            .setDescription('⚖️ Aplica um castigo a um usuário')
            .addUserOption(option => option.setName('usuário').setDescription('Usuário a ser punido').setRequired(true))
            .addStringOption(option => option.setName('motivo').setDescription('Motivo do castigo').setRequired(true))
    ].map(command => command.toJSON());
    
    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
    try {
        console.log('🔧 Registrando comandos...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('✅ Comandos registrados com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao registrar comandos:', error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    // Comando de Registro
    if (interaction.commandName === 'registro') {
        if (registrations[interaction.user.id]) {
            return interaction.reply({ content: '⚠️ Você já realizou seu registro.', ephemeral: true });
        }

        const modal = new ModalBuilder()
            .setCustomId('registroForm')
            .setTitle('📜 Registro no Minecraft');

        const nickInput = new TextInputBuilder()
            .setCustomId('nick')
            .setLabel('✍️ Digite seu nick do Minecraft')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const nameInput = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('🧑 Nome do personagem')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const historyInput = new TextInputBuilder()
            .setCustomId('history')
            .setLabel('📜 História do personagem')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const talentInput = new TextInputBuilder()
            .setCustomId('talent')
            .setLabel('✨ Habilidade ou talento especial')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const actionRow1 = new ActionRowBuilder().addComponents(nickInput);
        const actionRow2 = new ActionRowBuilder().addComponents(nameInput);
        const actionRow3 = new ActionRowBuilder().addComponents(historyInput);
        const actionRow4 = new ActionRowBuilder().addComponents(talentInput);

        modal.addComponents(actionRow1, actionRow2, actionRow3, actionRow4);

        await interaction.showModal(modal);
    }

    // Modal Submit
    if (interaction.isModalSubmit() && interaction.customId === 'registroForm') {
        const nick = interaction.fields.getTextInputValue('nick');
        const name = interaction.fields.getTextInputValue('name');
        const history = interaction.fields.getTextInputValue('history');
        const talent = interaction.fields.getTextInputValue('talent');
        
        registrations[interaction.user.id] = { nick, name, history, talent, status: 'pendente', reviewed: false };
        saveRegistrations(registrations);

        const professionSelect = new StringSelectMenuBuilder()
            .setCustomId(`profissao_${interaction.user.id}`)
            .setPlaceholder('Escolha uma profissão')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions([
                { label: '⚔️ Guerreiro', value: 'guerreiro' },
                { label: '🛡️ Guarda Real', value: 'guarda_real' },
                { label: '🏇 Cavaleiro Real', value: 'cavaleiro_real' },
                { label: '🗺️ Aventureiro', value: 'aventureiro' },
                { label: '🏗️ Construtor', value: 'construtor' },
                { label: '🛒 Mercador', value: 'mercador' },
                { label: '⛏️ Minerador', value: 'minerador' },
                { label: '✨ Mago', value: 'mago' },
                { label: '🌾 Fazendeiro', value: 'fazendeiro' },
                { label: '💰 Caçador de Recompensas', value: 'cacador_recompensas' },
                { label: '🌲 Madeireiro', value: 'madeireiro' },
                { label: '🛠️ Artesão', value: 'artesao' },
                { label: '✝️ Clérigo', value: 'clerigo' },
                { label: '⚗️ Alquimista', value: 'alquimista' },
                { label: '🍞 Padeiro', value: 'padeiro' },
                { label: '🎣 Pescador', value: 'pescador' },
                { label: '⚕️ Médico / Curandeiro', value: 'medico' },
                { label: '🐎 Cocheiro', value: 'cocheiro' },
                { label: '🏚️ Taberneiro', value: 'taberneiro' },
                { label: '🔧 Engenheiro', value: 'engenheiro' },
                { label: '📦 Estalajadeiro', value: 'estalajadeiro' },
                { label: '🏹 Arqueiro', value: 'arqueiro' },
                { label: '⚒️ Ferreiro', value: 'ferreiro' },
                { label: '❓ Outra (Especifique no chat)', value: 'outra' }
            ]);

        const actionRow = new ActionRowBuilder().addComponents(professionSelect);

        await interaction.reply({
            content: '🔹 Selecione sua profissão:',
            components: [actionRow],
            flags: 64
        });
    }

    // Seleção de Profissão
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('profissao_')) {
        const professionValue = interaction.values[0];
        registrations[interaction.user.id].profession = professionValue; 
        registrations[interaction.user.id].origin = null; 
        registrations[interaction.user.id].status = 'pendente'; 

        saveRegistrations(registrations);

        const originSelect = new StringSelectMenuBuilder()
            .setCustomId(`origem_${interaction.user.id}`)
            .setPlaceholder('Escolha sua origem')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions([
                { label: '👑 Esmiriano / Esmiriana', value: 'esmiriano' },
                { label: '🦁 Bromeriano / Bromeriana', value: 'bromeriano' },
                { label: '🏹 Eldoranês / Eldoranesa', value: 'eldoranes' },
                { label: '🛡️ Amarioniano / Amarioniana', value: 'amarioniano' },
                { label: '⚔️ Valdoriano / Valdoriana', value: 'valdoriano' },
                { label: '⚓ Portugalez / Portugalesa', value: 'portugalez' },
                { label: '🔥 Auriano / Auriana', value: 'auriano' },
                { label: '🪓 Vikingue', value: 'vikingue' },
                { label: '🌿 Forasteiro / Forasteira', value: 'forasteiro' }
            ]);

        const actionRow = new ActionRowBuilder().addComponents(originSelect);

        await interaction.update({
            content: '🌍 Escolha sua origem:',
            components: [actionRow],
            flags: 64
        });
    }

    // Seleção de Origem
    if (interaction.isStringSelectMenu() && interaction.customId.startsWith('origem_')) {
        const originValue = interaction.values[0];
        registrations[interaction.user.id].origin = originValue;
        registrations[interaction.user.id].status = 'pendente'; 

        saveRegistrations(registrations);

        const adminChannel = await client.channels.fetch(ADMIN_CHANNEL_ID);
        if (adminChannel) {
            const approveButton = new ButtonBuilder()
                .setCustomId(`aprovar_${interaction.user.id}`)
                .setLabel('✅ Aprovar')
                .setStyle(ButtonStyle.Success);

            const rejectButton = new ButtonBuilder()
                .setCustomId(`reprovar_${interaction.user.id}`)
                .setLabel('❌ Reprovar')
                .setStyle(ButtonStyle.Danger);

            const actionRow = new ActionRowBuilder().addComponents(approveButton, rejectButton);

            await adminChannel.send({
                content: `🚨 Novo registro pendente: <@${interaction.user.id}>\nNick: ${registrations[interaction.user.id].nick}\nProfissão: ${registrations[interaction.user.id].profession}\nOrigem: ${originValue}\nAguardando aprovação.`,
                components: [actionRow]
            });
        }

        await interaction.update({
            content: `🌍 Você escolheu a origem: ${originValue}. Seu registro foi concluído e está aguardando aprovação!`,
            components: [],
            flags: 64
        });
    }

    // Comando de Limpar Chat
    if (interaction.commandName === 'limparchat') {
        const quantidade = interaction.options.getInteger('quantidade');
        if (quantidade < 1 || quantidade > 100) {
            return interaction.reply({ content: '⚠️ A quantidade deve ser entre 1 e 100.', ephemeral: true });
        }
        await interaction.channel.bulkDelete(quantidade, true);
        return interaction.reply({ content: `🧹 ${quantidade} mensagens foram limpas!`, ephemeral: true });
    }

    // Comando de Banir
    if (interaction.commandName === 'ban') {
        const user = interaction.options.getUser('usuário');
        if (user) {
            const member = await interaction.guild.members.fetch(user.id);
            await member.ban();
            return interaction.reply({ content: `🚫 ${user.tag} foi banido do servidor!`, ephemeral: true });
        }
        return interaction.reply({ content: '⚠️ Usuário não encontrado.', ephemeral: true });
    }

    // Comando de Expulsar
    if (interaction.commandName === 'kick') {
        const user = interaction.options.getUser('usuário');
        if (user) {
            const member = await interaction.guild.members.fetch(user.id);
            await member.kick();
            return interaction.reply({ content: `👢 ${user.tag} foi expulso do servidor!`, ephemeral: true });
        }
        return interaction.reply({ content: '⚠️ Usuário não encontrado.', ephemeral: true });
    }

    // Comando de Silenciar
    if (interaction.commandName === 'mute') {
        const user = interaction.options.getUser('usuário');
        if (user) {
            const member = await interaction.guild.members.fetch(user.id);
            await member.voice.setMute(true);
            return interaction.reply({ content: `🔇 ${user.tag} foi silenciado!`, ephemeral: true });
        }
        return interaction.reply({ content: '⚠️ Usuário não encontrado.', ephemeral: true });
    }

    // Comando de Castigo
    if (interaction.commandName === 'castigo') {
        const user = interaction.options.getUser('usuário');
        const motivo = interaction.options.getString('motivo');
        if (user) {
            const member = await interaction.guild.members.fetch(user.id);
            // Aqui você pode adicionar lógica para registrar o castigo
            return interaction.reply({ content: `⚖️ ${user.tag} recebeu um castigo: ${motivo}`, ephemeral: true });
        }
        return interaction.reply({ content: '⚠️ Usuário não encontrado.', ephemeral: true });
    }

    // Aprovar Registro
    if (interaction.isButton() && interaction.customId.startsWith('aprovar_')) {
        const userId = interaction.customId.split('_')[1];

        if (registrations[userId].reviewed) {
            return interaction.reply({
                content: '⚠️ Este registro já foi aprovado ou reprovado.',
                ephemeral: true
            });
        }

        registrations[userId].status = 'aprovado'; 
        registrations[userId].reviewed = true; 
        saveRegistrations(registrations);

        const user = await client.users.fetch(userId);
        if (user) {
            await user.send('✅ Seu registro foi aprovado!');
        }

        const approvalChannel = await client.channels.fetch(APPROVAL_CHANNEL_ID);
        if (approvalChannel) {
            await approvalChannel.send(`✅ Registro de <@${userId}> aprovado!`);
        }

        await interaction.reply({
            content: `✅ Registro de <@${userId}> aprovado!`,
            ephemeral: true
        });
    }

    // Reprovar Registro
    if (interaction.isButton() && interaction.customId.startsWith('reprovar_')) {
        const userId = interaction.customId.split('_')[1];

        if (registrations[userId].reviewed) {
            return interaction.reply({
                content: '⚠️ Este registro já foi aprovado ou reprovado.',
                ephemeral: true
            });
        }

        registrations[userId].status = 'reprovado'; 
        registrations[userId].reviewed = true; 
        saveRegistrations(registrations);

        const user = await client.users.fetch(userId);
        if (user) {
            await user.send('❌ Seu registro foi reprovado.');
        }

        const rejectionChannel = await client.channels.fetch(REJECTION_CHANNEL_ID);
        if (rejectionChannel) {
            await rejectionChannel.send(`❌ Registro de <@${userId}> reprovado!`);
        }

        await interaction.reply({
            content: `❌ Registro de <@${userId}> reprovado!`,
            ephemeral: true
        });
    }
});

client.login(process.env.TOKEN);
