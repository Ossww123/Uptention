import * as nftService from '../../services/nft/nftService.js';
import { NftMetadataDto } from '../../models/nft/NftMetadataDto.js';
import { NftTransferDto } from '../../models/nft/NftTransferDto.js';
import { NftCreateWithUriDto } from '../../models/nft/NftCreateWithUriDto.js';
import { appConfig } from '../../../config/solanaConfig.js';

/**
 * multipart/form-data 요청을 처리하여 NFT를 생성하는 컨트롤러 함수
 * (이미지 파일 + metadata JSON 문자열 필드)
 */

const PREDEFINED_IMAGE_INFO = {
    "1": { uri: "https://gateway.irys.xyz/Gxdtf2cbB8YQa6y4zZW3XZqAA17MVnfToVGMaAfzDqZc", contentType: "image/png" },
    "2": { uri: "https://gateway.irys.xyz/CYp9UvjbDJBLhRE3KBMxqmETCcaNT9mfqScVRreqbPot", contentType: "image/png" },
    "3": { uri: "https://gateway.irys.xyz/215o1LMXCX28KqXbFzmgpHKjZVLJiEQPz2LK7FnnCqKj", contentType: "image/png" }
};

export const createNft = async (req, res) => {
    const startTime = Date.now();
    const imageFieldName = appConfig.NFT_IMAGE_FIELD_NAME;
    const metadataFieldName = appConfig.NFT_METADATA_FIELD_NAME;
    console.log(`\n[컨트롤러: NFT 생성 요청 - FormData, Image Field: ${imageFieldName}, Metadata Field: ${metadataFieldName}]`);

    // 1. 입력 유효성 검사 (파일 및 메타데이터 필드)
    if (!req.file) {
        console.error(`  [컨트롤러 오류] 이미지 파일 누락 (${imageFieldName} 필드).`);
        return res.status(400).json({ success: false, error: `${imageFieldName} 파일은 필수입니다.` });
    }
    if (!req.body[metadataFieldName]) {
        console.error(`  [컨트롤러 오류] 메타데이터 필드 누락 (${metadataFieldName} 필드).`);
        return res.status(400).json({ success: false, error: `${metadataFieldName} 필드(JSON 문자열)는 필수입니다.` });
    }

    // 2. 메타데이터 파싱 및 DTO 생성
    let metadataDto;
    try {
        const parsedData = JSON.parse(req.body[metadataFieldName]);
        metadataDto = new NftMetadataDto(parsedData); // DTO 생성 및 기본 검증
        console.log('  [컨트롤러] 메타데이터 파싱 및 DTO 생성 완료:', metadataDto);
    } catch (e) {
        console.error(`  [컨트롤러 오류] ${metadataFieldName} 파싱 오류:`, e);
        return res.status(400).json({ success: false, error: `유효하지 않은 ${metadataFieldName} JSON 문자열입니다. ${e.message}` });
    }

    // 3. 파일 정보 추출
    const imageBuffer = req.file.buffer;
    const imageName = req.file.originalname;
    const imageContentType = req.file.mimetype;
    console.log(`  [컨트롤러] 이미지 정보: ${imageName} (${imageContentType}, ${imageBuffer.length} bytes)`);

    try {
        // 4. 서비스 호출 (파싱된 DTO와 파일 정보 전달)
        console.log(`  [컨트롤러] nftService.createAndMintNft 호출 중...`);
        const nftResult = await nftService.createAndMintNft(
            metadataDto,
            imageBuffer,
            imageName,
            imageContentType
        );
        console.log(`  [컨트롤러] NFT 생성 서비스 호출 성공. Mint: ${nftResult.mintAddress}`);

        const endTime = Date.now();
        console.log(`  [컨트롤러] 처리 시간: ${(endTime - startTime) / 1000}s`);

        // 5. 성공 응답 전송
        res.status(201).json({
            success: true,
            message: "NFT가 성공적으로 생성 및 민팅되었습니다!",
            mintAddress: nftResult.mintAddress,
            transaction: `https://explorer.solana.com/tx/${nftResult.transactionSignature}?cluster=devnet`
        });

    } catch (error) {
        // 6. 서비스 오류 처리
        console.error('  [컨트롤러 오류] NFT 생성 실패:', error.message);
        const endTime = Date.now();
        console.log(`  [컨트롤러] 실패까지 걸린 시간: ${(endTime - startTime) / 1000}s`);
        res.status(500).json({
            success: false,
            error: error.message || "NFT 생성 중 오류가 발생했습니다."
        });
    }
};

export const createNftWithUri = async (req, res) => {
    const startTime = Date.now();
    console.log(`\n[컨트롤러: NFT 생성 요청 - URI 사용] Body:`, req.body);

    let createDto;
    let imageInfo;

    try {
        // 1. 요청 본문으로부터 DTO 생성 및 유효성 검사
        createDto = new NftCreateWithUriDto(req.body);
        console.log('  [컨트롤러] CreateWithUri DTO 생성 완료:', createDto);

        // 2. 사용할 이미지 URI 및 Content-Type 결정 (예: rank 기반)
        // TODO: 실제 이미지 결정 로직 구현 (DB 조회, 설정 파일 읽기 등)
        imageInfo = PREDEFINED_IMAGE_INFO[createDto.rank] || PREDEFINED_IMAGE_INFO["default"];

        if (!imageInfo || !imageInfo.uri || !imageInfo.contentType) {
            console.error(`  [컨트롤러 오류] Rank '${createDto.rank}'에 해당하는 이미지 정보를 찾을 수 없습니다.`);
            // 적절한 rank 값이 아니면 400 오류 반환 가능
            return res.status(400).json({ success: false, error: `Rank '${createDto.rank}'에 대한 이미지 정보가 없습니다.` });
        }
        console.log(`  [컨트롤러] 사용할 이미지 정보: URI=${imageInfo.uri}, Type=${imageInfo.contentType}`);

        // 3. 서비스 호출 (DTO와 결정된 이미지 정보 전달)
        console.log(`  [컨트롤러] nftService.createAndMintNftWithUri 호출 중...`);
        // 서비스에는 DTO 객체와 결정된 이미지 URI, 타입을 전달
        const nftResult = await nftService.createAndMintNftWithUri(
            createDto,
            imageInfo.uri,
            imageInfo.contentType
        );
        console.log(`  [컨트롤러] NFT 생성(URI) 서비스 호출 성공. Mint: ${nftResult.mintAddress}`);

        const endTime = Date.now();
        console.log(`  [컨트롤러] 처리 시간: ${(endTime - startTime) / 1000}s`);

        // 4. 성공 응답 전송
        res.status(201).json({
            success: true,
            message: "NFT가 성공적으로 생성 및 민팅되었습니다 (URI 사용)!",
            mintAddress: nftResult.mintAddress,
            transaction: `https://explorer.solana.com/tx/${nftResult.transactionSignature}?cluster=devnet`
         });

    } catch (error) {
        // 5. 오류 처리 (DTO 생성, 이미지 결정, 서비스 오류 등)
        console.error('  [컨트롤러 오류] NFT 생성(URI) 실패:', error.message);
        const endTime = Date.now();
        console.log(`  [컨트롤러] 실패까지 걸린 시간: ${(endTime - startTime) / 1000}s`);
        // DTO 생성 오류 등은 400, 서비스 내부 오류는 500으로 구분 가능
        const statusCode = (error.message.includes('Invalid request body') || error.message.includes('이미지 정보가 없습니다')) ? 400 : 500;
        res.status(statusCode).json({
            success: false,
            error: error.message || "NFT 생성(URI) 중 오류 발생"
        });
    }
};

/**
 * NFT 전송 요청(application/json)을 처리하는 컨트롤러 함수 (NftTransferDto 사용)
 */
export const transferNft = async (req, res) => {
    const startTime = Date.now();
    console.log('\n[컨트롤러: NFT 전송 요청]', req.body);

    let transferDto;
    let recipientPublicKey;
    let mintPublicKey;

    try {
        // 1. DTO 생성 및 기본 필드 검증 (생성자에서 수행)
        transferDto = new NftTransferDto(req.body);
        console.log('  [컨트롤러] Transfer DTO 생성 완료');

        // 2. PublicKey 객체 생성 및 유효성 검증 (DTO 메서드 사용)
        recipientPublicKey = transferDto.getRecipientPublicKey();
        mintPublicKey = transferDto.getNftMintPublicKey();
        console.log(`  [컨트롤러] 주소 검증 완료: Recipient=${recipientPublicKey.toBase58()}, Mint=${mintPublicKey.toBase58()}`);

        // 3. 서비스 호출 (PublicKey 객체 전달)
        console.log(`  [컨트롤러] nftService.transferNftToRecipient 호출 중...`);
        const transactionSignature = await nftService.transferNftToRecipient(mintPublicKey, recipientPublicKey);
        console.log(`  [컨트롤러] NFT 전송 서비스 호출 성공. Tx: ${transactionSignature}`);

        const endTime = Date.now();
        console.log(`  [컨트롤러] 처리 시간: ${(endTime - startTime) / 1000}s`);

        // 4. 성공 응답 전송
        res.json({
            success: true,
            message: "NFT 전송 성공!",
            transaction: `https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
        });

    } catch (error) {
        // 5. 오류 처리 (DTO 생성 오류, PublicKey 변환 오류, 서비스 오류 등)
        console.error('  [컨트롤러 오류] NFT 전송 실패:', error.message);
        const endTime = Date.now();
        console.log(`  [컨트롤러] 실패까지 걸린 시간: ${(endTime - startTime) / 1000}s`);

        // DTO 생성자 오류 또는 PublicKey 변환 오류는 보통 400 Bad Request
        // 서비스 레벨 오류는 500 Internal Server Error
        const statusCode = (error.message.includes('Invalid request body') || error.message.includes('Invalid') && error.message.includes('format'))
                         ? 400
                         : 500;

        res.status(statusCode).json({
            success: false,
            error: error.message || "NFT 전송 중 오류가 발생했습니다."
        });
    }
};