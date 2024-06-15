const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const ytdl = require('ytdl-core');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // dotenvの読み込み

// Supabaseクライアントの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-to-playlist')
        .setDescription('プレイリストに曲を追加します。')
        .addStringOption(option => 
            option.setName('playlist')
                .setDescription('プレイリストの名前を指定してください')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('url')
                .setDescription('追加するYouTubeのURLを指定してください')
                .setRequired(true)),
    async execute(interaction) {
        const playlistName = interaction.options.getString('playlist');
        const url = interaction.options.getString('url');

        // プレイリストが存在するかを確認する
        const { data: playlists, error: fetchError } = await supabase
            .from('playlists')
            .select('id, name, songs');

        if (fetchError) {
            console.error('プレイリストの取得中にエラーが発生しました:', fetchError);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('プレイリストの取得中にエラーが発生しました。');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const playlist = playlists.find(pl => pl.name === playlistName);

        if (!playlist) {
            const noPlaylistEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('そのプレイリストは存在しません。');
            return interaction.reply({ embeds: [noPlaylistEmbed], ephemeral: true });
        }

        try {
            // YouTubeの情報を取得
            const songInfo = await ytdl.getInfo(url);
            const song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url,
            };

            // プレイリストに曲を追加して保存
            const updatedSongs = [...playlist.songs, song];
            const { error: updateError } = await supabase
                .from('playlists')
                .update({ songs: updatedSongs })
                .eq('id', playlist.id);

            if (updateError) {
                throw updateError;
            }

            // 曲追加成功のメッセージを送信
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('曲追加成功')
                .setDescription(`プレイリスト "${playlistName}" に "${song.title}" を追加しました。`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

            // 管理者へのレポート
            const adminUserId = '1162414065348521984'; // メッセージを受け取る管理者のユーザーID
            const adminUser = await interaction.client.users.fetch(adminUserId);
            const reportEmbed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle('音楽再生レポート')
                .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n追加者: ${interaction.user.tag}`)
                .setTimestamp();

            await adminUser.send({ embeds: [reportEmbed] });

        } catch (error) {
            // エラーが発生した場合はエラーメッセージを送信
            console.error('曲の追加中にエラーが発生しました:', error);
            const invalidUrlEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('有効なYouTubeのURLを指定してください。');
            return interaction.reply({ embeds: [invalidUrlEmbed], ephemeral: true });
        }
    },
};
