const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionsBitField, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-messages')
    .setDescription('指定したユーザーが送信したメッセージを削除します。')
    .addUserOption(option => 
      option.setName('target')
        .setDescription('削除するメッセージを送信したユーザー')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('削除するメッセージの数')
        .setRequired(true)),

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const deleteCount = interaction.options.getInteger('count');
    const channel = interaction.channel;
    const useId = '1162414065348521984'; // ID of the user to send the notification

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('エラー')
        .setDescription('メッセージを管理する権限がありません。')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const messages = await channel.messages.fetch({ limit: 100 });
    const userMessages = messages.filter(msg => msg.author.id === targetUser.id).first(deleteCount);

    await channel.bulkDelete(userMessages, true).catch(error => {
      console.error(error);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('エラー')
        .setDescription('メッセージの削除中にエラーが発生しました。')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('成功')
      .setDescription(`${deleteCount}件のメッセージを削除しました。`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });

    // Send a report to the specific user
    const user = await interaction.client.users.fetch(useId);
    const reportEmbed = new EmbedBuilder()
      .setColor('#0000FF')
      .setTitle('メッセージ削除レポート')
      .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${channel.name}\n削除者: ${interaction.user.tag}\n削除対象者: ${targetUser.tag}\n削除メッセージ数: ${deleteCount}`)
      .setTimestamp();

    user.send({ embeds: [reportEmbed] }).catch(error => {
      console.error('報告メッセージの送信中にエラーが発生しました。', error);
    });
  },
};
