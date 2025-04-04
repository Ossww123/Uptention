import { PublicKey } from "@solana/web3.js";
import * as tokenService from '../../services/token/tokenService.js';
import { TokenTransferDto } from '../../models/token/TokenTransferDto.js';

/**
 * 토큰 전송 요청(application/json)을 처리하는 컨트롤러 함수 (TokenTransferDto 사용)
 */
export const transferToken = async (req, res) => {
    const startTime = Date.now();
    console.log('\n[컨트롤러: 토큰 전송 요청]', req.body);

    let transferDto;
    let recipientPublicKey;
    let parsedAmount;

    try {
        // 1. DTO 생성 및 기본 필드/타입 검증 (생성자에서 수행)
        transferDto = new TokenTransferDto(req.body);
        console.log('  [컨트롤러] Transfer DTO 생성 완료:', transferDto);

        // 2. PublicKey 생성 및 유효성 검증
        try {
            recipientPublicKey = new PublicKey(transferDto.recipientAddress);
        } catch (e) {
            console.error("  [컨트롤러 오류] 잘못된 recipientAddress 형식:", transferDto.recipientAddress);
            // DTO 생성 후 주소 형식 오류는 400 Bad Request
            return res.status(400).json({ success: false, error: '잘못된 recipientAddress 형식입니다.' });
        }

        // 3. Amount 파싱 및 유효성 검증 (양수 확인)
        // DTO 생성 시 기본적인 숫자 변환 가능성은 확인했으므로 parseFloat 진행
        parsedAmount = parseFloat(transferDto.amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            console.error("  [컨트롤러 오류] 잘못된 amount 값 (0 이하 또는 숫자 아님):", transferDto.amount);
            return res.status(400).json({ success: false, error: 'Amount는 0보다 큰 유효한 숫자여야 합니다.' });
        }
        console.log(`  [컨트롤러] 주소 및 금액 검증 완료: Recipient=${recipientPublicKey.toBase58()}, Amount=${parsedAmount}`);

        // 4. 서비스 호출 (PublicKey와 파싱된 숫자 amount 전달)
        // 서비스 함수는 이미 number 타입의 amount를 받도록 되어 있음
        console.log(`  [컨트롤러] tokenService.sendSplToken 호출 중...`);
        const transactionSignature = await tokenService.sendSplToken(recipientPublicKey, parsedAmount);
        console.log(`  [컨트롤러] 토큰 전송 서비스 호출 성공. Tx: ${transactionSignature}`);

        const endTime = Date.now();
        console.log(`  [컨트롤러] 처리 시간: ${(endTime - startTime) / 1000}s`);

        // 5. 성공 응답 전송
        res.json({
            success: true,
            message: "토큰 전송 성공!",
            transaction: `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
        });

    } catch (error) {
        // 6. 오류 처리 (DTO 생성 오류, PublicKey 변환 오류, 서비스 오류 등)
        console.error('  [컨트롤러 오류] 토큰 전송 실패:', error.message);
        const endTime = Date.now();
        console.log(`  [컨트롤러] 실패까지 걸린 시간: ${(endTime - startTime) / 1000}s`);

        // DTO 생성자 오류 또는 컨트롤러 레벨 유효성 검사 오류는 400
        // 서비스 레벨 오류는 500
        const statusCode = (error.message.includes('Invalid request body') || error.message.includes('잘못된') || error.message.includes('Amount는'))
                         ? 400
                         : 500;

        res.status(statusCode).json({
            success: false,
            error: error.message || "토큰 전송 중 오류가 발생했습니다."
        });
    }
};