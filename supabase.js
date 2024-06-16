require('dotenv').config(); // dotenvを使用して.envファイルを読み込む
const { createClient } = require('@supabase/supabase-js');

// .envファイルからSupabaseのURLとキーを取得する
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Supabaseクライアントの初期化
const supabase = createClient(supabaseUrl, supabaseKey, {
  global: {
    headers: {
      'apikey': supabaseKey,
    },
    fetch: (url, options) => {
      console.log(`Connecting to ${url} with options:`, options);
      return require('undici').fetch(url, {
        ...options,
        connect: {
          timeout: 10000 // タイムアウトを10秒に設定
        }
      });
    }
  }
});

// 他のコード（コマンドの定義など）を続ける
