# 업텐션

📈 업무의 텐션을 올리자 업텐션!

- **팀명**: 오뚝이
- **서비스명**: 업텐션(Utention)
- **개발 기간**: 2025.02.24 ~ 2025.04.11 (7주)
- **개발 인원**: 5명 (FE 2, BE 3)

![alt text](/assets/image-1.png)

<br>

# 목차

- [💡 기획 배경](#기획-배경)
- [✨ 서비스 주요 기능](#서비스-주요-기능)
- [📱 주요 화면 및 기능 소개](#주요-화면-및-기능-소개)
- [🔄 주요 서비스 흐름](#주요-서비스-흐름)
- [🛠️ 프로젝트 핵심 기술](#프로젝트-핵심-기술)
- [🏗️ 아키텍처](#아키텍처)
- [👥 팀원 소개](#팀원-소개)
- [⚙️ 기술 스택](#️-기술-스택)

<br>

# 💡기획 배경

현대의 직장인들은 다양한 환경 속에서 일하며 다음과 같은 어려움을 겪곤 합니다.

- 업무 중 스마트폰 사용으로 인해 **집중력이 흐트러지기 쉽고**,
- 성과를 내더라도 **즉각적으로 보상받기 어려우며**,
- 특히 산업 현장에서는 **스마트폰 사용이 안전사고로 이어질 수 있는 위험**도 존재합니다.

이런 문제들을 해결하고, 더 나은 업무 환경을 만들기 위해 저희는 “업텐션(Uptention)”을 기획했습니다.

업텐션은 사용자의 **집중 시간을 공정하게 측정하고**, **블록체인 기반의 투명한 보상**으로 연결함으로써, 누구나 자발적으로 몰입할 수 있는 건강한 근무 문화를 만들어갑니다.

<br>

# ✨서비스 주요 기능

### 1. 집중 모드 앱 사용 제한

- 회사 반경 내에서만 작동하는 **위치 기반 집중 모드**
- 업무와 무관한 앱 사용을 자동으로 제한

### 2. 집중 시간에 따른 토큰 보상

- 집중한 시간만큼 **솔라나 블록체인 기반 토큰** 자동 지급
- Phantom 지갑과 연동되어 **보상이 투명하게 관리**

### 3. 복지 마켓

- 받은 토큰으로 **실제 상품을 구매**할 수 있는 복지 마켓 운영
- 동료에게 선물도 가능해, **조직 내 소통과 유대감도 향상**

### 4. 우수사원 NFT 발급

- 한 주 동안 집중도가 높은 **우수사원 TOP 3에게 특별 NFT 발급**
- 1주일 동안 유효한 이 NFT는 **성과의 상징이자 추가 보상의 기회**

### 5. 실시간 알림 기능

- **FCM(Firebase Cloud Messaging)** 기반의 알림 시스템
- 선물 수령, 우수사원 선정 등 **중요 이벤트를 놓치지 않도록** 안내

<br>

# 📱주요 화면 및 기능 소개

### 1. **앱 제한 화면**
- 집중 모드 시 업무와 무관한 앱 자동 차단
- 실시간 앱 사용 제한 상태 표시

<img src="/assets/집중모드.gif" width="300" alt="집중모드">
        
### 2. **대시보드**
- 누적 집중 시간, 토큰 수, 활동 이력 등 **주요 정보 시각화**
- 주간 랭킹, 우수사원 등 **성과 요약 제공**
        
<img src="/assets/대시보드.gif" width="300" alt="대시보드">
        
### 3. **상점 조회**
- **무한 스크롤**을 통한 상품 목록 탐색
- **8가지 카테고리 필터** 지원
- 인기순/최신순 등 **상품 정렬 기능 제공**
    
<div style="display: flex; gap: 10px; flex-wrap: wrap;">
  <img src="/assets/상품-무한스크롤-조회.gif" width="200" alt="상품 무한스크롤 조회">
  <img src="/assets/상품-카테고리-8개.gif" width="200" alt="상품 카테고리 8개">
  <img src="/assets/상품-정렬-조건.gif" width="200" alt="상품 정렬 조건">
</div>
    
### 4. **상품 구매**
- **장바구니 담기 및 일괄 구매**
- **즉시 구매** 기능
- **배송지 등록/관리**
- **동료에게 선물하기** 기능 지원
    
<div style="display: flex; gap: 10px; flex-wrap: wrap;">
  <img src="/assets/장바구니-구매-배속.gif" width="200" alt="장바구니 구매">
  <img src="/assets/선물하기-결제.gif" width="200" alt="선물하기 결제">
  <img src="/assets/상품-바로구매.gif" width="200" alt="상품 바로구매">
  <img src="/assets/장바구니-조회.gif" width="200" alt="장바구니 조회">
</div>
    
### 5. **구매 내역 조회**
- 이전 주문 내역과 **배송 상태 확인 가능**
        
<img src="/assets/주문내역-조회.gif" width="300" alt="주문내역 조회">
        
### 6. **알림**
- 선물 수령, 우수사원 선정 등 **이벤트 중심의 실시간 알림**
        
<img src="/assets/FCM-알림-조회.gif" width="300" alt="FCM 알림 조회">
        
### 7. **선물함 조회 및 수령**
- 받은 선물 목록 조회
- **선물 수령 및 배송 요청 기능**
    
<img src="/assets/상품-수령하기-배속.gif" width="300" alt="상품 수령하기">
    
### 8. **NFT 조회**
- 발급받은 **우수사원 NFT 확인 및 상태 조회**
        
<img src="/assets/NFT-조회.gif" width="300" alt="NFT 조회">

<br>        

# 🔄주요 서비스 흐름

![alt text](/assets/image-2.png)

![alt text](/assets/image-3.png)

![alt text](/assets/image-4.png)

<br>

# 🛠️프로젝트 핵심 기술

## FE 핵심 기술

<details>
<summary><strong>FlatList, Scroll View 무한 스크롤</strong></summary>

ScrollView는 모든 컴포넌트를 한 번에 렌더링하여 메모리 사용량이 높지만 커스터마이징이 자유롭고, FlatList는 화면에 보이는 부분만 렌더링하여 대용량 데이터를 효율적으로 처리합니다. 

이에 마켓 섹션은 FlatList를 활용하여 대량의 상품 정보를 최적화했고, 선물함 섹션은 ScrollView를 사용하여 유연한 레이아웃을 구현했습니다. 각 섹션의 특성에 맞는 컴포넌트 선택으로 앱의 성능과 사용자 경험을 향상시켰습니다.

</details>

<details>
<summary><strong>연결된 지갑을 통한 잔액 확인 및 트랜잭션 상태 추적</strong></summary>

WebSocket 연결을 통해 실시간 데이터를 처리하고 트랜잭션 메모에 orderId를 삽입하여 트랜잭션을 추적하는 시스템을 구현했습니다. 

Solana DevNet과의 연결로 사용자의 잔액 변화를 실시간 모니터링하고, @solana/web3.js의 onAccountChange 메서드로 계정 상태 변화를 감지했습니다. 

구독 관리 시스템을 구축하여 메모리 누수를 방지하고 성능을 최적화했으며, WebSocket 연결의 안정성을 유지하기 위한 재연결 메커니즘을 도입했습니다.

</details>

<details>
<summary><strong>민감한 데이터 안전하게 저장하며 암호화된 통신 채널 구축하기</strong></summary>

민감한 지갑 데이터를 안전하게 보호하기 위해 포괄적인 보안 시스템을 구축했습니다. AsyncStorage에 지갑 정보를 암호화하여 저장하고 bs58 인코딩으로 데이터를 보호했으며, 연결 해제 시 clearWalletInfo() 함수로 정보를 완전히 제거했습니다. 

통신 보안을 위해 Tweetnacl 라이브러리 기반의 end-to-end 암호화와 공개키/개인키 시스템을 구현했고, Deep Link를 통해 안전한 지갑 연결 프로세스를 제공했습니다.

</details>

<details>
<summary><strong>앱 제한 기능 구현을 위한 코틀린 사용</strong></summary>

Android의 AccessibilityService를 활용하여 실행 앱을 실시간으로 감지하고 필수 앱 목록 기반의 차단 시스템을 구축했습니다. 

중복 차단을 방지하고 AlertDialog와 오버레이를 통해 사용자에게 알림을 제공하며, 차단 시 홈 화면으로 자동 리다이렉트 했습니다. 

SharedPreferences로 앱 상태를 관리하고 React Native 연동을 위한 네이티브 모듈을 구현하여 JavaScript 레이어에서도 제어할 수 있도록 했습니다.

</details>

<details>
<summary><strong>Phantom Wallet Deep Link</strong></summary>

expo-linking 라이브러리를 활용하여 iOS/Android 플랫폼별 URL 스키마를 구축하고, 앱 시작 시 Deep Link 이벤트를 모니터링 했습니다. 

암호화된 공개키와 Devnet 클러스터 설정으로 보안을 강화했으며, Phantom Wallet 인증 후 앱 복귀를 위한 리다이렉트 시스템을 구현했습니다. 각 플랫폼에 맞는 URL 스키마로 암호화된 트랜잭션을 처리하고 서명 후 안전한 앱 복귀 flow를 제공했습니다.

</details>

## BE 핵심 기술

<details>
<summary><strong>무한 스크롤을 위한 커서 기반 페이지네이션</strong></summary>

### 도입 배경
모바일 앱 사용자 경험을 고려하여, 상품 목록에 무한 스크롤 UI 적용이 필요함

오프셋 방식은 대량 데이터에서 성능 저하가 심각하여 커서 기반 방식으로 설계

### 구현 방식
- QueryDSL로 정렬 조건, 필터링, 검색 등 동적 쿼리 처리
- 커서 기반 페이지네이션을 통해 마지막 항목 기준으로 다음 데이터 조회
- 단순 목록 조회는 JPQL로 경량화 처리

### 성능 비교 테스트 결과
더미 데이터 100만 개 기준,

오프셋 방식은 페이지가 깊어질수록 응답 시간이 기하급수적으로 증가,

커서 방식은 **모든 페이지에서 1초 이내의 응답 시간 유지**

</details>

<details>
<summary><strong>상품 결제 전 2단계 상품 검증 절차</strong></summary>

### 도입 배경
관리자가 상품의 가격/재고를 실시간으로 수정 가능하며,

장바구니 > 주문서 > 결제 과정 중 정보 불일치 가능성이 존재

### 검증 절차
1. **주문서 생성 시점 검증**
   - 상품 가격, 재고, 삭제 여부 확인
   - 유효하지 않으면 예외 처리
2. **결제 직전 검증**
   - 실시간 재고 수량 및 상태 재확인
   - 결제 시점 기준으로 최종 검증

</details>

<details>
<summary><strong>블록체인 기반 트랜잭션 감지 및 주문 검증</strong></summary>

### 도입 배경
사용자 결제는 Solana 블록체인을 통해 이루어지며, 온체인 상에서 결제 완료 여부를 실시간으로 감지하고, 외부 시스템과 연동하여 주문 처리까지 자동화할 필요가 있었음.

### 구현 방식
- WebSocket 기반으로 Solana 트랜잭션 로그를 구독하여 실시간으로 결제 내역 감지
- 트랜잭션 로그 내 특정 형식으로 포함된 주문 ID를 파싱하여 해당 결제와 주문 간의 매핑 수행
- 메모리 기반 캐시를 활용하여 중복 주문 처리 방지 및 상태 동기화 유지
- 트랜잭션 서명(signature)을 통해 Solana RPC로 거래 상세 정보를 조회하고, 수신 계정, 금액, 토큰 종류 등 주요 항목을 기준으로 결제 유효성 검증
- 검증 완료 후 주문 상태를 '결제 완료'로 자동 반영하고, 실패 시 사용자에게 알림 발송

</details>

<details>
<summary><strong>RabbitMQ 기반 비동기 결제 처리</strong></summary>

### 도입 배경
결제 처리의 지연이나 실패가 전체 서비스에 영향을 주지 않도록, 핵심 로직과 분리된 비동기 처리가 필요했음.

RabbitMQ는 push 기반의 즉시성, 간편한 설정, 유연한 라우팅을 제공해 블록체인 트랜잭션의 실시간 반영과 후속 로직 분산 처리에 적합하다고 판단함.

### 구현 방식
- 결제 성공 또는 실패 시, 해당 이벤트를 **RabbitMQ 메시지로 발행**
- 메시지를 수신한 소비자는 다음과 같은 **후속 작업을 비동기로 처리**
  - 주문 상태 변경
  - 재고 차감
  - 판매량 증가 등

### 메시지 브로커 구조
- `Exchange`와 `Queue`를 활용해 메시지를 안정적으로 라우팅
- **토픽 기반의 구독 방식**을 사용해 이벤트 유형에 따라 필요한 서비스만 메시지를 수신
- 메시지 처리 실패 시 **자동 재시도 및 DLQ(Dead Letter Queue)**를 통한 복구 가능성 확보

</details>

<details>
<summary><strong>Redis 기반 재고 관리</strong></summary>

### 도입 배경
- 동시 주문 처리 시 데이터베이스 부하 감소 및 응답 시간 개선 필요
- 재고 관련 빈번한 읽기/쓰기 작업의 성능 최적화

### 구현 내용
- Redis에 재고 정보(총수량, 예약수량, 가용수량) 캐싱
- 캐시 미스 시 데이터베이스 자동 초기화 메커니즘 구현
- 개별 및 다중 상품 조회/예약/확정/취소 작업 지원

</details>

<details>
<summary><strong>Redisson을 활용한 분산 환경 동시성 제어</strong></summary>

### 도입 배경
- 다중 서버 환경에서 동일 상품 재고 조작 시 데이터 일관성 확보
- 분산 락을 통한 안전한 재고 예약/확정/취소 작업 보장

### 구현 내용
- 개별 상품 작업 시 RLock 활용한 상품별 락 획득
- 다중 상품 작업 시 RedissonMultiLock으로 원자적 락 처리
- 락 획득 대기 시간(3초)과 유지 시간(5초) 설정으로 교착상태 방지
- 락 획득 실패 및 예외 상황에 대한 명확한 오류 처리

</details>

<details>
<summary><strong>분산 환경에서의 스케줄러 작업 관리</strong></summary>

### 도입 배경
- 다중 서버 환경에서 중복 스케줄러 실행 방지
- 정기적인 배치 작업의 안정적 수행 보장

### 구현 내용
- DistributedLockManager 클래스를 통한 작업별 분산 락 적용
- 각 스케줄러 작업마다 고유 락 키 부여(예: scheduler:inventory)
- 락 획득 실패 시 작업 미실행으로 중복 방지

### 주요 적용 사례
- 재고 정보 DB 동기화 작업 (5분 주기)
- 결제 대기 주문 타임아웃 체크 (1분 주기)
- 블록체인 트랜잭션 모니터링 관련 작업
- 마이닝 타임 업데이트 (매일 23:30)

</details>

<details>
<summary><strong>비동기 푸시 알림 시스템</strong></summary>

### 도입 배경
- 사용자 경험 향상을 위한 실시간 알림
- 알림 전송이 주요 비즈니스 로직을 지연시키지 않도록 설계

### 구현 방식
- Spring의 @Async 어노테이션과 전용 ThreadPool 구성
- 계층적 비동기 처리로 효율적인 알림 전송:
  - FcmSendServiceImpl: 사용자의 모든 기기 알림 처리
  - FcmInnerServiceImpl: 개별 토큰 기반 FCM 메시지 전송
- Firebase Cloud Messaging 연동을 통한 모바일 푸시 알림 지원

</details>

<details>
<summary><strong>Lambda@Edge, CloudFront, S3를 활용한 이미지 최적화</strong></summary>

### 도입 배경
- 원본 이미지로 인한 페이지 로딩 속도 저하 문제
- 디바이스 화면 크기에 맞는 동적 이미지 리사이징 필요
- S3 저장소 직접 접근 방지를 통한 보안 강화

### 구현 방식
- S3에 원본 이미지 저장 후 CloudFront를 통한 간접 접근 구조 구축
- Lambda@Edge를 CloudFront의 Origin Response 트리거에 연결
- URL 쿼리 파라미터를 통한 동적 이미지 변환:
  - `?w=800&h=600&t=cover&f=webp` 형식으로 크기, 피팅 타입, 포맷 지정
- S3에서 반환된 원본 이미지를 Lambda@Edge에서 처리 후 CloudFront 캐시에 저장

### 성능 향상 결과
- 1000x1000 원본 이미지(2MB)가 모바일 화면용(w=400)으로 변환 시 평균 85% 용량 감소
- WebP 변환 옵션 사용 시 동일 품질 대비 추가 30% 용량 감소 효과

</details>

<details>
<summary><strong>Spring Security 기반 역할별 인증 체계</strong></summary>

### 구현 목표
- 회원과 관리자의 로그인 경로 분리
- 사용자 상태에 따른 세밀한 접근 제어

### 구현 내용
- CustomAuthenticationToken으로 로그인 유형 구분
- CustomAuthenticationProvider에서 유형별 권한 검증
- 논리 삭제된 사용자 로그인 시도 차단
- 사용자 역할(ROLE_MEMBER, ROLE_TEMP_MEMBER, ROLE_ADMIN)에 따른 접근 제어

</details>

<details>
<summary><strong>순환 의존성 방지를 위한 퍼사드 패턴 도입</strong></summary>

### 도입 배경
- 복잡한 비즈니스 로직의 모듈화 및 테스트 용이성 확보
- 순환 의존성 방지를 통한 아키텍처 견고성 강화

### 구현 내용
- 서비스 계층을 Application Service와 Domain Service로 명확히 분리
- 계층 간 단방향 의존성 원칙 적용:
  - Presentation 계층 → Application Service 계층
  - Application Service 계층 → Domain Service 계층
- 동일 계층 간 직접적인 의존성 제거
- Application Service가 퍼사드로서 복잡한 Domain Service 로직을 캡슐화

### 아키텍처 이점
- 관심사 분리를 통한 코드 가독성 및 유지보수성 향상
- 도메인 로직 재사용성 증대
- 테스트 격리성 확보로 단위 테스트 품질 향상
- 변경 영향 범위 최소화를 통한 안정적인 기능 확장

</details>

<details>
<summary><strong>TDD 테스트 전략 도입</strong></summary>

핵심 로직 안정성 확보를 위해 **도메인 서비스 중심의 TDD 설계** 적용

### 테스트 계층별 전략
- Repository: `@DataJpaTest` + `RepositoryTestSupport`
- Domain Service: `Mockito` 기반 단위 테스트
- Application Service: `@SpringBootTest` + `ServiceTestSupport` 통한 통합 테스트

### 테스트 원칙
- **추상 테스트 지원 클래스**를 통한 공통 설정 및 유틸리티 제공
- 예외 테스트는 발생 지점만 검증, 전파/변환은 분리 테스트 원칙 적용
- **Happy Path + 예외 경로** 병행 검증으로 신뢰도 확보

</details>

## 블록체인 핵심 기술

<details>
<summary><strong>Solana/Anchor와의 연동</strong></summary>

`@solana/web3.js`, `@project-serum/anchor` 등 공식 JS SDK를 사용하여 Anchor에서 자동 생성된 IDL를 그대로 사용할 수 있도록 구현했습니다.

</details>

<details>
<summary><strong>트랜잭션 생성 및 서명 처리 간소화</strong></summary>

Wallet adapter, Keypair 등과 직접 연동하여 트랜잭션 생성부터 서명, 전송까지 모두 JS 라이브러리를 이용해 간단하게 처리했습니다.

</details>

<details>
<summary><strong>Anchor 프레임워크의 구조화된 설계 활용</strong></summary>

`#[program]`, `#[derive(Accounts)]`, `Context<...>` 등 Anchor의 문법을 활용하여 함수, 계정, CPI 호출을 간소화하고, 계정 관계를 선언적으로 명시하여 관리했습니다.

</details>

<details>
<summary><strong>Metaplex Metadata 통합</strong></summary>

NFT 생성 시 메타데이터를 포함한 Token Metadata 프로그램을 활용하여 표준 호환성을 보장했습니다.

</details>

<details>
<summary><strong>CPI(Context, CpiContext) 활용한 외부 프로그램 호출</strong></summary>

SPL Token과 Metaplex Token Metadata 프로그램을 `CpiContext`로 명확하게 호출하여 Anchor가 CPI에서 요구하는 권한/계정 체크를 자동 처리하도록 구현했습니다.

</details>

<details>
<summary><strong>제약조건 매크로 및 seeds 사용</strong></summary>

`seeds`, `bump`, `init_if_needed` 등의 Anchor 매크로를 적극 활용하여 계정의 존재 여부, 생성 방식, PDA 주소 계산까지 자동화했습니다.

</details>

<details>
<summary><strong>사용자 중심 설계(로열티 없음, collection/uses 없음)</strong></summary>

선택적으로 `DataV2` 필드를 구성하여 불필요한 구조를 생략하고 트랜잭션 크기를 최적화했습니다.

</details>

## 인프라 핵심 기술

<details>
<summary><strong>DooD 방식의 Jenkins CI/CD</strong></summary>

### 도입 배경
- 컨테이너화된 빌드/배포 환경 구성 필요
- 별도의 Docker 설치 없이 호스트의 Docker 엔진 활용 목표

### 구현 방식
- Docker outside of Docker(DooD) 패턴 적용
  - `/var/run/docker.sock` 소켓을 Jenkins 컨테이너에 직접 마운트
  - 커스텀 Jenkins 이미지에 Docker CLI 설치 (jenkins/jenkins:2.502 기반)
- Docker Compose를 통한 Jenkins 컨테이너 관리
  - 볼륨 마운트로 Jenkins 데이터 영속성 보장
  - 내부 네트워크 구성으로 보안 강화
- 핵심 파이프라인 단계
  1. Git 저장소 클론
  2. Gradle 기반 애플리케이션 빌드
  3. Docker 이미지 빌드 및 Docker Hub 푸시
  4. SSH를 통한 EC2 서버 원격 배포

### 주요 이점
- Jenkins Credentials로 20개 이상의 민감 정보 안전하게 관리
- 독립된 컨테이너 환경으로 빌드 의존성 문제 해결
- Mattermost 알림 연동으로 배포 결과 실시간 공유

</details>

<details>
<summary><strong>프론트엔드 정적 배포 파이프라인</strong></summary>

### 도입 배경
- SPA 기반 프론트엔드의 효율적인 빌드 및 배포 자동화 필요
- 정적 파일 배포를 위한 간소화된 프로세스 구축 요구

### 구현 방식
- 임시 컨테이너를 활용한 정적 파일 배포 전략
  - 빌드된 정적 파일을 호스트 볼륨에 복사하는 일회성 컨테이너 활용
  - 컨테이너 실행 후 자동 종료되는 효율적 리소스 관리
- 파이프라인 핵심 단계
  1. Git 저장소 클론 (fe-web 브랜치)
  2. Node.js 환경에서 프론트엔드 빌드
  3. 정적 파일 업데이트용 임시 Docker 이미지 생성
  4. 호스트 볼륨에 빌드 결과물 복사 및 Nginx 서빙

### 주요 이점
- 서버 재시작 없이 정적 리소스 즉시 갱신
- Nginx가 직접 정적 파일을 서빙하여 성능 최적화
- Mattermost 알림으로 빌드 결과 실시간 공유

</details>

<details>
<summary><strong>Nginx Reverse Proxy, Docker 내부 네트워크를 이용한 보안 향상</strong></summary>

### 도입 배경
- 다양한 백엔드 서비스의 통합 접근점 필요
- 내부 서비스 직접 노출 방지를 통한 보안 강화
- SSL/TLS 인증서 중앙 관리 요구

### 구현 방식
- Nginx 리버스 프록시 설정
  - 모든 외부 요청을 단일 진입점에서 필터링 및 라우팅
  - 경로 기반 라우팅으로 요청을 적절한 내부 서비스로 전달
    - `/api/*` → Spring 백엔드 서비스
    - `/sol/api/*` → Express 서버
    - `/jenkins/*` → Jenkins 서비스
  - HTTP → HTTPS 자동 리디렉션으로 암호화 통신 강제
- Docker 네트워크 격리
  - `uptention_network` 외부 네트워크로 서비스 간 통신 제한
  - 컨테이너 간 통신은 내부 네트워크만 사용, 포트 노출 최소화
  - 서비스별 컨테이너명으로 DNS 조회 (IP 대신 서비스명 사용)
- 보안 강화 조치
  - 악의적 접근 패턴 차단 (환경 파일, 백업 파일 등 접근 시도)
  - 클라이언트 요청 크기 제한 (25MB)
  - `server_tokens off`로 Nginx 버전 정보 숨김

### 주요 이점
- 단일 SSL 인증서 관리로 모든 서비스 HTTPS 지원
- 내부 서비스 직접 접근 차단으로 공격 표면 감소
- 중앙화된 요청 처리로 모니터링 및 로깅 단순화

</details>

<details>
<summary><strong>모니터링 인프라 구축</strong></summary>

### 도입 배경
- 서버 이상 징후 및 비정상 접근 실시간 감지 필요
- 로그 분석을 통한 보안 위협 모니터링 요구
- 애플리케이션 성능 메트릭의 시각화된 관리 필요

### 구현 방식
- 메트릭 수집 파이프라인
  - Prometheus를 중심으로 한 메트릭 수집 시스템
  - Node Exporter로 서버 리소스(CPU, 메모리, 디스크 I/O) 모니터링
  - Nginx Exporter로 웹 서버 성능(활성 연결, 처리된 요청 수) 추적
  - Spring Boot Actuator로 애플리케이션 성능(API 응답 시간, JVM 상태) 측정
- 로그 수집 파이프라인
  - Loki를 중앙 로그 저장소로 활용한 통합 로그 분석 체계
  - Promtail로 Nginx 접근 로그 수집하여 보안 위협(`.env`, `wp-config.php` 등) 감지
  - Spring Boot 애플리케이션 로그를 JSON 형식으로 구조화하여 오류 및 성능 이슈 추적
  - LogQL 쿼리로 IP 기반 접근 패턴 및 비정상 요청 실시간 필터링
- Grafana 대시보드 구성
  - Node Exporter Full(ID: 1860)로 서버 자원 상태 모니터링
  - Nginx Prometheus Exporter(ID: 12708)로 웹 트래픽 추이 파악
  - Spring Boot Observability(ID: 17175)로 API 성능 및 오류율 분석
  - 커스텀 로그 패널로 보안 위협 시도 실시간 집계 및 시각화

### 주요 개선점
- 보안 위협 접근 시도 실시간 탐지 및 시각화
- 시스템 부하, 응답 시간 등 성능 지표 추이 분석 가능

</details>

<details>
<summary><strong>Fail2Ban을 활용한 위험 IP 자동 차단</strong></summary>

### 도입 배경
- Grafana 모니터링에서 발견된 다수의 보안 위협 요청 패턴
- 수작업으로 IP 차단 스크립트 작성의 비효율성
- 24시간 모니터링 불가능으로 인한 사각지대 발생

### 구현 방식
- Fail2Ban과 Nginx 통합 설정
  - 의심스러운 URL 패턴(`/.env`, `wp-config.php` 등) 감지 필터 구성
  - 로그 기반 자동 차단을 위한 커스텀 필터 정규표현식 작성
  - Docker 환경에서 효과적인 차단을 위한 DOCKER-USER 체인 적용
- 효율적인 차단 정책 설정
  - 1회 위반 시 즉시 차단 (`maxretry=1`)
  - 1시간 차단 유지 (`bantime=3600`)
  - 의심 URL 접근 시 429(Too Many Requests) 응답 반환

### 트러블슈팅 및 개선점
- 일반적인 iptables INPUT 체인 적용 시 Docker 컨테이너 트래픽 차단 실패
- 원인: Docker는 자체 네트워크 네임스페이스 사용으로 INPUT 체인 규칙 우회
- 해결: DOCKER-USER 체인 지정으로 컨테이너 트래픽에도 차단 규칙 적용
- 포트 지정 방식 변경: "http,https" → "80,443" 명시적 포트 번호 사용

### 주요 성과
- 수작업 차단에서 자동화된 보안 체계로 전환
- 관리자 개입 없이 24시간 위험 IP 실시간 차단
- 기존 모니터링 시스템과 연계한 통합 보안 강화

</details>

<details>
<summary><strong>블루/그린 방식의 무중단 배포</strong></summary>

### 도입 배경
- 서비스 다운타임 없는 무중단 배포 필요성
- 배포 실패 시 즉각적인 롤백 메커니즘 요구
- 새 버전 안정성 검증 후 트래픽 전환 필요

### 구현 방식
- 컬러 기반 컨테이너 구분 시스템
  - 블루/그린 명명 규칙으로 현재 운영 중인 컨테이너와 새 컨테이너 구분
  - 현재 운영 컨테이너 확인: `docker ps -q -f name=uptention-spring-container-blue`
  - 자동 색상 전환 로직으로 항상 반대 색상에 신규 배포
- 안전한 전환 프로세스
  - 신규 컨테이너 배포 및 모든 환경 변수 설정 완료
  - Spring Boot Actuator 기반 30회 헬스 체크 통과 후 트래픽 전환
  - Nginx upstream 동적 재구성으로 트래픽 즉시 전환
- 모니터링 통합
  - Prometheus 타겟 자동 업데이트로 신규 컨테이너 모니터링 연속성 확보
  - 이전 컨테이너 중지 및 삭제 전 트래픽 완전 전환 확인

### 주요 이점
- 무중단 배포로 사용자 경험 향상
- 신규 버전 문제 발생 시 즉시 이전 버전으로 롤백 가능
- Jenkins 파이프라인과 완전 통합된 자동화 배포 체계

</details>

<details>
<summary><strong>AI 기반 코드 리뷰 시스템 구축</strong></summary>

### 도입 배경
- 개발 속도 향상을 위한 코드 리뷰 자동화 필요성
- 품질 표준 준수 여부 객관적 검증 요구
- 인적 리소스 한계로 인한 리뷰 병목 현상 해소

### 구현 방식
- GitLab Webhook 기반 자동화 아키텍처
  - MR 코멘트에 "/review_gpt" 명령어 감지 시스템
  - Flask 웹 서버로 Webhook 이벤트 수신 및 처리
  - 도커 컨테이너화로 배포 및 관리 용이성 확보
- 지능형 코드 분석 파이프라인
  - GitLab API를 통한 MR diff 추출 및 전처리
  - OpenAI GPT-4o-mini 모델 활용한 코드 분석
  - 아키텍처, 보안, 클린 코드 관점의 포괄적 리뷰 제공
- 인프라 안정성 강화
  - Gunicorn 서버로 Flask 애플리케이션 안정적 운영
  - 타임아웃 120초 설정으로 대규모 MR 처리 지원
  - Nginx 리버스 프록시로 보안 강화 및 트래픽 관리

### 주요 성과
- 명령어 한 줄로 수 분 내 전문적 코드 리뷰 확보
- 표준화된 분석으로 코드 품질 일관성 향상
- 개발자 간 지식 공유 및 학습 효과 증대

</details>

<br>

# 🏗️아키텍처

### 서비스 아키텍처

![alt text](/assets/image-5.png)


### CI/CD 아키텍처

![alt text](/assets/image-6.png)

### 모니터링 아키텍처

![alt text](/assets/image-7.png)

<br>

# 👥팀원 소개

| 🧑‍💻 **이름** | 🏆 **역할** | 🚀 **깃허브** |
| --- | --- | --- |
| 박준수 | 팀장, FrontEnd 개발 | https://github.com/Parkjunsu123 |
| 오승우 | FrontEnd 개발 | https://github.com/Ossww123 |
| 안수진 | Backend 개발 | https://github.com/ssuzyn |
| 류재문 | BlockChain, BackEnd 개발 | https://github.com/jaemoon99 |
| 조대성 | Infra, BackEnd 개발 | https://github.com/tfer2442 |

<br>

# ⚙️기술 스택

### Backend

| 구성 요소 | 버전 |
| --- | --- |
| Java | 17 |
| Spring Boot | 3.4.3 |
| Spring Security | 6.4+ |
| Spring Data JPA | 3.4+ |
| Spring Actuator | 3.4.3 |
| QueryDSL | 5.0.0 |
| JWT | 0.12.3 |
| Swagger (OpenAPI) | 2.8.5 |
| MySQL | 8.0.36 |
| Redis | 7.4.2 |
| RabbitMQ | 3-management |
| Solana SDK | 1.19.2 |
| Log4j2 | 2.24.3 |

### Frontend

| 구성 요소 | 버전 |
| --- | --- |
| React | 19.0.0 |
| React Native | 0.76.7 |
| Expo | 52.0.40 |
| Node.js | 18.20.6 |
| Kotlin | 1.9.25 |
| Android SDK | Build Tools 35.0.0, Compile SDK 35, Target SDK 34, Min SDK 24 |

### Infrastructure

| 구성 요소 | 버전 |
| --- | --- |
| Nginx | 1.25.4 |
| Jenkins | 2.502 |
| Docker Compose | 3.8 |
| Prometheus | 3.4.0 |
| Grafana | 12.0.1 |
| Node Exporter | 1.9.1 |
| Nginx Exporter | 1.4.2 |
| Loki | 2.8.2 |
| Promtail | 2.8.2 |
| Fail2ban | 1.1.0 |
| GitLab Review Server (Flask) | 3.1.0 |
| Python | 3.9 |

### BlockChain

| 구성 요소 | 버전 |
| --- | --- |
| anchor | 0.31.0 |
| mpl-token-metadata | 5.1.0 |
| mpl-candy-metadata | 6.1.0 |
| spl-token | 0.4.13 |
| web3 | 1.98.0 |
| umi | 1.1.1 |
