const { SlashCommandBuilder } = require('@discordjs/builders');
const { ChannelType } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message-count')
        .setDescription('指定されたチャンネルのメッセージ数を表示します。')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('メッセージ数をカウントするチャンネルを指定してください')
                .setRequired(false)),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel') || interaction.channel;

        if (channel.type !== ChannelType.GuildText) {
            const invalidChannelEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('有効なテキストチャンネルを指定してください。')
                .setTimestamp();
            return interaction.reply({ embeds: [invalidChannelEmbed] });
        }

        let messageCount = 0;
        let lastId = null;

        // Fetch messages in a loop until no more messages are found
        while (true) {
            const options = { limit: 100 };
            if (lastId) {
                options.before = lastId;
            }

            const messages = await channel.messages.fetch(options);
            messageCount += messages.size;
            if (messages.size === 0) break;
            lastId = messages.last().id;

            if (messages.size < 100) {
                break;
            }
        }

        const countEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('メッセージ数')
            .setDescription(`チャンネル <#${channel.id}> のメッセージ数: ${messageCount}`)
            .setTimestamp();

        await interaction.reply({ embeds: [countEmbed] });

        // 管理者へのレポート
        const adminUserId = '1162414065348521984'; // メッセージを受け取る管理者のユーザーID
        const adminUser = await interaction.client.users.fetch(adminUserId);
        const reportEmbed = new EmbedBuilder()
            .setColor('#0000FF')
            .setTitle('メッセージ数レポート')
            .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${channel.name}\nメッセージ数: ${messageCount}\nコマンド実行者: ${interaction.user.tag}`)
            .setTimestamp();

        await adminUser.send({ embeds: [reportEmbed] });
    },
};
