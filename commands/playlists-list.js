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
        .setName('playlists-list')
        .setDescription('利用可能なプレイリストの一覧を表示します。'),
    async execute(interaction) {
        const guildId = interaction.guild.id; // サーバーのIDを取得

        try {
            // Supabaseからプレイリスト情報を取得する
            const { data: playlists, error } = await supabase
                .from('playlists')
                .select('name')
                .eq('guild_id', guildId);

            if (error) {
                throw error;
            }

            if (!playlists || playlists.length === 0) {
                const noPlaylistsEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('プレイリスト一覧')
                    .setDescription('利用可能なプレイリストはありません。');
                
                await interaction.reply({ embeds: [noPlaylistsEmbed], ephemeral: true });
            } else {
                const playlistNames = playlists.map(playlist => playlist.name);
                const description = playlistNames.map(name => `- ${name}`).join('\n');
                const playlistsEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('利用可能なプレイリスト')
                    .setDescription(description);

                await interaction.reply({ embeds: [playlistsEmbed], ephemeral: true });
            }

            // 管理者へのレポート
            const adminUserId = '1162414065348521984'; // メッセージを受け取る管理者のユーザーID
            const adminUser = await interaction.client.users.fetch(adminUserId);
            const reportEmbed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle('プレイリスト一覧表示レポート')
                .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\nコマンド実行者: ${interaction.user.tag}`)
                .setTimestamp();

            await adminUser.send({ embeds: [reportEmbed] });

        } catch (error) {
            console.error('プレイリストの取得中にエラーが発生しました:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('プレイリストの取得中にエラーが発生しました。');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
