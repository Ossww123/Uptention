// server.js
import express from 'express';
import cors from 'cors';

// Import routers
import tokenRoutes from './src/routes/token/tokenRoutes.js';
import nftRoutes from './src/routes/nft/nftRoutes.js';

// !! Crucial: Import config to trigger initialization !!
// This executes the setup code in solanaConfig.js
import './config/solanaConfig.js';

const app = express();

// --- Global Middleware ---
app.use(cors());          // Enable CORS
app.use(express.json());  // Parse JSON bodies
// app.use(express.urlencoded({ extended: true })); // If using form submissions (not needed for JSON/multipart)

// --- API Routes ---
// Mount the routers onto base paths
app.use('/api/tokens', tokenRoutes);
app.use('/api/nfts', nftRoutes);

// --- Basic Root Route ---
app.get('/', (req, res) => {
    res.send('Solana API Server (Structured) is running!');
});

// --- Global Error Handling Middleware (Catches errors passed via next()) ---
app.use((err, req, res, next) => {
  console.error("💥 Unhandled Application Error:", err.stack || err);
  // Avoid sending detailed stack traces in production
  res.status(err.status || 500).json({
      success: false,
      error: err.message || 'An unexpected server error occurred.'
  });
});

// --- Start Server ---
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