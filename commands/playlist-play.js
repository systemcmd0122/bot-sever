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
        .setName('playlist-play')
        .setDescription('Masaabu製 - 指定したプレイリストを再生します')
        .addStringOption(option => 
            option.setName('playlist')
                .setDescription('プレイリストの名前')
                .setRequired(true)),
    async execute(interaction) {
        const playlistName = interaction.options.getString('playlist');
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            const noVoiceChannelEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('このコマンドを使用するにはボイスチャンネルに参加している必要があります。')
                .setTimestamp();
            return interaction.reply({ embeds: [noVoiceChannelEmbed] });
        }

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

        interaction.reply(`${playlistName} を再生中です...`)
        const result = await PlaylistManager.play(voiceChannel, interaction.channel);
        
        switch (result[0]) {
            case "get-error":{
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('プレイリストの取得中にエラーが発生しました。');
                return interaction.channel.send({ embeds: [errorEmbed] });
            }
            
            case "not-found":{
                const noPlaylistEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('そのプレイリストは存在しません。');
                return interaction.channel.send({ embeds: [noPlaylistEmbed] });
            }
        
            default:
                break;
        }
    },
};
