const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js'); 
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
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
        const urls = interaction.options.getString('urls').split(',').map(url => url.trim());
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

            let newSongs = [...playlist.songs];

            // YouTubeプレイリストのURLかどうかを確認
            for (const url of urls) {
                let songUrls = [];

                if (ytpl.validateID(url)) {
                    // プレイリストの情報を取得
                    const playlistInfo = await ytpl(url, { pages: Infinity });
                    songUrls = playlistInfo.items.map(item => item.shortUrl);
                } else {
                    songUrls.push(url);
                }

                // 各URLに対して処理を行う
                const songPromises = songUrls.map(async (songUrl) => {
                    try {
                        // YouTubeの情報を取得
                        const songInfo = await ytdl.getInfo(songUrl);
                        const song = {
                            title: songInfo.videoDetails.title,
                            url: songInfo.videoDetails.video_url,
                        };

                        // 曲を新しいリストに追加
                        newSongs.push(song);

                        console.log(`プレイリスト "${playlistName}" に "${song.title}" を追加しました。`);
                    } catch (urlError) {
                        console.error('URL処理中にエラーが発生しました:', urlError);
                        const errorEmbed = new EmbedBuilder()
                            .setColor('#FF0000')
                            .setTitle('URLエラー')
                            .setDescription(`URL "${songUrl}" の処理中にエラーが発生しました: ${urlError.message}`);
                        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
                    }
                });

                await Promise.all(songPromises);
            }

            // プレイリストに新しい曲リストを保存
            const { error: updateError } = await supabase
                .from('playlists')
                .update({ songs: newSongs })
                .eq('id', playlist.id);

            if (updateError) throw new Error('プレイリストの更新中にエラーが発生しました。');

            // 曲追加成功のメッセージを送信
            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('曲追加成功')
                .setDescription(`プレイリスト "${playlistName}" に ${newSongs.length - playlist.songs.length} 曲を追加しました。`);
            await interaction.editReply({ embeds: [successEmbed] });

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