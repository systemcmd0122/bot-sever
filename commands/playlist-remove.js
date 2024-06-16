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
        .setName('playlist-remove')
        .setDescription('Masaabu製 - 指定したプレイリストから曲を削除します')
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
        const result = await PlaylistManager.remove(index);
        
        switch (result[0]) {
            case "success":{
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription(`${playlistName} の ${index} 番目の曲を削除しました`);
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }
            
            case "error":{
                const noPlaylistEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('プレイリストから曲の削除中にエラーが発生しました。');
                return interaction.reply({ embeds: [noPlaylistEmbed], ephemeral: true });
            }
        
            default:
                break;
        }
    },
};
