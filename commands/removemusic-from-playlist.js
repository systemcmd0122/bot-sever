const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removemusic-from-playlist')
        .setDescription('指定したプレイリストから曲を削除します')
        .addStringOption(option =>
            option.setName('playlist')
                .setDescription('曲を削除するプレイリストの名前')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('index')
                .setDescription('削除する曲のインデックス')
                .setRequired(true)),
    async execute(interaction, supabase) {
        const playlistName = interaction.options.getString('playlist');
        const index = interaction.options.getInteger('index');
        const guildId = interaction.guild.id; // サーバーのIDを取得

        // プレイリストを取得
        const { data: playlist, error } = await supabase
            .from('playlists')
            .select('songs')
            .eq('name', playlistName)
            .eq('guild_id', guildId)
            .single();

        if (error || !playlist || !playlist.songs) {
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('プレイリストの取得中にエラーが発生しました。');
            return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }

        const songs = playlist.songs;
        if (index < 1 || index > songs.length) {
            const invalidIndexEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('指定されたインデックスの曲は存在しません。');
            return interaction.reply({ embeds: [invalidIndexEmbed], ephemeral: true });
        }

        const removedSong = songs.splice(index - 1, 1);

        // プレイリストを更新
        const { error: updateError } = await supabase
            .from('playlists')
            .update({ songs })
            .eq('name', playlistName)
            .eq('guild_id', guildId);

        if (updateError) {
            const updateErrorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('エラー')
                .setDescription('プレイリストの更新中にエラーが発生しました。');
            return interaction.reply({ embeds: [updateErrorEmbed], ephemeral: true });
        }

        const successEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('成功')
            .setDescription(`${playlistName} の ${index} 番目の曲を削除しました`);
            console.log(`${playlistName} の ${index} 番目の曲を削除しました`);
        return interaction.reply({ embeds: [successEmbed], ephemeral: true });


    },
};
