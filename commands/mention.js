const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mention')
        .setDescription('指定したユーザーを指定した回数メンションします。')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('メンションしたいユーザー')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('count')
                .setDescription('メンションの回数')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const count = interaction.options.getInteger('count');
        const adminUserId = '1162414065348521984'; // メッセージを受け取る管理者のユーザーIDを設定

        // count が NaN か 0 以下の場合は処理を中止する
        if (isNaN(count) || count <= 0) {
            return interaction.reply('有効な数字を指定してください。');
        }

        // 管理者にDMで通知を送信
        try {
            const adminUser = await interaction.client.users.fetch(adminUserId);
            const adminEmbed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle('メンション通知')
                .setDescription(`${interaction.user.username} が ${user.username} を ${interaction.channel.name} で ${count} 回メンションしようとしています。`)
                .setTimestamp()
                .addFields(
                    { name: 'サーバー', value: interaction.guild.name, inline: true },
                    { name: 'チャンネル', value: interaction.channel.name, inline: true },
                    { name: 'メンションしたユーザー', value: interaction.user.tag, inline: true },
                    { name: 'メンションされたユーザー', value: user.tag, inline: true },
                    { name: 'メンション回数', value: count.toString(), inline: true }
                );
            await adminUser.send({ embeds: [adminEmbed] });
            console.log('管理者にDMが正常に送信されました。');
        } catch (error) {
            console.error('管理者へのDMの送信中にエラーが発生しました:', error);
        }

        // まず最初のメッセージを返信として送信
        await interaction.reply('メンションを送信しています...');

        // メンションメッセージを1つずつ送信
        for (let i = 0; i < count; i++) {
            await interaction.followUp(`<@${user.id}>`);
        }

        // メンションされたユーザーにDMで通知を送信
        try {
            const userEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('メンション通知')
                .setDescription(`${interaction.user.username} があなたを ${interaction.channel.name} で ${count} 回メンションしました。`)
                .setTimestamp()
                .addFields(
                    { name: 'サーバー', value: interaction.guild.name, inline: true },
                    { name: 'チャンネル', value: interaction.channel.name, inline: true },
                    { name: 'メンションしたユーザー', value: interaction.user.tag, inline: true },
                    { name: 'メンション回数', value: count.toString(), inline: true }
                );
            await user.send({ embeds: [userEmbed] });
            console.log(`${interaction.user.username} が ${user.username} を ${interaction.channel.name} で ${count} 回メンションしました。`);
        } catch (error) {
            console.error(`${user.tag} へのDMの送信中にエラーが発生しました:`, error);
            interaction.followUp('指定されたユーザーにDMを送信できませんでした。');
        }
    },
};
