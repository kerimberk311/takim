import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once("ready", () => console.log(`${client.user.tag} aktif!`));

client.on("interactionCreate", async interaction => {
    try {
        // /takım komutu
        if (interaction.isChatInputCommand() && interaction.commandName === "takım") {
            if (interaction.user.id !== process.env.CREATOR_ID)
                return interaction.reply({ content: "Sadece kurucu kullanabilir.", ephemeral: true });

            const modal = new ModalBuilder().setCustomId("takim_modal").setTitle("Takım Kur");

            const rows = [];
            for (let i = 1; i <= 5; i++) {
                const input = new TextInputBuilder()
                    .setCustomId(`slot${i}`)
                    .setLabel(`${i}. Oyuncu (mention veya ID)`)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(i === 1);
                rows.push(new ActionRowBuilder().addComponents(input));
            }

            // Maç tarihi ve saati için iki input
            const tarihInput = new TextInputBuilder()
                .setCustomId("mac_tarih")
                .setLabel("Maç Tarihi (GG/AA/YYYY)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const saatInput = new TextInputBuilder()
                .setCustomId("mac_saat")
                .setLabel("Maç Saati (24h format HH:MM)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            rows.push(new ActionRowBuilder().addComponents(tarihInput));
            rows.push(new ActionRowBuilder().addComponents(saatInput));

            modal.addComponents(...rows);
            return interaction.showModal(modal);
        }

        // /istatistik komutu
        if (interaction.isChatInputCommand() && interaction.commandName === "istatistik") {
            const oyuncu = interaction.options.getUser("kullanici") || interaction.user;
            const embed = new EmbedBuilder()
                .setTitle(`${oyuncu.tag} İstatistikleri`)
                .setColor("Green")
                .addFields(
                    { name: "Kill", value: "10", inline: true },
                    { name: "Death", value: "2", inline: true },
                    { name: "Assist", value: "5", inline: true }
                )
                .setTimestamp();
            return interaction.reply({ embeds: [embed] });
        }

        // /yardım komutu
        if (interaction.isChatInputCommand() && interaction.commandName === "yardim") {
            const embed = new EmbedBuilder()
                .setTitle("Bot Komutları")
                .setColor("Blue")
                .setDescription(`
/takım → Takım kurma ve maç tarihi girme
/istatistik → Oyuncu istatistikleri gösterir
/yardim → Bu yardım mesajı
`);
            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Modal submit
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === "takim_modal") {
            if (interaction.user.id !== process.env.CREATOR_ID)
                return interaction.reply({ content: "Sadece kurucu yapabilir.", ephemeral: true });

            const oyuncular = [];
            for (let i = 1; i <= 5; i++) {
                const val = interaction.fields.getTextInputValue(`slot${i}`);
                if (val) {
                    const match = val.match(/<@!?\\d+>/);
                    oyuncular.push(match ? match[0] : `<@${val}>`);
                } else oyuncular.push("-");
            }

            const tarih = interaction.fields.getTextInputValue("mac_tarih");
            const saat = interaction.fields.getTextInputValue("mac_saat");

            const embed = new EmbedBuilder()
                .setTitle("Yeni Takım Kuruldu!")
                .setColor("Blue")
                .addFields(
                    oyuncular.map((o, idx) => ({ name: `Oyuncu ${idx + 1}`, value: o })),
                    { name: "Maç Tarihi", value: tarih, inline: true },
                    { name: "Maç Saati", value: saat, inline: true }
                )
                .setTimestamp();

            const buttonRow = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId("gelemeyecek")
                        .setLabel("Gelemeyecek")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId("takim_duzenle")
                        .setLabel("Takımı Düzenle")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId("takim_tamamlandi")
                        .setLabel("Takım Tamamlandı")
                        .setStyle(ButtonStyle.Success)
                );

            const channel = interaction.guild.channels.cache.get(process.env.TEAM_CHANNEL_ID);
            if (!channel) return interaction.reply({ content: "Hedef kanal bulunamadı.", ephemeral: true });

            await channel.send({ content: "@everyone Yeni bir takım!", embeds: [embed], components: [buttonRow] });
            return interaction.reply({ content: "Takım başarıyla gönderildi!", ephemeral: true });
        }

        // Gelemeyecek butonu
        if (interaction.isButton() && interaction.customId === "gelemeyecek") {
            const kurucu = await interaction.guild.members.fetch(process.env.CREATOR_ID).catch(() => null);
            if (kurucu) await kurucu.send(`${interaction.user.tag} takımına katılamıyor.`).catch(() => {});
            return interaction.reply({ content: "Kurucuya haber verildi.", ephemeral: true });
        }

        // Takımı Düzenle butonu
        if (interaction.isButton() && interaction.customId === "takim_duzenle") {
            if (interaction.user.id !== process.env.CREATOR_ID)
                return interaction.reply({ content: "Sadece kurucu düzenleyebilir.", ephemeral: true });

            const modal = new ModalBuilder().setCustomId("takim_modal").setTitle("Takımı Düzenle");
            const rows = [];
            for (let i = 1; i <= 5; i++) {
                const input = new TextInputBuilder()
                    .setCustomId(`slot${i}`)
                    .setLabel(`${i}. Oyuncu (mention veya ID)`)
                    .setStyle(TextInputStyle.Short);
                rows.push(new ActionRowBuilder().addComponents(input));
            }

            const tarihInput = new TextInputBuilder()
                .setCustomId("mac_tarih")
                .setLabel("Maç Tarihi (GG/AA/YYYY)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            const saatInput = new TextInputBuilder()
                .setCustomId("mac_saat")
                .setLabel("Maç Saati (24h format HH:MM)")
                .setStyle(TextInputStyle.Short)
                .setRequired(true);

            rows.push(new ActionRowBuilder().addComponents(tarihInput));
            rows.push(new ActionRowBuilder().addComponents(saatInput));

            modal.addComponents(...rows);
            return interaction.showModal(modal);
        }

        // Takım Tamamlandı butonu
        if (interaction.isButton() && interaction.customId === "takim_tamamlandi") {
            if (interaction.user.id !== process.env.CREATOR_ID)
                return interaction.reply({ content: "Sadece kurucu takım tamamlandı diyebilir.", ephemeral: true });

            await interaction.user.send("Takım tamamlandı!");
            return interaction.reply({ content: "Takım tamamlandı olarak işaretlendi.", ephemeral: true });
        }

    } catch (err) {
        console.error(err);
        if (interaction.replied || interaction.deferred) {
            interaction.followUp({ content: "Bir hata oluştu.", ephemeral: true });
        } else {
            interaction.reply({ content: "Bir hata oluştu.", ephemeral: true });
        }
    }
});

client.login(process.env.TOKEN);
