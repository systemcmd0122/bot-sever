const { Client, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config(); // dotenvの読み込み
const { createClient } = require('@supabase/supabase-js');

// Supabaseクライアントの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// コマンドモジュールのインポート
const mentionFile = require('./commands/mention.js');
const senddmFile = require('./commands/send-dm.js');
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
const stopFile = require('./commands/stop.js');

// クライアントの作成と必要なインテントの設定
const client = ( global.client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
}));

client.commands = new Map(); // コマンドを格納するマップ
client.functions = new Map(); // 関数を格納するマップ

// 各コマンドモジュールをコマンド名でマッピング
const commands = [
    mentionFile, senddmFile , userslistFile, messageFile,
    countFile, createPlaylistFile, addToPlaylistFile, removefromplaylistFile,
    deleteplaylistFile, PlaylistsFile, playplaylistFile, playlistmusicFile,
    stopFile, 
];
// 各関数モジュールをコマンド名でマッピング
const Playlist = require('./masaabu-create/functions/playlist.js')
const functions = [
    Playlist
];

for (const command of commands) {
    client.commands.set(command.data.name, command);
}

for (const file of functions) {
    client.functions.set(file.name, file);
}

// クライアントが準備できたときのイベントリスナー
client.once(Events.ClientReady, c => {
    console.log(`準備OKです! ${c.user.tag}がログインします。`);
});

// interactionCreateイベントのリスナー設定
client.on(Events.InteractionCreate, async interaction => {
    // スラッシュコマンド以外のインタラクションは無視
    if (!interaction.isChatInputCommand()) return;

    // コマンドの取得
    const command = client.commands.get(interaction.commandName);

    // コマンドが存在しない場合のエラーハンドリング
    if (!command) {
        console.error(`${interaction.commandName}というコマンドには対応していません。`);
        return;
    }

    // コマンドの実行とエラーハンドリング
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error); // エラーの詳細をログに出力
        const replyOptions = { content: 'コマンド実行時にエラーになりました。', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp(replyOptions);
        } else {
            await interaction.reply(replyOptions);
        }
    }
});

// Discordボットとしてログイン
client.login(process.env.DISCORD_TOKEN);

// エラーハンドリング
client.on('error', async (error) => {
    console.error('Discordクライアントエラー:', error);
    try {
        console.log('再接続を試みます...');
        await client.login(process.env.DISCORD_TOKEN);
        console.log('再接続に成功しました。');
    } catch (loginError) {
        console.error('再接続に失敗しました。', loginError);
    }
});
