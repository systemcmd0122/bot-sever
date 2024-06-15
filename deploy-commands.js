require('dotenv').config(); // dotenvの読み込み
const { REST } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// 各コマンドモジュールのインポート
const mentionFile = require('./commands/mention.js');
const senddmFile = require('./commands/send-dm.js');
const joinvcFile = require('./commands/join-vc.js');
const leavevcFile = require('./commands/leave-vc.js');
const userslistFile = require('./commands/users-list.js');
const messageFile = require('./commands/delete-messages.js');
const countFile = require('./commands/message-count.js');
const createPlaylistFile = require('./commands/create-playlist.js');
const addToPlaylistFile = require('./commands/add-to-playlist.js');
const removefromplaylistFile = require('./commands/removemusic-from-playlist.js');
const deleteplaylistFile = require('./commands/delete-playlist.js');
const PlaylistsFile = require('./commands/playlists-list.js');
const playplaylistFile = require('./commands/play-playlist.js');
const playlistmusicFile = require('./commands/playlist-music-list.js');

// コマンドの定義を toJSON() メソッドで変換
const commands = [
    mentionFile.data.toJSON(),
    senddmFile.data.toJSON(),
    joinvcFile.data.toJSON(),
    leavevcFile.data.toJSON(),
    userslistFile.data.toJSON(),
    messageFile.data.toJSON(),
    countFile.data.toJSON(),
    createPlaylistFile.data.toJSON(),
    addToPlaylistFile.data.toJSON(),
    removefromplaylistFile.data.toJSON(),
    deleteplaylistFile.data.toJSON(),
    PlaylistsFile.data.toJSON(),
    playplaylistFile.data.toJSON(),
    playlistmusicFile.data.toJSON(),
];

(async () => {
    try {
        // REST API を使用してグローバルコマンドを登録
        await rest.put(
            Routes.applicationCommands(process.env.DISCORD_APPLICATION_ID),
            { body: commands }
        );
        console.log('グローバルコマンドが登録されました！');
    } catch (error) {
        console.error('コマンドの登録中にエラーが発生しました:', error);
    }
})();
