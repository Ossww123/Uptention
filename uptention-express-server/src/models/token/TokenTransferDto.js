export class TokenTransferDto {
    /**
     * 토큰을 받을 사람의 지갑 주소 (Base58 문자열)
     * @type {string}
     */
    recipientAddress;

    /**
     * 전송할 토큰의 양 (숫자 또는 숫자로 변환 가능한 문자열).
     * 소수점 포함 가능 (예: "10.5", 10.5).
     * @type {string | number}
     */
    amount;

    /**
     * 생성자: 입력 데이터로부터 DTO 객체를 생성하고 기본적인 유효성 검사를 수행합니다.
     * @param {object} data - Express의 req.body 객체
     * @throws {Error} 필수 필드가 없거나 기본 타입/형식이 맞지 않으면 오류 발생
     */
    constructor(data) {
        // recipientAddress 필드 검증
        if (!data || typeof data.recipientAddress !== 'string' || !data.recipientAddress.trim()) {
            throw new Error('Invalid request body: recipientAddress (string) is required.');
        }

        // amount 필드 검증 (존재 여부 및 타입)
        if (data.amount === undefined || data.amount === null || data.amount === '') {
            throw new Error('Invalid request body: amount (string or number) is required.');
        }
        const amountType = typeof data.amount;
        if (amountType !== 'string' && amountType !== 'number') {
            throw new Error('Invalid request body: amount must be a string or a number.');
        }

        // amount가 문자열일 경우, 숫자로 변환 가능한지 미리 확인
        if (amountType === 'string') {
            // 비어있지 않고, 숫자로 변환 시 NaN이 아니어야 함
            if (!data.amount.trim() || isNaN(parseFloat(data.amount))) {
                throw new Error('Invalid request body: amount string must represent a valid number.');
            }
        }
        // amount가 숫자일 경우, 유효한 숫자인지 확인 (NaN 방지)
        else if (amountType === 'number' && isNaN(data.amount)) {
            throw new Error('Invalid request body: amount number must be valid (not NaN).');
        }

        this.recipientAddress = data.recipientAddress;
        // amount는 컨트롤러에서 parseFloat 후 양수 검증을 위해 원본 타입(string | number) 유지
        this.amount = data.amount;
    }
}