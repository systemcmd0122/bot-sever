const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('ボイスチャンネルからボットを退出させます。'),
    async execute(interaction) {
        const guildId = interaction.guild.id; // サーバーのIDを取得

        const connection = getVoiceConnection(guildId);
        if (!connection) {
            const noConnectionEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('ボットは現在ボイスチャンネルに参加していません。');
            return interaction.reply({ embeds: [noConnectionEmbed], ephemeral: true });
        }

        try {
            connection.destroy();
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('ボット退出')
                .setDescription('ボイスチャンネルから退出しました。');
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

            // 管理者へのレポート
            const adminUserId = '1162414065348521984'; // メッセージを受け取る管理者のユーザーID
            const adminUser = await interaction.client.users.fetch(adminUserId);
            const reportEmbed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle('ボット退出レポート')
                .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n実行者: ${interaction.user.tag}`)
                .setTimestamp();

            await adminUser.send({ embeds: [reportEmbed] });
        } catch (error) {
            console.error('ボイスチャンネルからの退出中にエラーが発生しました:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('ボイスチャンネルからの退出中にエラーが発生しました。');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
