const ytdl = require('ytdl-core');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config(); // dotenvの読み込み

// Supabaseクライアントの設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
    name: "playlist",
    run: class {
        constructor(guildId, listName) {
            this.guildId = guildId;
            this.listName = listName;

            // プレイリストが存在するかを確認する
            const { data: playlists, error: fetchError } = supabase
                .from('playlists')
                .select('id, name, songs');

            if (fetchError) {
                console.error('プレイリストの取得中にエラーが発生しました:', fetchError);
                return "get-error"
            }
            const playlist = playlists.find(pl => pl.name === listName);

            this.playlist = playlist
        }

        additem (url) {
            
        }
        
    }
};
