const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js'); // EmbedBuilder をインポート
const supabase = require('../supabase'); // Supabaseクライアントをインポート

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

        // Supabaseからプレイリストが既に存在するかを確認する
        const { data: existingPlaylist, error: fetchError } = await supabase
            .from('playlists')
            .select('name')
            .eq('name', name)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116: 行が見つからない
            console.error('プレイリストの取得中にエラーが発生しました:', fetchError);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('プレイリストの取得中にエラーが発生しました。');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        if (existingPlaylist) {
            const existingPlaylistEmbed = new EmbedBuilder() // EmbedBuilder を使用して Embed を作成
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('その名前のプレイリストは既に存在します。');
            return interaction.reply({ embeds: [existingPlaylistEmbed], ephemeral: true });
        }

        // プレイリストが存在しない場合、新しいプレイリストを作成する
        const { error: insertError } = await supabase
            .from('playlists')
            .insert([{ name, songs: [] }]);

        if (insertError) {
            console.error('プレイリストの作成中にエラーが発生しました:', insertError);
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('プレイリストの作成中にエラーが発生しました。');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const successEmbed = new EmbedBuilder() // EmbedBuilder を使用して Embed を作成
            .setColor('#00FF00')
            .setTitle('プレイリスト作成')
            .setDescription(`プレイリスト "${name}" が作成されました。`);
        await interaction.reply({ embeds: [successEmbed], ephemeral: true });

        // 管理者へのレポート
        const adminUserId = '1162414065348521984'; // メッセージを受け取る管理者のユーザーID
        try {
            const adminUser = await interaction.client.users.fetch(adminUserId);
            const reportEmbed = new EmbedBuilder() // EmbedBuilder を使用して Embed を作成
                .setColor('#0000FF')
                .setTitle('プレイリスト作成レポート')
                .setDescription(`サーバー: ${interaction.guild.name}\nチャンネル: ${interaction.channel.name}\n作成者: ${interaction.user.tag}\nプレイリスト名: ${name}`)
                .setTimestamp();
            await adminUser.send({ embeds: [reportEmbed] });
        } catch (err) {
            console.error('管理者へのレポート送信中にエラーが発生しました:', err);
        }
    },
};
