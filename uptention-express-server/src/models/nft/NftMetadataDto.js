export class NftMetadataDto {
    /**
     * NFT 이름 (필수)
     * @type {string}
     */
    name;

    /**
     * NFT 설명 (필수)
     * @type {string}
     */
    description;

    /**
     * NFT 속성 배열 (선택 사항, 기본값: [])
     * @type {Array<{trait_type: string, value: string | number}>}
     */
    attributes;

    /**
     * NFT 심볼 (선택 사항, 미제공 시 서버 기본값 사용)
     * @type {string | undefined}
     */
    symbol;

    /**
     * 생성자 (타입 검증 또는 기본값 설정에 사용 가능)
     * @param {object} data - 파싱된 메타데이터 객체
     */
    constructor(data) {
        if (!data || typeof data.name !== 'string' || typeof data.description !== 'string') {
            throw new Error('Invalid metadata structure: name and description are required.');
        }
        this.name = data.name;
        this.description = data.description;
        this.attributes = Array.isArray(data.attributes) ? data.attributes : [];
        this.symbol = typeof data.symbol === 'string' ? data.symbol : undefined;

        // 추가적인 유효성 검사 로직 구현 가능
        // 예: attributes 내부 구조 검사 등
    }
}