import { PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { createGenericFile } from "@metaplex-foundation/umi";
import { getAssociatedTokenAddressSync, createAssociatedTokenAccountInstruction } from "@solana/spl-token";
import { solana, keyIds, appConfig } from '../../../config/solanaConfig.js';


/**
 * 컨트롤러로부터 받은 메타데이터 DTO 객체와 이미지 정보를 사용하여
 * 이미지를 업로드하고 NFT를 생성 및 민팅합니다. (multipart/form-data 처리 방식)
 * @param {import("../models/NftMetadataDto.js").NftMetadataDto} metadataDto - 파싱된 메타데이터 DTO 객체 ({name, description, attributes, symbol})
 * @param {Buffer} imageBuffer - 이미지 파일 데이터 버퍼.
 * @param {string} imageName - 원본 이미지 파일 이름.
 * @param {string} imageContentType - 이미지 파일의 MIME 타입.
 * @returns {Promise<object>} - 생성된 NFT 상세 정보를 포함하는 객체.
 * @throws {Error} - 생성 실패 시.
 */
export const createAndMintNft = async (metadataDto, imageBuffer, imageName, imageContentType) => {
    // DTO에서 메타데이터 필드 추출
    const { name, description, attributes, symbol: providedSymbol } = metadataDto;
    console.log(`  [서비스] NFT 생성 시작 (DTO 사용): ${name}`);

    const mintKeypair = Keypair.generate();
    console.log(`  [서비스] 새로운 Mint 주소: ${mintKeypair.publicKey.toBase58()}`);

    try {
        // 1. 이미지 업로드 (UMI 사용)
        console.log(`  [서비스] 이미지 업로드 중 (${imageName}, ${imageContentType}, ${imageBuffer.length} bytes)...`);
        const umiImageFile = createGenericFile(imageBuffer, imageName, { contentType: imageContentType });
        const [imageUri] = await solana.umi.uploader.upload([umiImageFile]);
        if (!imageUri) throw new Error("이미지 업로드 실패 또는 URI가 반환되지 않음.");
        console.log("  [서비스] 이미지 업로드 완료. URI:", imageUri);

        // 2. 최종 메타데이터 구성
        console.log("  [서비스] 최종 메타데이터 구성 중...");
        const finalMetadata = {
            name: name,
            symbol: providedSymbol || appConfig.NFT_DEFAULT_SYMBOL, // DTO의 symbol 또는 기본값 사용
            description: description,
            image: imageUri, // 업로드된 이미지 URI 사용
            attributes: attributes || [], // DTO의 attributes 또는 빈 배열
            properties: {
                files: [{ uri: imageUri, type: imageContentType }],
                category: "image",
            },
        };

        // 3. 메타데이터 JSON 업로드
        console.log("  [서비스] 메타데이터 JSON 업로드 중...");
        const metadataUri = await solana.umi.uploader.uploadJson(finalMetadata);
        if (!metadataUri) throw new Error("메타데이터 JSON 업로드 실패 또는 URI가 반환되지 않음.");
        console.log("  [서비스] 메타데이터 URI:", metadataUri);

        // 4. 파생 주소 계산 (PDA, ATA)
        console.log("  [서비스] 파생 주소 계산 중...");
        const [metadataPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), keyIds.TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()],
            keyIds.TOKEN_METADATA_PROGRAM_ID
        );
        const serverTokenAccount = getAssociatedTokenAddressSync(
            mintKeypair.publicKey,
            solana.serverKeypair.publicKey, // 서버 지갑으로 민팅
            false, keyIds.TOKEN_PROGRAM_ID, keyIds.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        console.log(`  [서비스] 메타데이터 PDA: ${metadataPDA.toBase58()}`);
        console.log(`  [서비스] 서버 ATA: ${serverTokenAccount.toBase58()}`);

        // 5. Anchor 프로그램 호출하여 생성 및 민팅
        console.log("  [서비스] Anchor 프로그램 호출 중: create_nft...");
        const txSignature = await solana.program.methods
            .createNft(finalMetadata.name, finalMetadata.symbol, metadataUri) // 최종 메타데이터 값 사용
            .accounts({
                authority: solana.serverKeypair.publicKey,
                mint: mintKeypair.publicKey,
                metadata: metadataPDA,
                tokenAccount: serverTokenAccount, // 서버의 ATA로 민팅
                systemProgram: keyIds.SYSTEM_PROGRAM_ID,
                tokenProgram: keyIds.TOKEN_PROGRAM_ID,
                associatedTokenProgram: keyIds.ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: keyIds.SYSVAR_RENT_PUBKEY,
                tokenMetadataProgram: keyIds.TOKEN_METADATA_PROGRAM_ID,
            })
            .signers([solana.serverKeypair, mintKeypair]) // 서버와 새로운 mint가 서명해야 함
            .rpc({ commitment: "confirmed" }); // 트랜잭션 실행

        console.log(`  [서비스] NFT 생성 및 민팅 성공. 서명: ${txSignature}`);

        // 결과 반환
        return {
            mintAddress: mintKeypair.publicKey.toString(),
            ownerAta: serverTokenAccount.toString(),
            metadataUri: metadataUri,
            imageUri: imageUri, // 업로드된 이미지 URI 반환
            metadata: finalMetadata, // 최종 사용된 메타데이터 반환
            transactionSignature: txSignature,
        };

    } catch (error) {
        console.error("  [서비스 오류] NFT 생성 실패:", error);
        // 구체적인 오류 메시지나 스택 트레이스를 포함하여 throw하는 것이 좋음
        throw new Error(`NFT 생성 실패: ${error.message}`);
    }
};

/**
 * 전달받은 메타데이터 DTO와 이미지 URI를 사용하여 메타데이터를 구성하고
 * NFT를 생성 및 민팅합니다. (이미지 업로드 과정 없음)
 * @param {import("../../models/nft/NftCreateWithUriDto.js").NftCreateWithUriDto} metadataDto - 컨트롤러에서 받은 요청 DTO 객체
 * @param {string} imageUri - 컨트롤러에서 결정한 사용할 이미지의 URI
 * @param {string} imageContentType - 컨트롤러에서 결정한 이미지의 MIME 타입
 * @returns {Promise<object>} - 생성된 NFT 상세 정보를 포함하는 객체
 * @throws {Error} - 생성 실패 시
 */
export const createAndMintNftWithUri = async (metadataDto, imageUri, imageContentType) => {
    // DTO에서 필요한 정보 추출
    const { name, description, attributes, symbol: providedSymbol } = metadataDto;
    console.log(`  [서비스] NFT 생성 시작 (URI 사용): ${name}`);

    // 새 민트 키페어 생성
    const mintKeypair = Keypair.generate();
    console.log(`  [서비스] 새로운 Mint 주소: ${mintKeypair.publicKey.toBase58()}`);

    try {
        // 1. 최종 메타데이터 객체 구성 (전달받은 값 사용)
        console.log("  [서비스] 최종 메타데이터 구성 중 (URI 사용)...");
        const finalMetadata = {
            name: name,
            symbol: providedSymbol || appConfig.NFT_DEFAULT_SYMBOL, // DTO의 symbol 또는 기본값
            description: description,
            image: imageUri, // <<< 전달받은 이미지 URI 사용
            attributes: attributes || [], // DTO의 attributes 또는 빈 배열
            properties: {
                files: [{ uri: imageUri, type: imageContentType }], // <<< 전달받은 정보 사용
                category: "image", // 일반적으로 이미지 카테고리
            },
        };

        // 2. 구성된 메타데이터 JSON을 Irys/Arweave에 업로드
        console.log("  [서비스] 메타데이터 JSON 업로드 중...");
        const metadataUri = await solana.umi.uploader.uploadJson(finalMetadata);
        if (!metadataUri) {
            throw new Error("메타데이터 JSON 업로드 실패 또는 URI가 반환되지 않음.");
        }
        console.log("  [서비스] 메타데이터 URI:", metadataUri);

        // 3. 필요한 계정 주소 계산 (Metadata PDA, 서버의 ATA)
        console.log("  [서비스] 파생 주소 계산 중...");
        const [metadataPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from("metadata"), keyIds.TOKEN_METADATA_PROGRAM_ID.toBuffer(), mintKeypair.publicKey.toBuffer()],
            keyIds.TOKEN_METADATA_PROGRAM_ID
        );
        const serverTokenAccount = getAssociatedTokenAddressSync(
            mintKeypair.publicKey,
            solana.serverKeypair.publicKey,
            false, keyIds.TOKEN_PROGRAM_ID, keyIds.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        console.log(`  [서비스] 메타데이터 PDA: ${metadataPDA.toBase58()}`);
        console.log(`  [서비스] 서버 ATA: ${serverTokenAccount.toBase58()}`);

        // 4. Anchor 프로그램 호출하여 NFT 생성 및 민팅
        console.log("  [서비스] Anchor 프로그램 호출 중: create_nft...");
        const txSignature = await solana.program.methods
            .createNft(finalMetadata.name, finalMetadata.symbol, metadataUri) // 최종 메타데이터 값 사용
            .accounts({
                authority: solana.serverKeypair.publicKey,
                mint: mintKeypair.publicKey,
                metadata: metadataPDA,
                tokenAccount: serverTokenAccount,
                systemProgram: keyIds.SYSTEM_PROGRAM_ID,
                tokenProgram: keyIds.TOKEN_PROGRAM_ID,
                associatedTokenProgram: keyIds.ASSOCIATED_TOKEN_PROGRAM_ID,
                rent: keyIds.SYSVAR_RENT_PUBKEY,
                tokenMetadataProgram: keyIds.TOKEN_METADATA_PROGRAM_ID,
            })
            .signers([solana.serverKeypair, mintKeypair]) // 서버와 새 민트 키페어 서명
            .rpc({ commitment: "confirmed" });

        console.log(`  [서비스] NFT 생성(URI) 및 민팅 성공. 서명: ${txSignature}`);

        // 5. 결과 반환 (컨트롤러에서 사용할 정보 포함)
        return {
            mintAddress: mintKeypair.publicKey.toString(),
            ownerAta: serverTokenAccount.toString(),
            metadataUri: metadataUri,
            imageUri: imageUri, // 실제 사용된 이미지 URI
            metadata: finalMetadata, // 최종 생성된 메타데이터
            transactionSignature: txSignature,
        };

    } catch (error) {
        console.error("  [서비스 오류] NFT 생성(URI) 실패:", error);
        throw new Error(`NFT 생성(URI) 실패: ${error.message}`);
    }
};

/**
 * 컨트롤러로부터 받은 PublicKey 객체를 사용하여 NFT를 전송합니다.
 * @param {PublicKey} nftMintPublicKey - 전송할 NFT의 민트 주소 PublicKey 객체
 * @param {PublicKey} recipientPublicKey - NFT를 받을 사람의 지갑 주소 PublicKey 객체
 * @returns {Promise<string>} - 트랜잭션 서명 문자열
 * @throws {Error} - 전송 실패 시
 */
export const transferNftToRecipient = async (nftMintPublicKey, recipientPublicKey) => {
    console.log(`  [서비스] NFT ${nftMintPublicKey.toBase58()} 를 ${recipientPublicKey.toBase58()} 로 전송 중`);
    const senderPublicKey = solana.serverKeypair.publicKey; // 보내는 사람 = 서버

    try {
        // 1. ATA (Associated Token Account) 주소 계산
        console.log("  [서비스] ATA 계산 중...");
        const sourceAta = getAssociatedTokenAddressSync(
            nftMintPublicKey, // NFT 민트 주소
            senderPublicKey,  // 현재 소유자 (서버)
            false,            // allowOwnerOffCurve (일반적으로 false)
            keyIds.TOKEN_PROGRAM_ID,
            keyIds.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        const destinationAta = getAssociatedTokenAddressSync(
            nftMintPublicKey,    // NFT 민트 주소
            recipientPublicKey, // 받을 사람 주소
            false,               // allowOwnerOffCurve
            keyIds.TOKEN_PROGRAM_ID,
            keyIds.ASSOCIATED_TOKEN_PROGRAM_ID
        );
        console.log(`  [서비스] 보내는 사람 ATA: ${sourceAta.toBase58()}`);
        console.log(`  [서비스] 받는 사람 ATA: ${destinationAta.toBase58()}`);

        // 2. 트랜잭션 구성
        console.log("  [서비스] 트랜잭션 구성 중...");
        const transaction = new Transaction();

        // 명령어 2.1: 받는 사람의 ATA 생성 (이미 존재하면 무시됨 - idempotent)
        // ATA 생성 비용은 보내는 사람(서버)이 지불
        transaction.add(
            createAssociatedTokenAccountInstruction(
                senderPublicKey,       // 지불자 (Payer)
                destinationAta,        // 생성할 ATA 주소
                recipientPublicKey,    // ATA의 소유자 (Owner)
                nftMintPublicKey,      // 해당 ATA가 연결될 민트 주소 (Mint)
                keyIds.TOKEN_PROGRAM_ID,
                keyIds.ASSOCIATED_TOKEN_PROGRAM_ID
            )
        );
        console.log("  [서비스] 명령어 추가: 목적지 ATA 생성");

        // 명령어 2.2: Anchor 프로그램의 send_nft 함수 호출
        transaction.add(
            await solana.program.methods.sendNft()
                .accounts({
                    sourceAuthority: senderPublicKey,      // 보내는 사람 (서명자)
                    sourceTokenAccount: sourceAta,         // 보낼 NFT가 있는 ATA
                    destTokenAccount: destinationAta,      // 받을 사람의 ATA
                    mint: nftMintPublicKey,                // NFT 민트 주소
                    tokenProgram: keyIds.TOKEN_PROGRAM_ID, // SPL 토큰 프로그램 ID
                })
                .instruction() // Instruction 객체만 가져옴
        );
        console.log("  [서비스] 명령어 추가: Anchor send_nft");

        // 3. 트랜잭션 전송 및 확인
        console.log("  [서비스] 트랜잭션 전송 중...");
        const txSignature = await sendAndConfirmTransaction(
            solana.connection,      // 솔라나 연결 객체
            transaction,            // 실행할 트랜잭션
            [solana.serverKeypair], // 서명자 목록 (서버 키페어)
            { commitment: 'confirmed', skipPreflight: false } // 확인 옵션
        );
        console.log(`  [서비스] NFT 전송 성공! 서명: ${txSignature}`);
        return txSignature; // 성공 시 트랜잭션 서명 반환

    } catch (error) {
        console.error("  [서비스 오류] NFT 전송 실패:", error);
        // 전송 실패 관련 특정 오류 메시지 확인 (디버깅 도움)
        if (error.message.includes("Source account owner is not matching") || error.message.includes("could not find account")) {
             console.error("  [서비스 힌트] 발생 가능한 문제: 서버가 이 NFT를 소유하지 않거나 소스 ATA가 잘못되었을 수 있습니다.");
        }
        // 컨트롤러로 오류 전파
        throw new Error(`NFT 전송 실패: ${error.message}`);
    }
};