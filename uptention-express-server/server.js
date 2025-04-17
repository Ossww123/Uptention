import express from 'express';
import cors from 'cors';
import tokenRoutes from './src/routes/token/tokenRoutes.js';
import nftRoutes from './src/routes/nft/nftRoutes.js';

import './config/solanaConfig.js';

const app = express();

// app.use(cors());
app.use(express.json());

app.use('/api/tokens', tokenRoutes);
app.use('/api/nfts', nftRoutes);

app.get('/', (req, res) => {
    res.send('Solana API Server (Structured) is running!');
});

app.use((err, req, res, next) => {
  console.error("💥 Unhandled Application Error:", err.stack || err);
  res.status(err.status || 500).json({
      success: false,
      error: err.message || 'An unexpected server error occurred.'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server listening on port ${PORT}`);
    console.log("   Available Endpoints:");
    console.log(`     POST http://<your-server-ip>:${PORT}/api/tokens/transfer`);
    console.log(`     POST http://<your-server-ip>:${PORT}/api/nfts/create`);
    console.log(`     POST http://<your-server-ip>:${PORT}/api/nfts/transfer`);
    console.log("   Structure: Constants, Config, Routes, Controllers, Services");
    console.log("   Waiting for requests...");
});