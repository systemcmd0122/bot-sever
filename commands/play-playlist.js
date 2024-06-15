const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
const ytdl = require('ytdl-core');
require('dotenv').config(); // dotenvの読み込み

// Supabaseクライアントの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play-playlist')
        .setDescription('指定したプレイリストを再生します。')
        .addStringOption(option => 
            option.setName('name')
                .setDescription('プレイリストの名前を指定してください')
                .setRequired(true)),
    async execute(interaction) {
        const playlistName = interaction.options.getString('name');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            const noVoiceChannelEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('このコマンドを使用するにはボイスチャンネルに参加している必要があります。')
                .setTimestamp();
            return interaction.reply({ embeds: [noVoiceChannelEmbed] });
        }

        try {
            // Supabaseからプレイリスト情報を取得する
            const { data: playlistData, error } = await supabase
                .from('playlists')
                .select('songs')
                .eq('name', playlistName)
                .single();

            if (error) {
                throw error;
            }

            if (!playlistData) {
                const noPlaylistEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('指定されたプレイリストは存在しません。')
                    .setTimestamp();
                return interaction.reply({ embeds: [noPlaylistEmbed] });
            }

            const playlist = playlistData.songs;

            // プレイリストが空の場合
            if (!playlist || playlist.length === 0) {
                const emptyPlaylistEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('選択したプレイリストに曲が含まれていません。')
                    .setTimestamp();
                return interaction.reply({ embeds: [emptyPlaylistEmbed] });
            }

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });

            const player = createAudioPlayer();
            connection.subscribe(player);

            let currentIndex = 0;

            await interaction.reply({ content: `プレイリスト "${playlistName}" の再生を開始します。`, ephemeral: true });

            const playNextSong = async () => {
                if (currentIndex >= playlist.length) {
                    connection.destroy();
                    const endEmbed = new EmbedBuilder()
                        .setColor('#FFFF00')
                        .setTitle('プレイリスト再生終了')
                        .setDescription(`プレイリスト "${playlistName}" の再生が終了しました。`)
                        .setTimestamp();

                    await interaction.followUp({ embeds: [endEmbed] });

                    // 管理者へのレポート
                    const adminUserId = '1162414065348521984'; // メッセージを受け取る管理者のユーザーID
                    const adminUser = await interaction.client.users.fetch(adminUserId);
                    const reportEmbed = new EmbedBuilder()
                        .setColor('#0000FF')
                        .setTitle('音楽再生レポート')
                        .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n再生者: ${interaction.user.tag}`)
                        .setTimestamp();

                    await adminUser.send({ embeds: [reportEmbed] });

                    return;
                }

                const song = playlist[currentIndex];
                let stream;
                try {
                    stream = ytdl(song.url, { filter: 'audioonly' });
                } catch (error) {
                    console.error('Error creating stream:', error);
                    await interaction.followUp({ content: `エラーが発生しました: ${error.message}` });
                    connection.destroy();
                    return;
                }
                
                const resource = createAudioResource(stream);
                player.play(resource);

                const playEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('再生中')
                    .setDescription(`再生中: ${song.title}`)
                    .addFields(
                        { name: 'プレイリスト', value: playlistName },
                        { name: '曲の番号', value: `${currentIndex + 1}/${playlist.length}` }
                    )
                    .setTimestamp();

                await interaction.followUp({ embeds: [playEmbed] });

                currentIndex++;
            };

            player.on(AudioPlayerStatus.Idle, playNextSong);

            player.on('error', error => {
                console.error('Error in audio player:', error);
                connection.destroy();
            });

            playNextSong();

        } catch (error) {
            console.error('プレイリストの取得中にエラーが発生しました:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('プレイリストの取得中にエラーが発生しました。')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
