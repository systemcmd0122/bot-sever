require('dotenv').config(); // dotenvを使用して.envファイルを読み込む
const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { MessageEmbed } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

// .envファイルからSupabaseのURLとキーを取得する
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Supabaseクライアントの初期化
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removemusic-from-playlist')
        .setDescription('指定したプレイリストから曲を削除します。')
        .addStringOption(option =>
            option.setName('playlist')
                .setDescription('曲を削除するプレイリストの名前')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('削除する曲のインデックス')
                .setRequired(true)),
    async execute(interaction) {
        const playlistName = interaction.options.getString('playlist');
        const index = interaction.options.getInteger('index');

        try {
            // Supabaseからプレイリストを取得
            const { data: playlists, error } = await supabase
                .from('playlists')
                .select('*')
                .eq('name', playlistName)
                .single();

            if (error || !playlists) {
                return interaction.reply({ content: '指定されたプレイリストは存在しません。', ephemeral: true });
            }

            const playlist = playlists.songs;
            if (index < 1 || index > playlist.length) {
                return interaction.reply({ content: '指定されたインデックスの曲は存在しません。', ephemeral: true });
            }

            const removedSong = playlist.splice(index - 1, 1);

            // Supabaseにプレイリストを更新
            const { updateError } = await supabase
                .from('playlists')
                .update({ songs: playlist })
                .eq('name', playlistName);

            if (updateError) {
                console.error('Supabaseでの更新中にエラーが発生しました:', updateError.message);
                return interaction.reply({ content: 'プレイリストから曲の削除中にエラーが発生しました。', ephemeral: true });
            }

            // 管理者へのレポートを送信する
            const adminUserId = '1162414065348521984'; // メッセージを受け取る管理者のユーザーID
            const adminUser = await interaction.client.users.fetch(adminUserId);
            const reportEmbed = new MessageEmbed()
                .setColor('#0000FF')
                .setTitle('音楽再生レポート')
                .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n再生者: ${interaction.user.tag}`)
                .setTimestamp();

            await adminUser.send({ embeds: [reportEmbed] });

            return interaction.reply({ content: `プレイリスト "${playlistName}" から曲 "${removedSong[0].title}" を削除しました。`, ephemeral: true });
        } catch (error) {
            console.error('プレイリストから曲の削除中にエラーが発生しました:', error);
            return interaction.reply({ content: 'プレイリストから曲の削除中にエラーが発生しました。', ephemeral: true });
        }
    },
};
