import express from 'express';
import * as nftController from '../../controllers/nft/nftController.js';
import { solana } from '../../../config/solanaConfig.js';
import { appConfig } from '../../../config/solanaConfig.js';

const router = express.Router();

// POST /api/nfts/create -> 이미지 파일과 메타데이터 처리를 위해 multer 미들웨어 사용
// 'nftImage' 필드 이름은 상수로 관리 가능 (appConfig.NFT_IMAGE_FIELD_NAME)
router.post('/create', solana.upload.single(appConfig.NFT_IMAGE_FIELD_NAME), nftController.createNft);

// POST /api/nfts/transfer -> nftController.transferNft에 매핑 (변경 없음)
router.post('/transfer', nftController.transferNft);

router.post('/create-with-uri', nftController.createNftWithUri);

export default router;