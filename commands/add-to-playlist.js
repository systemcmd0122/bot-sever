const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js'); 
const ytdl = require('ytdl-core');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); 

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
            option.setName('urls')
                .setDescription('追加するYouTubeのURLをカンマで区切って指定してください')
                .setRequired(true)),
    async execute(interaction) {
        const playlistName = interaction.options.getString('playlist');
        const urls = interaction.options.getString('urls').split(',');
        const guildId = interaction.guild.id;

        try {
            await interaction.reply({ content: `プレイリスト "${playlistName}" に曲を追加しています...`, ephemeral: true });

            console.log(`プレイリスト "${playlistName}" に曲を追加します`);

            // プレイリストが存在するかを確認する
            const { data: playlists, error: fetchError } = await supabase
                .from('playlists')
                .select('id, name, songs')
                .eq('guild_id', guildId);

            if (fetchError) throw new Error('プレイリストの取得中にエラーが発生しました。');

            const playlist = playlists.find(pl => pl.name === playlistName);

            if (!playlist) {
                const noPlaylistEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('そのプレイリストは存在しません。');
                return interaction.editReply({ embeds: [noPlaylistEmbed] });
            }

            // 各URLに対して処理を行う
            for (const url of urls) {
                try {
                    // YouTubeの情報を取得
                    const songInfo = await ytdl.getInfo(url.trim());
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

                    if (updateError) throw new Error('プレイリストの更新中にエラーが発生しました。');

                    // 曲追加成功のメッセージを送信
                    const successEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('曲追加成功')
                        .setDescription(`プレイリスト "${playlistName}" に "${song.title}" を追加しました。`);
                    await interaction.followUp({ embeds: [successEmbed], ephemeral: true });

                    console.log(`プレイリスト "${playlistName}" に "${song.title}" を追加しました。`);
                } catch (urlError) {
                    console.error('URL処理中にエラーが発生しました:', urlError);
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('URLエラー')
                        .setDescription(`URL "${url.trim()}" の処理中にエラーが発生しました: ${urlError.message}`);
                    await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                }
            }

            // 管理者へのレポート
            const adminUserId = '1162414065348521984'; 
            const adminUser = await interaction.client.users.fetch(adminUserId);
            const reportEmbed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle('音楽追加レポート')
                .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n追加者: ${interaction.user.tag}\nプレイリスト: ${playlistName}`)
                .setTimestamp();

            await adminUser.send({ embeds: [reportEmbed] });

        } catch (error) {
            console.error('エラーが発生しました:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription(`エラーが発生しました: ${error.message}`);
            return interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
