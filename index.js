import { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, InteractionType, EmbedBuilder } from "discord.js";
import dotenv from "dotenv";
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds], partials: [Partials.Channel] });

client.once("ready", () => console.log(`${client.user.tag} hazır!`));

client.on("interactionCreate", async interaction => {
    try {
        // Slash komutları
        if (interaction.isChatInputCommand()) {
            // /takım komutu
            if (interaction.commandName === "takım") {
                if (interaction.user.id !== process.env.CREATOR_ID)
                    return interaction.reply({ content: "Sadece kurucu kullanabilir.", ephemeral: true });

                const modal = new ModalBuilder()
                    .setCustomId("takim_modal")
                    .setTitle("Takım Kur ve Maç Bilgisi");

                const rows = [];
                // 5 oyunculuk input
                for (let i = 1; i <= 5; i++) {
                    const input = new TextInputBuilder()
                        .setCustomId(`slot${i}`)
                        .setLabel(`${i}. Oyuncu (mention veya ID)`)
                        .setStyle(TextInputStyle.Short)
                        .setRequired(i === 1);
                    rows.push(new ActionRowBuilder().addComponents(input));
                }

                // Maç tarihi ve saati
                const tarihInput = new TextInputBuilder()
                    .setCustomId("mac_tarih")
                    .setLabel("Maç Tarihi (GG/AA/YYYY)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);
                const saatInput = new TextInputBuilder()
                    .setCustomId("mac_saat")
                    .setLabel("Maç Saati (HH:MM)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                rows.push(new ActionRowBuilder().addComponents(tarihInput));
                rows.push(new ActionRowBuilder().addComponents(saatInput));

                modal.addComponents(...rows);
                return interaction.showModal(modal);
            }

            // /istatistik komutu
            if (interaction.commandName === "istatistik") {
                const embed = new EmbedBuilder()
                    .setTitle(`${interaction.user.tag} İstatistikleri`)
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
            if (interaction.commandName === "yardim") {
                const embed = new EmbedBuilder()
                    .setTitle("Bot Komutları")
                    .setColor("Blue")
                    .setDescription("/takım → Takım kurma ve maç bilgisi\n/istatistik → Oyuncu istatistikleri\n/yardim → Yardım mesajı");
                return interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

        // Modal submit işlemleri
        if (interaction.type === InteractionType.ModalSubmit && interaction.customId === "takim_modal") {
            if (interaction.user.id !== process.env.CREATOR_ID)
                return interaction.reply({ content: "Sadece kurucu kullanabilir.", ephemeral: true });

            const oyuncular = [];
            for (let i = 1; i <= 5; i++) {
                const val = interaction.fields.getTextInputValue(`slot${i}`);
                oyuncular.push(val ? `<@${val.replace(/\D/g,'')}>` : "-");
            }

            const tarih = interaction.fields.getTextInputValue("mac_tarih");
            const saat = interaction.fields.getTextInputValue("mac_saat");

            const embed = new EmbedBuilder()
                .setTitle("Yeni Takım!")
                .setColor("Blue")
                .addFields(
                    ...oyuncular.map((o,i)=>({name:`Oyuncu ${i+1}`, value:o})),
                    {name:"Maç Tarihi", value:tarih, inline:true},
                    {name:"Maç Saati", value:saat, inline:true}
                )
                .setTimestamp();

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId("gelemeyecek").setLabel("Gelemeyecek").setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId("takim_duzenle").setLabel("Takımı Düzenle").setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId("takim_tamamlandi").setLabel("Takım Tamamlandı").setStyle(ButtonStyle.Success)
            );

            const channel = interaction.guild.channels.cache.get(process.env.TEAM_CHANNEL_ID);
            if (!channel) return interaction.reply({ content: "Hedef kanal bulunamadı.", ephemeral: true });

            await channel.send({ content: "@everyone Yeni bir takım!", embeds:[embed], components:[buttons] });
            return interaction.reply({ content:"Takım başarıyla gönderildi!", ephemeral:true });
        }

        // Buton işlemleri
        if (interaction.isButton()) {
            const kurucu = await interaction.guild.members.fetch(process.env.CREATOR_ID).catch(()=>null);

            if (interaction.customId==="gelemeyecek"){
                if (kurucu) await kurucu.send(`${interaction.user.tag} takımına katılamıyor.`);
                return interaction.reply({content:"Kurucuya haber verildi.", ephemeral:true});
            }

            if (interaction.customId==="takim_duzenle"){
                if (interaction.user.id !== process.env.CREATOR_ID)
                    return interaction.reply({content:"Sadece kurucu düzenleyebilir.", ephemeral:true});
                return interaction.reply({content:"Takımı düzenleme modalı tekrar açılacak.", ephemeral:true});
            }

            if (interaction.customId==="takim_tamamlandi"){
                if (interaction.user.id !== process.env.CREATOR_ID)
                    return interaction.reply({content:"Sadece kurucu tamamlandı diyebilir.", ephemeral:true});
                if(kurucu) await kurucu.send("Takım tamamlandı!");
                return interaction.reply({content:"Takım tamamlandı olarak işaretlendi.", ephemeral:true});
            }
        }

    } catch(err){
        console.error(err);
        if(interaction.replied || interaction.deferred){
            interaction.followUp({content:"Bir hata oluştu.", ephemeral:true});
        } else {
            interaction.reply({content:"Bir hata oluştu.", ephemeral:true});
        }
    }
});

client.login(process.env.TOKEN);
