import { PublicKey } from '@solana/web3.js'; // PublicKey 유효성 검사 등에 사용될 수 있음

export class NftTransferDto {
    /**
     * NFT를 받을 사람의 지갑 주소 (Base58 문자열)
     * @type {string}
     */
    recipientAddress;

    /**
     * 전송할 NFT의 민트 주소 (Base58 문자열)
     * @type {string}
     */
    nftMintAddress;

    /**
     * 생성자: 입력 데이터로부터 DTO 객체를 생성하고 기본적인 유효성 검사를 수행합니다.
     * @param {object} data - Express의 req.body 객체
     * @throws {Error} 필수 필드가 없거나 타입이 맞지 않으면 오류 발생
     */
    constructor(data) {
        if (!data || typeof data.recipientAddress !== 'string' || !data.recipientAddress) {
            throw new Error('Invalid request body: recipientAddress (string) is required.');
        }
        if (typeof data.nftMintAddress !== 'string' || !data.nftMintAddress) {
            throw new Error('Invalid request body: nftMintAddress (string) is required.');
        }

        // TODO: 필요시 여기에 추가적인 형식 검증 로직을 넣을 수 있습니다.
        // (예: 주소 길이 검사, Base58 형식 검사 등)
        // 하지만 PublicKey 객체 생성 가능 여부는 컨트롤러에서 확인하는 것이 더 일반적입니다.

        this.recipientAddress = data.recipientAddress;
        this.nftMintAddress = data.nftMintAddress;
    }

    /**
     * recipientAddress를 PublicKey 객체로 변환합니다.
     * @returns {PublicKey}
     * @throws {Error} 주소 형식이 잘못된 경우 오류 발생
     */
    getRecipientPublicKey() {
        try {
            return new PublicKey(this.recipientAddress);
        } catch (e) {
            throw new Error(`Invalid recipientAddress format: ${this.recipientAddress}`);
        }
    }

    /**
     * nftMintAddress를 PublicKey 객체로 변환합니다.
     * @returns {PublicKey}
     * @throws {Error} 주소 형식이 잘못된 경우 오류 발생
     */
    getNftMintPublicKey() {
        try {
            return new PublicKey(this.nftMintAddress);
        } catch (e) {
            throw new Error(`Invalid nftMintAddress format: ${this.nftMintAddress}`);
        }
    }
}