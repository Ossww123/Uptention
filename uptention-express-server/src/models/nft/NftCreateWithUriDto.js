export class NftCreateWithUriDto {
    /** @type {string} */
    rank;
    /** @type {string} */
    name;
    /** @type {string} */
    description;
    /** @type {Array<{trait_type: string, value: string | number}> | undefined} */
    attributes;
    /** @type {string | undefined} */
    symbol;

    /**
     * 생성자 및 기본 유효성 검사
     * @param {object} data req.body 객체
     */
    constructor(data) {
        if (!data || !data.rank || !data.name || !data.description) {
            throw new Error('Invalid request body: rank, name, description은 필수입니다.');
        }
        if (typeof data.rank !== 'string' || typeof data.name !== 'string' || typeof data.description !== 'string') {
             throw new Error('Invalid request body: rank, name, description은 문자열이어야 합니다.');
        }
        // attributes는 배열이거나 undefined/null 이어야 함
        if (data.attributes !== undefined && data.attributes !== null && !Array.isArray(data.attributes)) {
             throw new Error('Invalid request body: attributes는 배열이거나 생략해야 합니다.');
        }
         // symbol은 문자열이거나 undefined/null 이어야 함
        if (data.symbol !== undefined && data.symbol !== null && typeof data.symbol !== 'string') {
             throw new Error('Invalid request body: symbol은 문자열이거나 생략해야 합니다.');
        }

        this.rank = data.rank;
        this.name = data.name;
        this.description = data.description;
        this.attributes = data.attributes || []; // 없으면 빈 배열로 초기화
        this.symbol = data.symbol; // 없으면 undefined
    }
}