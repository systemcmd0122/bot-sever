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
        .setName('playlist-add')
        .setDescription('Masaabu製 - プレイリストに曲を追加します')
        .addStringOption(option => 
            option.setName('playlist')
                .setDescription('プレイリストの名前')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('url')
                .setDescription('追加するYouTubeのURL')
                .setRequired(true)),
    async execute(interaction) {
        const playlistName = interaction.options.getString('playlist');
        const url = interaction.options.getString('url');

        const PlaylistManagerClass = client.functions.get('playlist');
        const PlaylistManager = await new PlaylistManagerClass.run(interaction.guild, playlistName);
        switch (PlaylistManager[0]) {
            case "get-error":{
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('プレイリストの取得中にエラーが発生しました。');
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            case "not-found":{
                const noPlaylistEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('そのプレイリストは存在しません。');
                return interaction.reply({ embeds: [noPlaylistEmbed], ephemeral: true });
            }
        }
        const result = await PlaylistManager.addsong(url);

        switch (result[0]) {
            case "success":{
                const successEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('曲追加成功')
                    .setDescription(`プレイリスト "${playlistName}" に "${song.title}" を追加しました。`);
                await interaction.reply({ embeds: [successEmbed], ephemeral: true });

                // 管理者へのレポート
                const adminUser = await interaction.client.users.fetch('1162414065348521984');
                const reportEmbed = new EmbedBuilder()
                    .setColor('#0000FF')
                    .setTitle('音楽再生レポート')
                    .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n追加者: ${interaction.user.tag}`)
                    .setTimestamp();
                return adminUser.send({ embeds: [reportEmbed] });
            }
            
            case "not-found":{
                const noPlaylistEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('そのプレイリストは存在しません。');
                return interaction.reply({ embeds: [noPlaylistEmbed], ephemeral: true });
            }
            
            case "url-error":{
                const invalidUrlEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('有効なYouTubeのURLを指定してください。');
                return interaction.reply({ embeds: [invalidUrlEmbed], ephemeral: true });
            }
        
            default:
                break;
        }
    },
};
