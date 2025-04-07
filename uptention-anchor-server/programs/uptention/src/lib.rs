// use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer}; // InitializeMint 제거
// use anchor_spl::metadata::{
//     create_metadata_accounts_v3,
//     CreateMetadataAccountsV3,
//     // Metadata는 mpl_token_metadata::accounts::MetadataAccount 와 충돌 가능성 있으므로 명시적 경로 사용 권장
//     // mpl_token_metadata::accounts::MetadataAccount as MetadataAccount, // 필요 시 이렇게 사용
// };
// use mpl_token_metadata::types::DataV2;
// // Metaplex Metadata Program ID 사용을 위해 추가 (Cargo.toml 에 mpl-token-metadata 의존성 추가 필요)
// // 예: mpl-token-metadata = { version="^1.13", features=["serde-solana"] } 정도 버전 명시
// use mpl_token_metadata::ID as TOKEN_METADATA_PROGRAM_ID;

// // 프로그램 ID (변경 없음)
// declare_id!("GJfn4PnccEkruMkw6ngzPNhz1NH727bFZvpyDWu3YzL");

// #[program]
// pub mod anchor_token_transfer {
//     use super::*;

//     // 토큰 전송 함수 (변경 없음)
//     pub fn send_token(ctx: Context<SendToken>, amount: u64) -> Result<()> {
//         let cpi_accounts = Transfer {
//             from: ctx.accounts.source_token_account.to_account_info(),
//             to: ctx.accounts.dest_token_account.to_account_info(),
//             authority: ctx.accounts.source_authority.to_account_info(),
//         };
//         let cpi_program = ctx.accounts.token_program.to_account_info();
//         let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
//         token::transfer(cpi_ctx, amount)?;
//         Ok(())
//     }

//     // NFT 생성 함수 (수정됨)
//     pub fn create_nft(ctx: Context<CreateNft>, name: String, symbol: String, uri: String) -> Result<()> {
//         // Mint 초기화 CPI 호출 제거 (#[account(init...)] 가 처리)

//         msg!("Mint account initialized via init constraint");

//         // Metadata 생성
//         msg!("Creating metadata arguments");
//         let data_v2 = DataV2 {
//             name,
//             symbol,
//             uri,
//             seller_fee_basis_points: 0,
//             creators: None, // 필요 시 설정: Some(vec![Creator { address: ctx.accounts.authority.key(), verified: true, share: 100 }])
//             collection: None,
//             uses: None,
//         };

//         msg!("Calling create_metadata_accounts_v3");
//         let cpi_accounts = CreateMetadataAccountsV3 {
//             metadata: ctx.accounts.metadata.to_account_info(), // Metadata 계정
//             mint: ctx.accounts.mint.to_account_info(),         // Mint 계정
//             mint_authority: ctx.accounts.authority.to_account_info(), // Mint Authority (init과 일치)
//             payer: ctx.accounts.authority.to_account_info(),          // Payer (init과 일치)
//             update_authority: ctx.accounts.authority.to_account_info(), // Update Authority
//             system_program: ctx.accounts.system_program.to_account_info(), // System Program
//             rent: ctx.accounts.rent.to_account_info(),                 // Rent Sysvar
//         };

//         let cpi_ctx = CpiContext::new(
//             ctx.accounts.token_metadata_program.to_account_info(), // Metadata 프로그램
//             cpi_accounts,
//         );

//         // create_metadata_accounts_v3 호출
//         // is_mutable: true, update_authority_is_signer: true (payer/authority가 update_authority이므로), collection_details: None
//         create_metadata_accounts_v3(cpi_ctx, data_v2, true, true, None)?;

//         msg!("NFT created successfully: {}", ctx.accounts.mint.key());
//         Ok(())
//     }

//     // NFT 전송 함수 (변경 없음)
//     pub fn send_nft(ctx: Context<SendNft>) -> Result<()> {
//         let cpi_accounts = Transfer {
//             from: ctx.accounts.source_token_account.to_account_info(),
//             to: ctx.accounts.dest_token_account.to_account_info(),
//             authority: ctx.accounts.source_authority.to_account_info(),
//         };
//         let cpi_program = ctx.accounts.token_program.to_account_info();
//         let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
//         // NFT는 항상 amount 1
//         token::transfer(cpi_ctx, 1)?;
//         Ok(())
//     }
// }

// #[derive(Accounts)]
// pub struct SendToken<'info> {
//     /// 중앙 지갑 (signer)
//     #[account(mut)]
//     pub source_authority: Signer<'info>,
//     /// 중앙 지갑의 토큰 계정
//     #[account(mut, has_one = mint)]
//     pub source_token_account: Account<'info, TokenAccount>,
//     /// 사용자 지갑의 토큰 계정 (이미 JS에서 생성되었음)
//     #[account(mut)]
//     pub dest_token_account: Account<'info, TokenAccount>,
//     /// 우리 SPL 토큰
//     pub mint: Account<'info, Mint>,
//     /// 토큰 프로그램
//     pub token_program: Program<'info, Token>,
// }

// // NFT 생성 컨텍스트 (수정됨)
// #[derive(Accounts)]
// pub struct CreateNft<'info> {
//     // 생성자 (서버 지갑) - Payer 역할도 겸함
//     #[account(mut)]
//     pub authority: Signer<'info>,

//     // NFT 민트 - init 제약조건 사용
//     #[account(
//         init,
//         payer = authority,
//         mint::decimals = 0,
//         mint::authority = authority, // Mint Authority를 authority Signer로 설정
//         mint::freeze_authority = authority // Freeze Authority도 authority Signer로 설정
//     )]
//     pub mint: Account<'info, Mint>,

//     /// Metadata 계정 (PDA)
//     /// CHECK: Metaplex instruction이 데이터 쓰기를 처리하므로 UncheckedAccount 사용 가능.
//     ///        PDA 주소 검증을 위해 seeds/bump 추가.
//     #[account(
//         mut,
//         seeds = [b"metadata", token_metadata_program.key().as_ref(), mint.key().as_ref()],
//         bump,
//         seeds::program = token_metadata_program.key() // Metadata 프로그램 ID 사용
//     )]
//     pub metadata: UncheckedAccount<'info>,

//     // 토큰 프로그램
//     pub token_program: Program<'info, Token>,

//     /// Metaplex Token Metadata Program
//     /// CHECK: This is safe because we're just passing it to the CPI.
//     ///        주소를 명시하여 안정성 높임.
//     #[account(address = TOKEN_METADATA_PROGRAM_ID)]
//     pub token_metadata_program: UncheckedAccount<'info>,

//     // 시스템 프로그램 (init에 필요)
//     pub system_program: Program<'info, System>,

//     // 렌트 시스템 변수 (init에 필요)
//     pub rent: Sysvar<'info, Rent>,
// }

// // NFT 전송 컨텍스트 (변경 없음)
// #[derive(Accounts)]
// pub struct SendNft<'info> {
//     // 전송자 (서버 지갑)
//     #[account(mut)]
//     pub source_authority: Signer<'info>,
//     // 전송자 NFT 계정
//     #[account(mut, has_one = mint)]
//     pub source_token_account: Account<'info, TokenAccount>,
//     // 수신자 NFT 계정
//     #[account(mut)]
//     pub dest_token_account: Account<'info, TokenAccount>,
//     // NFT 민트
//     pub mint: Account<'info, Mint>,
//     // 토큰 프로그램
//     pub token_program: Program<'info, Token>,
// }



// use anchor_lang::prelude::*;
// use anchor_spl::{
//     associated_token::AssociatedToken, // Associated Token Program 사용
//     metadata::{
//         create_metadata_accounts_v3, CreateMetadataAccountsV3, // Metaplex Metadata instruction 사용
//     },
//     token::{self, Mint, MintTo, Token, TokenAccount, Transfer}, // SPL Token 관련 타입 및 instruction 사용 (MintTo 추가)
// };
// use mpl_token_metadata::types::DataV2; // Metaplex Metadata 구조체 사용
// use mpl_token_metadata::ID as TOKEN_METADATA_PROGRAM_ID; // Metaplex Token Metadata Program ID 별칭 사용

// // 중요: 본인의 프로그램 ID로 교체하세요!
// declare_id!("GJfn4PnccEkruMkw6ngzPNhz1NH727bFZvpyDWu3YzL");

// #[program]
// pub mod uptention { // 모듈 이름은 Cargo.toml의 name과 일치시키는 것이 일반적
//     use super::*;

//     // --- 기존 토큰 전송 함수 ---
//     pub fn send_token(ctx: Context<SendToken>, amount: u64) -> Result<()> {
//         msg!("Sending {} tokens", amount);
//         let cpi_accounts = Transfer {
//             from: ctx.accounts.source_token_account.to_account_info(),
//             to: ctx.accounts.dest_token_account.to_account_info(),
//             authority: ctx.accounts.source_authority.to_account_info(),
//         };
//         let cpi_program = ctx.accounts.token_program.to_account_info();
//         let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
//         token::transfer(cpi_ctx, amount)?;
//         msg!("Tokens sent successfully.");
//         Ok(())
//     }

//     // --- NFT 생성 및 첫 발행(Mint To) 함수 ---
//     pub fn create_nft(ctx: Context<CreateNft>, name: String, symbol: String, uri: String) -> Result<()> {
//         // 1. Mint 계정 초기화 (#[account(init...)] 제약조건이 처리)
//         //    - Payer: authority
//         //    - Mint Authority: authority
//         //    - Freeze Authority: authority
//         //    - Decimals: 0
//         msg!("Mint account initialized via init constraint: {}", ctx.accounts.mint.key());

//         // 2. Metaplex Metadata 계정 생성
//         msg!("Creating metadata arguments for mint {}", ctx.accounts.mint.key());
//         let data_v2 = DataV2 {
//             name,
//             symbol,
//             uri,
//             seller_fee_basis_points: 0, // 로열티 없음
//             creators: None,             // 필요 시 설정: Some(vec![Creator { address: ctx.accounts.authority.key(), verified: true, share: 100 }])
//             collection: None,           // 컬렉션 정보 없음
//             uses: None,                 // 사용 정보 없음
//         };

//         msg!("Calling create_metadata_accounts_v3 instruction");
//         let cpi_accounts_metadata = CreateMetadataAccountsV3 {
//             metadata: ctx.accounts.metadata.to_account_info(),          // 생성될 Metadata PDA 계정
//             mint: ctx.accounts.mint.to_account_info(),                  // 대상 Mint 계정
//             mint_authority: ctx.accounts.authority.to_account_info(),   // Mint Authority (Authority Signer)
//             payer: ctx.accounts.authority.to_account_info(),            // Payer (Authority Signer)
//             update_authority: ctx.accounts.authority.to_account_info(), // Update Authority (Authority Signer)
//             system_program: ctx.accounts.system_program.to_account_info(), // System Program
//             rent: ctx.accounts.rent.to_account_info(),                  // Rent Sysvar
//         };
//         let cpi_ctx_metadata = CpiContext::new(
//             ctx.accounts.token_metadata_program.to_account_info(), // Metaplex Token Metadata Program
//             cpi_accounts_metadata,
//         );

//         // Metaplex instruction 호출하여 Metadata 생성
//         create_metadata_accounts_v3(
//             cpi_ctx_metadata,
//             data_v2,          // Metadata 내용
//             true,             // is_mutable: Metadata 변경 가능 여부
//             true,             // update_authority_is_signer: Update Authority가 서명했는지 여부
//             None              // collection_details: 컬렉션 상세 정보 (Master Edition 관련)
//         )?;
//         msg!("Metadata account created successfully: {}", ctx.accounts.metadata.key());

//         // 3. 생성된 NFT를 Authority의 Associated Token Account (ATA)로 발행 (Mint To)
//         //    - ATA는 #[account(init_if_needed...)] 제약조건이 필요시 생성
//         msg!("Minting NFT (1 token) to Authority's ATA: {}", ctx.accounts.token_account.key());
//         let cpi_accounts_mint = MintTo {
//             mint: ctx.accounts.mint.to_account_info(),           // 발행 대상 Mint
//             to: ctx.accounts.token_account.to_account_info(),    // NFT를 받을 ATA 계정
//             authority: ctx.accounts.authority.to_account_info(), // Mint Authority (Authority Signer)
//         };
//         let cpi_program_token = ctx.accounts.token_program.to_account_info(); // SPL Token Program
//         let cpi_ctx_mint = CpiContext::new(cpi_program_token, cpi_accounts_mint);

//         // SPL Token Program의 mint_to instruction 호출 (NFT는 항상 1개)
//         token::mint_to(cpi_ctx_mint, 1)?;
//         msg!("NFT minted successfully to ATA.");

//         Ok(())
//     }

//     // --- 기존 NFT 전송 함수 ---
//     pub fn send_nft(ctx: Context<SendNft>) -> Result<()> {
//         msg!("Sending NFT from {} to {}", ctx.accounts.source_token_account.key(), ctx.accounts.dest_token_account.key());
//         let cpi_accounts = Transfer {
//             from: ctx.accounts.source_token_account.to_account_info(), // 보내는 사람의 NFT 계정 (ATA)
//             to: ctx.accounts.dest_token_account.to_account_info(),     // 받는 사람의 NFT 계정 (ATA)
//             authority: ctx.accounts.source_authority.to_account_info(), // 보내는 사람 (서명자)
//         };
//         let cpi_program = ctx.accounts.token_program.to_account_info();
//         let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

//         // NFT 전송 (항상 1개)
//         token::transfer(cpi_ctx, 1)?;
//         msg!("NFT sent successfully.");
//         Ok(())
//     }
// }

// // --- Account Struct 정의 ---

// // 기존 토큰 전송 컨텍스트
// #[derive(Accounts)]
// pub struct SendToken<'info> {
//     #[account(mut)]
//     pub source_authority: Signer<'info>,
//     #[account(mut, has_one = mint)] // mint 필드와 연결 확인
//     pub source_token_account: Account<'info, TokenAccount>,
//     #[account(mut)] // 받는 계정은 존재한다고 가정 (JS 등에서 미리 생성)
//     pub dest_token_account: Account<'info, TokenAccount>,
//     pub mint: Account<'info, Mint>, // 어떤 종류의 토큰인지 명시
//     pub token_program: Program<'info, Token>,
// }

// // NFT 생성 컨텍스트 (수정됨)
// #[derive(Accounts)]
// pub struct CreateNft<'info> {
//     // NFT 생성자 및 최종 소유자 (서명자)
//     // Payer, Mint Authority, Update Authority 역할을 모두 수행
//     #[account(mut)]
//     pub authority: Signer<'info>,

//     // 생성될 NFT Mint 계정
//     #[account(
//         init, // 이 instruction에서 계정 생성 및 초기화
//         payer = authority, // 계정 생성 비용 지불자
//         mint::decimals = 0, // NFT는 소수점 없음
//         mint::authority = authority, // Mint Authority 설정
//         mint::freeze_authority = authority // Freeze Authority 설정 (선택적)
//     )]
//     pub mint: Account<'info, Mint>,

//     // 생성될 Metaplex Metadata 계정 (PDA)
//     /// CHECK: Metaplex Metadata PDA. Metaplex instruction이 데이터 쓰기를 처리하며,
//     // PDA 주소 검증을 위해 seeds, bump, seeds::program 사용 권장.
//     #[account(
//         mut,
//         seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), mint.key().as_ref()], // PDA 시드
//         bump, // PDA 범프 시드
//         seeds::program = token_metadata_program.key() // PDA 생성 주체 프로그램 (Metadata Program)
//     )]
//     pub metadata: UncheckedAccount<'info>,

//     // NFT를 발행받을 Authority의 Associated Token Account (ATA)
//     // init_if_needed: 계정이 없으면 생성, 있으면 기존 계정 사용 (안전)
//     #[account(
//         init_if_needed,
//         payer = authority,                  // ATA 생성 비용 지불자
//         associated_token::mint = mint,      // ATA가 연결될 Mint
//         associated_token::authority = authority // ATA의 소유자
//     )]
//     pub token_account: Account<'info, TokenAccount>,

//     // 필수 프로그램 및 시스템 계정
//     pub system_program: Program<'info, System>,           // 계정 생성 등에 필요
//     pub token_program: Program<'info, Token>,             // Mint 생성, Mint To 등에 필요
//     pub associated_token_program: Program<'info, AssociatedToken>, // ATA 생성/관리에 필요
//     pub rent: Sysvar<'info, Rent>,                        // 계정 생성 시 Rent 면제 확인 등에 필요

//     // Metaplex Token Metadata Program 계정 정보
//     // CHECK 어트리뷰트: 주소 검증으로 안전성 확보
//     #[account(address = TOKEN_METADATA_PROGRAM_ID)] // 주소 고정 확인
//     pub token_metadata_program: UncheckedAccount<'info>,
// }

// // 기존 NFT 전송 컨텍스트
// #[derive(Accounts)]
// pub struct SendNft<'info> {
//     // 보내는 사람 (서명자)
//     #[account(mut)]
//     pub source_authority: Signer<'info>,

//     // 보내는 사람의 NFT 소유 계정 (ATA)
//     #[account(mut, constraint = source_token_account.amount == 1, has_one = mint)] // NFT는 1개만 있어야 함
//     pub source_token_account: Account<'info, TokenAccount>,

//     // 받는 사람의 NFT 소유 계정 (ATA)
//     // 받는 사람의 ATA는 미리 존재해야 함 (JS 등에서 생성)
//     #[account(mut, constraint = dest_token_account.amount == 0, has_one = mint)] // 받는 계정은 비어있어야 함 (선택적 제약)
//     pub dest_token_account: Account<'info, TokenAccount>,

//     // 전송 대상 NFT Mint
//     pub mint: Account<'info, Mint>,

//     // SPL Token Program
//     pub token_program: Program<'info, Token>,
// }

// 파일 경로: programs/uptention/src/lib.rs
// (프로젝트 이름이 'uptention'이라고 가정)

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, // Associated Token Program 사용
    metadata::{
        create_metadata_accounts_v3, CreateMetadataAccountsV3, // Metaplex Metadata instruction 사용
    },
    token::{self, Mint, MintTo, Token, TokenAccount, Transfer}, // SPL Token 관련 타입 및 instruction 사용 (MintTo 추가)
};
use mpl_token_metadata::types::DataV2; // Metaplex Metadata 구조체 사용
use mpl_token_metadata::ID as TOKEN_METADATA_PROGRAM_ID; // Metaplex Token Metadata Program ID 별칭 사용

// 중요: 본인의 프로그램 ID로 교체하세요! (예시 ID)
declare_id!("6EU2JYdEjdQgXMQH2m5UFXn6p4J1zVL73M65PkvwgwDR");

#[program]
pub mod uptention { // 모듈 이름은 Cargo.toml의 name과 일치시키는 것이 일반적
    use super::*;

    // --- 기존 토큰 전송 함수 ---
    pub fn send_token(ctx: Context<SendToken>, amount: u64) -> Result<()> {
        msg!("Sending {} tokens from {} to {}", amount, ctx.accounts.source_token_account.key(), ctx.accounts.dest_token_account.key());
        let cpi_accounts = Transfer {
            from: ctx.accounts.source_token_account.to_account_info(),
            to: ctx.accounts.dest_token_account.to_account_info(),
            authority: ctx.accounts.source_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;
        msg!("Tokens sent successfully.");
        Ok(())
    }

    // --- NFT 생성 및 첫 발행(Mint To) 함수 ---
    pub fn create_nft(ctx: Context<CreateNft>, name: String, symbol: String, uri: String) -> Result<()> {
        // 1. Mint 계정 초기화 (#[account(init...)] 제약조건이 처리)
        msg!("Mint account initialized via init constraint: {}", ctx.accounts.mint.key());

        // 2. Metaplex Metadata 계정 생성
        msg!("Creating metadata arguments for mint {}", ctx.accounts.mint.key());
        let data_v2 = DataV2 {
            name,
            symbol,
            uri,
            seller_fee_basis_points: 0, // 로열티 없음
            creators: None,             // 필요 시 설정
            collection: None,           // 컬렉션 정보 없음
            uses: None,                 // 사용 정보 없음
        };

        msg!("Calling create_metadata_accounts_v3 instruction");
        let cpi_accounts_metadata = CreateMetadataAccountsV3 {
            metadata: ctx.accounts.metadata.to_account_info(),          // 생성될 Metadata PDA 계정
            mint: ctx.accounts.mint.to_account_info(),                  // 대상 Mint 계정
            mint_authority: ctx.accounts.authority.to_account_info(),   // Mint Authority (Authority Signer)
            payer: ctx.accounts.authority.to_account_info(),            // Payer (Authority Signer)
            update_authority: ctx.accounts.authority.to_account_info(), // Update Authority (Authority Signer)
            system_program: ctx.accounts.system_program.to_account_info(), // System Program
            rent: ctx.accounts.rent.to_account_info(),                  // Rent Sysvar
        };
        // CPI 컨텍스트 생성 시 프로그램 ID는 AccountInfo를 사용
        let cpi_ctx_metadata = CpiContext::new(
            ctx.accounts.token_metadata_program.to_account_info(), // Metaplex Token Metadata Program
            cpi_accounts_metadata,
        );

        // Metaplex instruction 호출하여 Metadata 생성
        create_metadata_accounts_v3(
            cpi_ctx_metadata,
            data_v2,          // Metadata 내용
            true,             // is_mutable: Metadata 변경 가능 여부
            true,             // update_authority_is_signer: Update Authority가 서명했는지 여부
            None              // collection_details: 컬렉션 상세 정보 (Master Edition 관련)
        )?;
        msg!("Metadata account created successfully: {}", ctx.accounts.metadata.key());

        // 3. 생성된 NFT를 Authority의 Associated Token Account (ATA)로 발행 (Mint To)
        msg!("Minting NFT (1 token) to Authority's ATA: {}", ctx.accounts.token_account.key());
        let cpi_accounts_mint = MintTo {
            mint: ctx.accounts.mint.to_account_info(),           // 발행 대상 Mint
            to: ctx.accounts.token_account.to_account_info(),    // NFT를 받을 ATA 계정
            authority: ctx.accounts.authority.to_account_info(), // Mint Authority (Authority Signer)
        };
        let cpi_program_token = ctx.accounts.token_program.to_account_info(); // SPL Token Program
        let cpi_ctx_mint = CpiContext::new(cpi_program_token, cpi_accounts_mint);

        // SPL Token Program의 mint_to instruction 호출 (NFT는 항상 1개)
        token::mint_to(cpi_ctx_mint, 1)?;
        msg!("NFT minted successfully to ATA.");

        Ok(())
    }

    // --- 기존 NFT 전송 함수 ---
    pub fn send_nft(ctx: Context<SendNft>) -> Result<()> {
        msg!("Sending NFT from {} to {}", ctx.accounts.source_token_account.key(), ctx.accounts.dest_token_account.key());
        let cpi_accounts = Transfer {
            from: ctx.accounts.source_token_account.to_account_info(), // 보내는 사람의 NFT 계정 (ATA)
            to: ctx.accounts.dest_token_account.to_account_info(),     // 받는 사람의 NFT 계정 (ATA)
            authority: ctx.accounts.source_authority.to_account_info(), // 보내는 사람 (서명자)
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        // NFT 전송 (항상 1개)
        token::transfer(cpi_ctx, 1)?;
        msg!("NFT sent successfully.");
        Ok(())
    }
}

// --- Account Struct 정의 ---

// 기존 토큰 전송 컨텍스트
#[derive(Accounts)]
pub struct SendToken<'info> {
    #[account(mut)]
    pub source_authority: Signer<'info>,
    #[account(mut, has_one = mint)] // mint 필드와 연결 확인
    pub source_token_account: Account<'info, TokenAccount>,
    #[account(mut)] // 받는 계정은 존재한다고 가정 (JS 등에서 미리 생성)
    pub dest_token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>, // 어떤 종류의 토큰인지 명시
    pub token_program: Program<'info, Token>,
}

// NFT 생성 컨텍스트 (metadata의 seeds::program 수정됨)
#[derive(Accounts)]
pub struct CreateNft<'info> {
    // NFT 생성자 및 최종 소유자 (서명자)
    #[account(mut)]
    pub authority: Signer<'info>,

    // 생성될 NFT Mint 계정
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = authority,
        mint::freeze_authority = authority
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: Metaplex Metadata PDA. Metaplex instruction이 데이터 쓰기를 처리하며,
    /// PDA 주소는 seeds와 bump, 그리고 올바른 program ID로 검증됩니다.
    #[account(
        mut,
        seeds = [b"metadata", TOKEN_METADATA_PROGRAM_ID.as_ref(), mint.key().as_ref()],
        bump,
        seeds::program = TOKEN_METADATA_PROGRAM_ID // <<< 여기가 수정되었습니다! 올바른 프로그램 ID 사용.
    )]
    pub metadata: UncheckedAccount<'info>,

    // NFT를 발행받을 Authority의 Associated Token Account (ATA)
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority
    )]
    pub token_account: Account<'info, TokenAccount>,

    // 필수 프로그램 및 시스템 계정
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub rent: Sysvar<'info, Rent>,

    /// CHECK: Metaplex Token Metadata Program 자체입니다. 주소를 명시적으로 확인하여 안전합니다.
    #[account(address = TOKEN_METADATA_PROGRAM_ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
}

// 기존 NFT 전송 컨텍스트
#[derive(Accounts)]
pub struct SendNft<'info> {
    #[account(mut)]
    pub source_authority: Signer<'info>,
    #[account(mut, constraint = source_token_account.amount == 1, has_one = mint)]
    pub source_token_account: Account<'info, TokenAccount>,
    #[account(mut, constraint = dest_token_account.amount == 0, has_one = mint)]
    pub dest_token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
}