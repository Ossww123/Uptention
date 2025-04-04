// src/services/token/tokenService.js
import anchor from "@coral-xyz/anchor";
const { BN } = anchor;
import { Transaction, sendAndConfirmTransaction, PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { solana, keyIds, appConfig } from '../../../config/solanaConfig.js';

/**
 * 지정된 양의 SPL 토큰을 서버 지갑에서 수신자에게 전송합니다.
 * @param {PublicKey} recipientPublicKey - 토큰을 받을 사람의 PublicKey 객체.
 * @param {number} amount - 전송할 토큰의 양 (사람이 읽을 수 있는 형식, 예: 1.5). BN 변환은 이 함수 내에서 처리.
 * @returns {Promise<string>} - 트랜잭션 서명 문자열.
 * @throws {Error} - 전송 실패 시.
 */
export const sendSplToken = async (recipientPublicKey, amount) => {
    console.log(`  [서비스] ${amount} 토큰을 ${recipientPublicKey?.toBase58()}에게 전송 시도`); // optional chaining 추가

    // 설정에서 민트 주소 PublicKey 객체와 소수점 자릿수 가져오기
    const mintPublicKey = keyIds?.TOKEN_MINT_ADDRESS_FOR_TRANSFER; // optional chaining 추가
    const decimals = appConfig.SPL_TOKEN_DECIMALS;

    // mintPublicKey가 유효한지 먼저 확인 (가장 중요한 부분)
    if (!mintPublicKey || typeof mintPublicKey.toBase58 !== 'function') {
         console.error("  [서비스 오류] 설정에서 유효한 mintPublicKey를 가져오지 못했습니다. config/solanaConfig.js 및 constants/appConstants.js 확인 필요.");
         throw new Error("설정 오류: 유효한 토큰 민트 주소(PublicKey)를 찾을 수 없습니다.");
    }

    // 전송량 계산 (BN 사용)
    const transferAmountBN = new BN(amount * (10 ** decimals));

    // 전송량 유효성 검사
    if (transferAmountBN.isNeg() || transferAmountBN.isZero()) {
        throw new Error("전송량은 0보다 커야 합니다.");
    }
    console.log(`  [서비스] Mint: ${mintPublicKey.toBase58()}, Amount (atomic): ${transferAmountBN.toString()}`);

    try {
        // 보내는 사람(서버)의 ATA 가져오기 또는 생성
        console.log("  [서비스] 보내는 사람 ATA 확인/생성 중...");
        const fromATA = await getOrCreateAssociatedTokenAccount(
            solana.connection,                // Connection 객체
            solana.serverKeypair,             // Payer (ATA 생성 비용 지불)
            mintPublicKey,                    // 토큰 민트 주소 (PublicKey)
            solana.serverKeypair.publicKey,   // ATA 소유자 (서버 지갑)
            false,                            // allowOwnerOffCurve (일반적)
            "confirmed",                      // commitment
            { commitment: "confirmed" }       // confirmOptions
        );
        console.log(`  [서비스] 보내는 사람 ATA: ${fromATA.address.toBase58()}`);

        // 받는 사람의 ATA 가져오기 또는 생성
        console.log("  [서비스] 받는 사람 ATA 확인/생성 중...");
        const toATA = await getOrCreateAssociatedTokenAccount(
            solana.connection,                // Connection 객체
            solana.serverKeypair,             // Payer (ATA 생성 비용 지불)
            mintPublicKey,                    // 토큰 민트 주소 (PublicKey)
            recipientPublicKey,               // ATA 소유자 (받는 사람 지갑)
            false,                            // allowOwnerOffCurve
            "confirmed",                      // commitment
            { commitment: "confirmed" }       // confirmOptions
        );
        console.log(`  [서비스] 받는 사람 ATA: ${toATA.address.toBase58()}`);

        // Anchor 프로그램 호출 Instruction 생성
        console.log("  [서비스] Anchor Instruction 생성 중...");
        const ix = await solana.program.methods
            .sendToken(transferAmountBN) // 프로그램의 sendToken 함수 호출, BN 값 전달
            .accounts({ // IDL에 정의된 계정 이름과 일치해야 함
                sourceAuthority: solana.serverKeypair.publicKey, // 보내는 사람 (서명 필요)
                sourceTokenAccount: fromATA.address,             // 보낼 토큰이 있는 계정
                destTokenAccount: toATA.address,                 // 받을 사람의 토큰 계정
                mint: mintPublicKey,                             // 토큰 민트 주소
                tokenProgram: TOKEN_PROGRAM_ID,                  // SPL 토큰 프로그램 ID
            })
            .instruction();

        // 트랜잭션 생성 및 Instruction 추가
        const transaction = new Transaction().add(ix);
        console.log("  [서비스] 트랜잭션 생성 완료");

        // 트랜잭션 전송 및 확인
        console.log("  [서비스] 트랜잭션 전송 및 확인 중...");
        const txSignature = await sendAndConfirmTransaction(
            solana.connection,                // Connection 객체
            transaction,                      // 실행할 트랜잭션
            [solana.serverKeypair],           // 서명자 목록 (서버 키페어)
            { commitment: "confirmed", skipPreflight: false } // 옵션
        );
        console.log(`  [서비스] 토큰 전송 성공. 서명: ${txSignature}`);
        return txSignature; // 성공 시 서명 반환

    } catch (error) {
        console.error("  [서비스 오류] SPL 토큰 전송 실패:", error);
        // 오류 발생 시 관련 정보 추가 로깅
        console.error(`  [서비스 오류 정보] mint: ${mintPublicKey?.toBase58()}, recipient: ${recipientPublicKey?.toBase58()}`);
        throw new Error(`토큰 전송 실패: ${error.message}`);
    }
};