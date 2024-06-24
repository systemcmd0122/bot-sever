const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-playlist')
        .setDescription('新しいプレイリストを作成します。')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('プレイリストの名前を指定してください')
                .setRequired(true)),
    async execute(interaction) {
        const name = interaction.options.getString('name');
        const guildId = interaction.guild.id;

        try {
            // プレイリストが既に存在するかを確認
            const { data: existingPlaylist, error: fetchError } = await supabase
                .from('playlists')
                .select('name')
                .eq('name', name)
                .eq('guild_id', guildId)
                .single();

            if (fetchError && fetchError.code !== 'PGRST116') { // 'PGRST116': 行が見つからないエラー
                console.error('プレイリストの取得中にエラーが発生しました:', fetchError);
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('プレイリストの取得中にエラーが発生しました。');
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            if (existingPlaylist) {
                const existingPlaylistEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('その名前のプレイリストは既に存在します。');
                return interaction.reply({ embeds: [existingPlaylistEmbed], ephemeral: true });
            }

            // 新しいプレイリストを作成
            const { error: insertError } = await supabase
                .from('playlists')
                .insert([{ name, guild_id: guildId, songs: [] }]);

            if (insertError) {
                console.error('プレイリストの作成中にエラーが発生しました:', insertError);
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('エラー')
                    .setDescription('プレイリストの作成中にエラーが発生しました。');
                return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            }

            const successEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('プレイリスト作成')
                .setDescription(`プレイリスト "${name}" が作成されました。`);
            await interaction.reply({ embeds: [successEmbed], ephemeral: true });

            console.log(`プレイリスト "${name}" が作成されました。`);

            // 管理者へのレポート
            const adminUserId = '1162414065348521984';
            try {
                const adminUser = await interaction.client.users.fetch(adminUserId);
                const reportEmbed = new EmbedBuilder()
                    .setColor('#0000FF')
                    .setTitle('プレイリスト作成レポート')
                    .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n作成者: ${interaction.user.tag}\nプレイリスト名: ${name}`)
                    .setTimestamp();
                await adminUser.send({ embeds: [reportEmbed] });
            } catch (err) {
                console.error('管理者へのレポート送信中にエラーが発生しました:', err);
            }
        } catch (error) {
            console.error('エラーが発生しました:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription(`エラーが発生しました: ${error.message}`);
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
    },
};
