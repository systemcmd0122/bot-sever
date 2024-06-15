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
        .setName('playlist-music-list')
        .setDescription('指定したプレイリストの曲を表示します。')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('プレイリストの名前を指定してください')
                .setRequired(true)),
    async execute(interaction) {
        const playlistName = interaction.options.getString('name');

        try {
            // プレイリストが存在するかを確認する
            const { data: playlist, error: fetchError } = await supabase
                .from('playlists')
                .select('songs')
                .eq('name', playlistName)
                .single();

            if (fetchError || !playlist) {
                return interaction.reply({ content: '指定されたプレイリストは存在しません。', ephemeral: true });
            }

            const songs = playlist.songs;
            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`プレイリスト: ${playlistName}`)
                .setDescription('プレイリストに含まれる曲:')
                .addFields(
                    songs.map((song, index) => ({
                        name: `曲 ${index + 1}`,
                        value: `[${song.title}](${song.url})`,
                    }))
                );

            // 管理者へのレポート
            const adminUserId = '1162414065348521984'; // メッセージを受け取る管理者のユーザーID
            const adminUser = await interaction.client.users.fetch(adminUserId);
            const reportEmbed = new EmbedBuilder()
                .setColor('#0000FF')
                .setTitle('音楽再生レポート')
                .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n再生者: ${interaction.user.tag}`)
                .setTimestamp();

            await adminUser.send({ embeds: [reportEmbed] });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (error) {
            console.error('プレイリストの読み込み中にエラーが発生しました:', error);
            return interaction.reply({ content: 'プレイリストの読み込み中にエラーが発生しました。', ephemeral: true });
        }
    },
};
