const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabaseクライアントの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('share-playlist')
        .setDescription('指定したプレイリストを他のサーバーにシェアします。')
        .addStringOption(option =>
            option.setName('playlist')
                .setDescription('シェアしたいプレイリストの名前')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('server_id')
                .setDescription('シェア先のサーバーID')
                .setRequired(true)),
    async execute(interaction) {
        const playlistName = interaction.options.getString('playlist');
        const targetServerId = interaction.options.getString('server_id');
        const sourceGuildId = interaction.guild.id; // 現在のサーバーIDを取得

        try {
            // プレイリストをSupabaseから取得
            const { data: playlistData, error: fetchError } = await supabase
                .from('playlists')
                .select('songs')
                .eq('name', playlistName)
                .eq('guild_id', sourceGuildId)
                .single();

            if (fetchError || !playlistData) {
                const noPlaylistEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('指定されたプレイリストは存在しません。')
                    .setTimestamp();
                return interaction.reply({ embeds: [noPlaylistEmbed], ephemeral: true });
            }

            // プレイリストをターゲットサーバーにシェア
            const { error: insertError } = await supabase
                .from('playlists')
                .insert([{ name: playlistName, songs: playlistData.songs, guild_id: targetServerId }]);

            if (insertError) {
                const shareErrorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('プレイリストのシェア中にエラーが発生しました。')
                    .setTimestamp();
                return interaction.reply({ embeds: [shareErrorEmbed], ephemeral: true });
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('成功')
                .setDescription(`プレイリスト "${playlistName}" をサーバーID "${targetServerId}" にシェアしました。`)
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

        } catch (error) {
            console.error('プレイリストのシェア中にエラーが発生しました:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('プレイリストのシェア中にエラーが発生しました。')
                .setTimestamp();
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
