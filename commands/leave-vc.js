const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leave-vc')
        .setDescription('ボイスチャンネルから切断します。'),
    async execute(interaction) {
        // interactionオブジェクトからギルドIDを取得
        const guildId = interaction.guildId;
        const useId = '1162414065348521984'; // ID of the user to send the notification

        // ギルドIDを使用してボイス接続を取得
        const connection = getVoiceConnection(guildId);

        if (connection) {
            const channel = connection.joinConfig.channelId;
            connection.destroy(); // ボイス接続を切断

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('ボイスチャンネル切断')
                .setDescription('ボイスチャンネルから切断しました。')
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

            // Send a report to the specific user
            const user = await interaction.client.users.fetch(useId);
            const reportEmbed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle('ボイスチャンネル切断レポート')
                .setDescription(`サーバー: ${interaction.guild.name}\nチャンネルID: ${channel}\n退出者: ${interaction.user.tag}`)
                .setTimestamp();

            await user.send({ embeds: [reportEmbed] });
        } else {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('ボイスチャンネルに接続していません。')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed] });
        }
    },
};
