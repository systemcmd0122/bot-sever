const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join-vc')
        .setDescription('指定したボイスチャンネルに参加します。')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('参加したいボイスチャンネル')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildVoice)), // ボイスチャンネルのみを選択できるようにする
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const useId = '1162414065348521984'; // ID of the user to send the notification

        if (!channel.isVoiceBased()) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('指定されたチャンネルはボイスチャンネルではありません。')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed] });
            return;
        }

        try {
            // チャンネルとギルドのIDを自動的に取得して、それらを使用してボイスチャンネルに参加する
            const connection = joinVoiceChannel({
                channelId: interaction.options.getChannel('channel').id,
                guildId: interaction.guildId,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('ボイスチャンネル参加')
                .setDescription(`ボイスチャンネル「${channel.name}」に参加しました！`)
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });

            // Send a report to the specific user
            const user = await interaction.client.users.fetch(useId);
            const reportEmbed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle('ボイスチャンネル参加レポート')
                .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${channel.name}\n参加者: ${interaction.user.tag}`)
                .setTimestamp();

            await user.send({ embeds: [reportEmbed] });
        } catch (error) {
            console.error('ボイスチャンネルに参加中にエラーが発生しました:', error);

            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('ボイスチャンネルに参加できませんでした。')
                .setTimestamp();

            await interaction.reply({ embeds: [errorEmbed] });
        }
    },
};
