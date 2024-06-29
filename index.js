const { Client, Events, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const express = require('express');

// Supabaseクライアントの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// コマンドモジュールのインポート
// 音楽関係のコマンド
const createPlaylistFile = require('./commands/create-playlist.js');
const addToPlaylistFile = require('./commands/add-to-playlist.js');
const removefromplaylistFile = require('./commands/removemusic-from-playlist.js');
const deleteplaylistFile = require('./commands/delete-playlist.js');
const PlaylistsFile = require('./commands/playlists-list.js');
const playplaylistFile = require('./commands/play-playlist.js');
const stopFile = require('./commands/stop.js');
const shareplaylistFile = require('./commands/share-playlist.js');

// その他のコマンド
const mentionFile = require('./commands/mention.js');
const messagecountFile = require('./commands/message-count.js');
const deletemessageFile = require('./commands/delete-messages.js');
const senddmFile = require('./commands/send-dm.js');
const userlistFile = require('./commands/users-list.js');

// クライアントの作成と必要なインテントの設定
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.commands = new Map();

// 各コマンドモジュールをコマンド名でマッピング
const commands = [
    // 音楽関係のコマンド
    createPlaylistFile,
    addToPlaylistFile,
    removefromplaylistFile,
    deleteplaylistFile,
    PlaylistsFile,
    playplaylistFile,
    stopFile,
    shareplaylistFile,

    // その他のコマンド
    mentionFile,
    messagecountFile,
    deletemessageFile,
    senddmFile,
    userlistFile,
];

for (const command of commands) {
    client.commands.set(command.data.name, command);
}

// クライアントが準備できたときのイベントリスナー
client.once(Events.ClientReady, c => {
    console.log(`準備OKです! ${c.user.tag}がログインします。`);

    // 定期的にアクティビティを発生させるためのコード
    const userId = '1162414065348521984'; // メッセージを送信するユーザーID
    const interval = 5 * 60 * 1000; // 5分間隔

    setInterval(async () => {
        try {
            const user = await client.users.fetch(userId);
            if (user) {
                user.send('定期的なメッセージです。Renderのスリープを防ぎます。')
                    .then(() => console.log('定期メッセージを送信しました。'))
                    .catch(console.error);
            } else {
                console.error('ユーザーが見つかりません。');
            }
        } catch (error) {
            console.error('ユーザー取得中にエラーが発生しました:', error);
        }
    }, interval);
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
        await command.execute(interaction, supabase); // supabaseクライアントを渡す
    } catch (error) {
        console.error(error);
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

// Expressサーバーの設定
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Discord bot is running');
});

app.listen(port, () => {
    console.log(`Expressサーバーがポート${port}で起動しました`);
});