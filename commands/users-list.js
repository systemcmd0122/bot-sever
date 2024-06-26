const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('users-list')
        .setDescription('サーバーにいるユーザーの一覧を表示します。'),
    async execute(interaction) {
        const guild = interaction.guild;

        if (!guild) {
            return interaction.reply('このコマンドはサーバー内でのみ使用できます。');
        }

        try {
            await interaction.reply('サーバーのユーザー一覧を取得しています...');

            // ギルドの全メンバーを取得
            const members = await guild.members.fetch();
            
            // メンバーがいない場合
            if (members.size === 0) {
                return interaction.editReply('サーバーにユーザーがいません。');
            }

            // メンバーリストを作成
            let memberList = '';
            members.each(member => {
                memberList += `${member.user.tag}\n`;
            });

            // 埋め込みメッセージを作成
            const embed = new EmbedBuilder()
                .setTitle('サーバーにいるユーザーの一覧')
                .setDescription(memberList)
                .setColor('#00AE86'); // 埋め込みメッセージの色を設定
            
            // メッセージを送信
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('ユーザー一覧の取得中にエラーが発生しました:', error);
            await interaction.editReply('ユーザー一覧の取得中にエラーが発生しました。');
        }
    },
};
