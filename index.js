import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('ready', () => console.log(`${client.user.tag} aktif!`));

client.on('interactionCreate', async interaction => {
    try {
        // /takım komutu
        if (interaction.isChatInputCommand() && interaction.commandName === 'takım') {
            if (interaction.user.id !== process.env.CREATOR_ID) {
                return interaction.reply({ content: 'Sadece kurucu kullanabilir.', ephemeral: true });
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('takim_kur')
                    .setLabel('Takım Kur')
                    .setStyle(ButtonStyle.Primary)
            );

            return interaction.reply({ content: 'Takım kurmak için butona bas:', components: [row], ephemeral: true });
        }

        // Takım Kur butonu
        if (interaction.isButton() && interaction.customId === 'takim_kur') {
            if (interaction.user.id !== process.env.CREATOR_ID) return interaction.reply({ content: 'Sadece kurucu bu işlemi başlatabilir.', ephemeral: true });

            const modal = new ModalBuilder().setCustomId('takim_modal').setTitle('Takım Kur');
            const rows = [];
            for (let i = 1; i <= 5; i++) {
                const input = new TextInputBuilder()
                    .setCustomId(`slot${i}`)
                    .setLabel(`${i}. Oyuncu (mention veya ID)`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(i === 1);
                rows.push(new ActionRowBuilder().addComponents(input));
            }
            modal.addComponents(...rows);
            return interaction.showModal(modal);
        }

        // Modal submit
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === 'takim_modal') {
            if (interaction.user.id !== process.env.CREATOR_ID) return interaction.reply({ content: 'Sadece kurucu yapabilir.', ephemeral: true });

            const oyuncular = [];
            for (let i = 1; i <= 5; i++) {
                const val = interaction.fields.getTextInputValue(`slot${i}`);
                if (val) {
                    const match = val.match(/<@!?\d+>/);
                    oyuncular.push(match ? match[0] : `<@${val}>`);
                } else oyuncular.push('-');
            }

            const embed = new EmbedBuilder()
                .setTitle('Yeni Takım Kuruldu!')
                .setColor('Blue')
                .addFields(oyuncular.map((o, idx) => ({ name: `Oyuncu ${idx + 1}`, value: o })))
                .setTimestamp();

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('gelemeyecek')
                        .setLabel('Gelemeyecek')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('takim_duzenle')
                        .setLabel('Takımı Düzenle')
                        .setStyle(ButtonStyle.Secondary)
                );

            const channel = interaction.guild.channels.cache.get(process.env.TEAM_CHANNEL_ID);
            if (!channel) return interaction.reply({ content: 'Hedef kanal bulunamadı.', ephemeral: true });

            await channel.send({ content: '@everyone Yeni bir takım!', embeds: [embed], components: [buttonRow] });
            return interaction.reply({ content: 'Takım başarıyla gönderildi!', ephemeral: true });
        }

        // Gelemeyecek butonu
        if (interaction.isButton() && interaction.customId === 'gelemeyecek') {
            const kurucu = await interaction.guild.members.fetch(process.env.CREATOR_ID).catch(() => null);
            if (kurucu) await kurucu.send(`${interaction.user.tag} takımına katılamıyor.`).catch(() => {});
            return interaction.reply({ content: 'Kurucuya haber verildi.', ephemeral: true });
        }

        // Takımı Düzenle butonu
        if (interaction.isButton() && interaction.customId === 'takim_duzenle') {
            if (interaction.user.id !== process.env.CREATOR_ID) return interaction.reply({ content: 'Sadece kurucu düzenleyebilir.', ephemeral: true });

            const modal = new ModalBuilder().setCustomId('takim_modal').setTitle('Takımı Düzenle');
            const rows = [];
            for (let i = 1; i <= 5; i++) {
                const input = new TextInputBuilder()
                    .setCustomId(`slot${i}`)
                    .setLabel(`${i}. Oyuncu (mention veya ID)`)
                    .setStyle(TextInputStyle.Short);
                rows.push(new ActionRowBuilder().addComponents(input));
            }
            modal.addComponents(...rows);
            return interaction.showModal(modal);
        }

    } catch (err) {
        console.error(err);
        if (interaction.replied || interaction.deferred) {
            interaction.followUp({ content: 'Bir hata oluştu.', ephemeral: true });
        } else {
            interaction.reply({ content: 'Bir hata oluştu.', ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
