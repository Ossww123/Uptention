import fetch from 'node-fetch';

async function testTokenTransfer() {
    try {
        const response = await fetch('http://localhost:3000/api/transfer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipientAddress: "5y82zUq9ATKvQLKW45U9w6wDRFpBH5M9g2j116Xpa9Po",
                amount: 10000000
            })
        });

        const data = await response.json();
        console.log('응답:', data);

        if (response.ok) {
            console.log('✅ 테스트 성공!');
        } else {
            console.log('❌ 테스트 실패:', data.error);
        }
    } catch (error) {
        console.error('❌ 에러 발생:', error.message);
    }
}

testTokenTransfer(); 