import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import anchor from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { keypairIdentity } from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import multer from 'multer';
import * as Constants from '../src/constants/appConstants.js';

// --- 초기화 로직 ---
console.log('🛠️  솔라나 설정 초기화 시작...');

// IDL 파일 경로 설정 (프로젝트 루트 기준)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); // 현재 config 폴더
const projectRootDir = path.resolve(__dirname, '..'); // 프로젝트 루트 폴더
const IDL_PATH = path.join(projectRootDir, Constants.IDL_FILENAME);
const WALLET_PATH = path.join(projectRootDir, Constants.WALLET_PATH);

// 1. 솔라나 연결 및 지갑 로드
const connection = new Connection(Constants.SOLANA_RPC_ENDPOINT, "confirmed");
if (!fs.existsSync(WALLET_PATH)) {
    console.error(`\n❌ 치명적 오류: 서버 지갑 파일을 찾을 수 없습니다. 경로: ${WALLET_PATH}`);
    process.exit(1);
}
const walletFile = fs.readFileSync(WALLET_PATH, "utf8");
const walletSecretKey = Uint8Array.from(JSON.parse(walletFile));
const serverKeypair = Keypair.fromSecretKey(walletSecretKey);
const serverWallet = new anchor.Wallet(serverKeypair);
console.log('✅ 솔라나 연결 및 서버 지갑 로드 완료:', serverKeypair.publicKey.toBase58());

// 2. Anchor Provider 및 Program 설정
const provider = new anchor.AnchorProvider(connection, serverWallet, {
    preflightCommitment: "confirmed",
    commitment: "confirmed"
});
anchor.setProvider(provider);

if (!fs.existsSync(IDL_PATH)) {
    console.error(`\n❌ 치명적 오류: IDL 파일을 찾을 수 없습니다. 경로: ${IDL_PATH}`);
    process.exit(1);
}
const idl = JSON.parse(fs.readFileSync(IDL_PATH, "utf8"));
const programId = new PublicKey(Constants.PROGRAM_ID_STR);
const program = new anchor.Program(idl, provider);
console.log(`✅ Anchor Program 로드 완료 (ID: ${programId.toBase58()})`);

// 3. UMI 초기화 (NFT 업로드용)
const umi = createUmi(Constants.SOLANA_RPC_ENDPOINT)
    .use(keypairIdentity(serverKeypair))
    .use(
        irysUploader({
            address: Constants.UPLOADER_ADDRESS,
            providerUrl: Constants.SOLANA_RPC_ENDPOINT,
            timeout: Constants.UPLOADER_TIMEOUT,
        })
    );
console.log("✅ UMI 초기화 완료 (Irys Uploader)");

// 4. Multer 설정 (파일 업로드 처리)
const storage = multer.memoryStorage(); // 파일을 메모리에 버퍼로 저장
const upload = multer({
    storage: storage,
    limits: { fileSize: Constants.NFT_FILE_SIZE_LIMIT_MB * 1024 * 1024 } // 파일 크기 제한
});
console.log(`✅ Multer 설정 완료 (Memory Storage, ${Constants.NFT_FILE_SIZE_LIMIT_MB}MB 제한)`);

// --- 초기화된 객체 및 주요 ID 내보내기 ---
export const solana = {
    connection,
    serverKeypair,
    serverWallet,
    provider,
    program,
    umi,
    upload, // Multer 인스턴스 내보내기 (라우터에서 사용)
};

// 주요 프로그램 ID 및 주소 내보내기
export const keyIds = {
    PROGRAM_ID: programId,
    TOKEN_MINT_ADDRESS_FOR_TRANSFER: new PublicKey(Constants.TOKEN_MINT_ADDRESS_FOR_TRANSFER_STR),
    TOKEN_METADATA_PROGRAM_ID: Constants.TOKEN_METADATA_PROGRAM_ID,
    TOKEN_PROGRAM_ID,           // @solana/spl-token 에서 가져옴
    ASSOCIATED_TOKEN_PROGRAM_ID,// @solana/spl-token 에서 가져옴
    SYSTEM_PROGRAM_ID: SystemProgram.programId,
    SYSVAR_RENT_PUBKEY,
};

// 앱 설정값 내보내기
export const appConfig = {
    NFT_DEFAULT_SYMBOL: Constants.NFT_DEFAULT_SYMBOL,
    SPL_TOKEN_DECIMALS: Constants.SPL_TOKEN_DECIMALS,
    NFT_IMAGE_FIELD_NAME: Constants.NFT_IMAGE_FIELD_NAME,
    NFT_METADATA_FIELD_NAME: Constants.NFT_METADATA_FIELD_NAME,
};

console.log('👍 설정 로드 완료.');