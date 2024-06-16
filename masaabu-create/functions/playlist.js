
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');const ytdl = require('ytdl-core');
const { EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // dotenvの読み込み

// Supabaseクライアントの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getData(guildId, listName) {
    const { data: playlists, error: fetchError } = await supabase
        .from('playlists')
        .select('id, name, songs')
        .eq('guild_id', guildId);

    if (fetchError) {
        console.error('プレイリストの取得中にエラーが発生しました:', fetchError);
        return ["get-error"]
    }

    const playlist = playlists.find(pl => pl.name === listName);

    console.log(playlist)
    if (!playlist) return ["not-found"]

    return playlist
}

module.exports = {
    name: "playlist",
    run: class {
        constructor(guild, listName) {
            this.guild = guild;
            this.listName = listName;

            // プレイリストが存在するかを確認する
            this.playlist = getData(guild.id ,listName)
        }


        async play (voiceChannel, channel) {
            try {
                this.playlist = await getData(this.guild.id ,this.listName)
                console.log(this.playlist)
                if (this.playlist.songs.length === 0) {
                    const emptyPlaylistEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('エラー')
                        .setDescription('選択したプレイリストに曲が含まれていません。')
                        .setTimestamp();
                    await channel.send({ embeds: [emptyPlaylistEmbed] });
                    return;
                }

                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: this.guild.id,
                    adapterCreator: this.guild.voiceAdapterCreator
                });

                const player = createAudioPlayer();
                connection.subscribe(player);

                let currentIndex = 0;

                await channel.send({ content: `プレイリスト "${this.listName}" の再生を開始します。` });

                const playNextSong = async () => {
                    if (currentIndex >= this.playlist.songs.length) {
                        connection.destroy();
                        const endEmbed = new EmbedBuilder()
                            .setColor('#FFFF00')
                            .setTitle('プレイリスト再生終了')
                            .setDescription(`プレイリスト "${this.listName}" の再生が終了しました。`)
                            .setTimestamp();

                        await channel.send({ embeds: [endEmbed] });

                        return ['end'];
                    }

                    const song = this.playlist.songs[currentIndex];
                    let stream;
                    try {
                        stream = ytdl(song.url, { filter: 'audioonly' });
                    } catch (error) {
                        console.error('Error creating stream:', error);
                        await channel.send({ content: `エラーが発生しました: ${error.message}` });
                        connection.destroy();
                        return ['error'];
                    }
                    
                    const resource = createAudioResource(stream);
                    player.play(resource);

                    const playEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('再生中')
                        .setDescription(`再生中: ${song.title}`)
                        .addFields(
                            { name: 'プレイリスト', value: this.listName },
                            { name: '曲の番号', value: `${currentIndex + 1}/${this.playlist.songs.length}` }
                        )
                        .setTimestamp();

                    await channel.send({ embeds: [playEmbed] });

                    currentIndex++;
                };

                player.on(AudioPlayerStatus.Idle, playNextSong);

                player.on('error', error => {
                    console.error('Error in audio player:', error);
                    connection.destroy();
                });

                playNextSong();

            } catch (error) {
                console.error(error)
                return ["get-error"]
            }
        }


        async addsong (url) {
            try {
                // YouTubeの情報を取得
                const songInfo = await ytdl.getInfo(url);
                const song = {
                    title: songInfo.videoDetails.title,
                    url: songInfo.videoDetails.video_url,
                };
    
                // プレイリストに曲を追加して保存
                const updatedSongs = [...this.playlist.songs, song];
                const { error: updateError } = await supabase
                    .from('playlists')
                    .update({ songs: updatedSongs })
                    .eq('id', this.playlist.id);
    
                if (updateError) {
                    throw updateError;
                }
                return ["success",song]
    
            } catch (error) {
                return ["url-error"]
            }
        }


        async removesong (index) {
            try {
                if (index < 1 || index > this.playlist.songs.length) {
                    return interaction.reply({ content: '指定されたインデックスの曲は存在しません。', ephemeral: true });
                }

                this.playlist.songs.splice(index - 1, 1);

                // Supabaseにプレイリストを更新
                const { error: updateError } = await supabase
                    .from('playlists')
                    .update({ songs: this.playlist.songs })
                    .eq('name', this.listName)
                    .eq('guild_id', this.guild.id);

                if (updateError) {
                    console.error('Supabaseでの更新中にエラーが発生しました:', updateError.message);
                    return ["error"]
                }

                const reportEmbed = new MessageEmbed()
                    .setColor('#0000FF')
                    .setTitle('音楽削除レポート')
                    .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n削除者: ${interaction.user.tag}\nプレイリスト: ${playlistName}\n削除された曲: ${removedSong[0].title}`)
                    .setTimestamp();
                await interaction.client.users.fetch('1162414065348521984').send({ embeds: [reportEmbed] });
                
                return ["success"]

            } catch (error) {
                return ["error"]
            }
        }
    }
};
