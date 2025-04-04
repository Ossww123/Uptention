import express from 'express';
import * as tokenController from '../../controllers/token/tokenController.js';

const router = express.Router();

// POST /api/tokens/transfer -> tokenController.transferToken 함수 호출 (이 함수 내부만 변경됨)
router.post('/transfer', tokenController.transferToken);

export default router;