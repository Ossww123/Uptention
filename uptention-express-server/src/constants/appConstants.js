import { PublicKey } from "@solana/web3.js";

// --- 기본 설정 ---
export const SOLANA_RPC_ENDPOINT = "https://api.devnet.solana.com"; // 또는 clusterApiUrl("devnet")
export const WALLET_PATH = "my-keypair.json"; // <<< 실제 경로로 수정 필요
export const IDL_FILENAME = "anchor_token_transfer.json"; // 프로젝트 루트에 위치 가정
export const PROGRAM_ID_STR = "6EU2JYdEjdQgXMQH2m5UFXn6p4J1zVL73M65PkvwgwDR"; // <<< 실제 프로그램 ID로 수정 필요
export const UPLOADER_ADDRESS = "https://devnet.irys.xyz";
export const UPLOADER_TIMEOUT = 120_000; // ms (2분)

// --- NFT 관련 설정 ---
export const NFT_DEFAULT_SYMBOL = "UPNFT"; // 클라이언트가 심볼 미제공 시 사용할 기본값
export const NFT_IMAGE_FIELD_NAME = "nftImage"; // multipart/form-data에서 이미지 파일 필드 이름
export const NFT_METADATA_FIELD_NAME = "metadata"; // multipart/form-data에서 메타데이터 JSON 문자열 필드 이름
export const NFT_FILE_SIZE_LIMIT_MB = 10; // NFT 이미지 파일 크기 제한 (MB)

// --- 토큰 전송 관련 설정 ---
export const TOKEN_MINT_ADDRESS_FOR_TRANSFER_STR = "5ymZGsCFkfSzZN6AbwMWU2v4A4c5yeqmGj1vSpRWg75n"; // <<< 실제 토큰 민트 주소로 수정 필요
export const SPL_TOKEN_DECIMALS = 8; // 토큰 전송 시 사용할 소수점 자릿수

// --- 프로그램 ID (PublicKey 객체) ---
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");