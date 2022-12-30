const Discord = require('discord.js');
const client = new Discord.Client();
const Binance = require('binance-api-node').default;

// Ganti YOUR_API_KEY dan YOUR_API_SECRET dengan API key dan secret Anda dari Binance
const binance = Binance({
  apiKey: 'YOUR_API_KEY',
  apiSecret: 'YOUR_API_SECRET',
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

// Fungsi untuk mengirim pesan ke channel Discord
function sendMessage(channelId, message) {
  const channel = client.channels.cache.get(channelId);
  channel.send(message);
}

// Monitor aktivitas beli di semua pasangan mata uang di Binance
setInterval(() => {
  binance.allBookTickers().then(tickers => {
    const largeTrades = tickers
      .filter(ticker => ticker.bidQty > 1000)
      .map(ticker => `Terdeteksi aktivitas beli dalam jumlah besar di ${ticker.symbol}! Bid: ${ticker.bidQty} pada harga ${ticker.bidPrice}`);
    if (largeTrades.length > 0) {
      const message = largeTrades.join('\n');
      sendMessage('YOUR_CHANNEL_ID', message);
    }
  });
}, 10000); // Cek setiap 10 detik

let prevMa12 = 0;
let prevMa24 = 0;

// Monitor golden cross pada pasangan mata uang BTC/USDT di Binance
setInterval(() => {
  binance.klines({ symbol: 'BTCUSDT', interval: '1h' }).then(candles => {
    const lastCandle = candles[candles.length - 1];
    const close = lastCandle[4];
    const ma12 = candles
      .slice(-12)
      .reduce((total, candle) => total + Number(candle[4]), 0) / 12;
    const ma24 = candles
      .slice(-24)
      .reduce((total, candle) => total + Number(candle[4]), 0) / 24;
    if (prevMa12 < prevMa24 && ma12 > ma24) {
      sendMessage('YOUR_CHANNEL_ID', 'Terdeteksi golden cross pada BTC/USDT!');
    }
    prevMa12 = ma12;
    prevMa24 = ma24;
  });
}, 10000); // Cek setiap 10 detik


// Fungsi untuk menghitung RSI
function calculateRsi(candles, n) {
  const gains = [];
  const losses = [];
  for (let i = 1; i < n; i++) {
    const change = candles[i][4] - candles[i - 1][4];
    if (change > 0) {
      gains.push(change);
    } else {
      losses.push(-change);
    }
  }
  const avgGain = gains.reduce((total, gain) => total + gain, 0) / n;
  const avgLoss = losses.reduce((total, loss) => total + loss, 0) / n;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Monitor RSI 14 over sold pada pasangan mata uang BTC/USDT di Binance
setInterval(() => {
  binance.klines({ symbol: 'BTCUSDT', interval: '1h' }).then(candles => {
    const rsi = calculateRsi(candles, 14);
    if (rsi > 70) {
      sendMessage('YOUR_CHANNEL_ID', 'Terdeteksi RSI 14 over sold pada BTC/USDT!');
    }
  });
}, 10000); // Cek setiap 10 detik

client.login('YOUR_BOT_TOKEN');
