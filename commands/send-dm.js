const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send-dm')
        .setDescription('指定したユーザーとユーザーIDにDMを送信します。')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('DMを送りたいユーザー')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('message')
                .setDescription('送信するメッセージ')
                .setRequired(true)),
    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const message = interaction.options.getString('message');
        const userId = '1162414065348521984'; // メッセージを受け取るユーザーのID

        try {
            // 指定されたユーザーにDMを送信する
            await user.send(message);
            console.log(`${user.tag} にDMを送信しました`);

            const dmSuccessEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('DM送信成功')
                .setDescription(`${user.tag} にDMを送信しました`)
                .setTimestamp();

            await interaction.reply({ embeds: [dmSuccessEmbed] });

            // 指定されたユーザーIDにも同じメッセージを送信する
            const userToSend = await interaction.client.users.fetch(userId);
            await userToSend.send(`ユーザー ${interaction.user.tag} が ${user.tag} に以下のメッセージを送りました: ${message}`);
            console.log(`ユーザーID ${userId} にDMを送信しました`);
        } catch (error) {
            console.error(`${user.tag} にDMの送信に失敗しました:`, error);

            const dmErrorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('DM送信エラー')
                .setDescription('指定されたユーザーにDMを送信できませんでした。')
                .setTimestamp();

            await interaction.reply({ embeds: [dmErrorEmbed] });

            console.error(`ユーザーID ${userId} にDMの送信に失敗しました:`, error);
        }
    },
};
