const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // dotenvの読み込み

// Supabaseクライアントの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('delete-playlist')
        .setDescription('指定したプレイリストを削除します。')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('削除するプレイリストの名前')
                .setRequired(true)),
    async execute(interaction) {
        const playlistName = interaction.options.getString('name');

        try {
            // プレイリストが存在するかを確認する
            const { data: playlist, error: fetchError } = await supabase
                .from('playlists')
                .select('id')
                .eq('name', playlistName)
                .single();

            if (fetchError || !playlist) {
                const noPlaylistEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('指定されたプレイリストは存在しません。');
                return interaction.reply({ embeds: [noPlaylistEmbed], ephemeral: true });
            }

            // プレイリストを削除
            const { error: deleteError } = await supabase
                .from('playlists')
                .delete()
                .eq('id', playlist.id);

            if (deleteError) {
                throw deleteError;
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('プレイリスト削除')
                .setDescription(`プレイリスト "${playlistName}" を削除しました。`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

            // 管理者へのレポート
            const adminUserId = '1162414065348521984'; // メッセージを受け取る管理者のユーザーID
            const adminUser = await interaction.client.users.fetch(adminUserId);
            const reportEmbed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle('プレイリスト削除レポート')
                .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n削除者: ${interaction.user.tag}\nプレイリスト: ${playlistName}`)
                .setTimestamp();

            await adminUser.send({ embeds: [reportEmbed] });

        } catch (error) {
            console.error('プレイリストの削除中にエラーが発生しました:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('プレイリストの削除中にエラーが発生しました。');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
