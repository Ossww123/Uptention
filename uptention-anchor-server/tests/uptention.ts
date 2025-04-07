import anchor from "@coral-xyz/anchor";
const { BN, Program, AnchorProvider, web3 } = anchor;
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
  createMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";

describe("anchor_token_transfer", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AnchorTokenTransfer as anchor.Program<any>;

  let mint = null;
  let centralWallet = anchor.web3.Keypair.generate();
  let userWallet = anchor.web3.Keypair.generate();

  let centralTokenAccount = null;
  let userTokenAccount = null;

  const connection = provider.connection;

  it("1. 토큰 Mint 생성", async () => {
    mint = await createMint(
      connection,
      provider.wallet.payer, // 수수료 지불자
      centralWallet.publicKey, // mint authority
      null, // freeze authority
      6 // 소수점 자리수
    );
  });

  it("2. 테스트 지갑에 SOL 에어드랍", async () => {
    await connection.requestAirdrop(centralWallet.publicKey, 1e9);
    await connection.requestAirdrop(userWallet.publicKey, 1e9);
  });

  it("3. 중앙 지갑과 사용자 지갑의 ATA 생성", async () => {
    centralTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      provider.wallet.payer,
      mint,
      centralWallet.publicKey
    );

    userTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      provider.wallet.payer,
      mint,
      userWallet.publicKey
    );
  });

  it("4. 중앙 지갑에 토큰 mint (초기 보유량)", async () => {
    await mintTo(
      connection,
      provider.wallet.payer,
      mint,
      centralTokenAccount.address,
      centralWallet,
      1_000_000_000 // 1000 토큰
    );
  });

  it("5. Anchor 프로그램으로 사용자에게 토큰 전송", async () => {
    const amountToSend = new BN(500_000); // 0.5 토큰

    await program.methods
      .sendToken(amountToSend)
      .accounts({
        sourceAuthority: centralWallet.publicKey,
        sourceTokenAccount: centralTokenAccount.address,
        destTokenAccount: userTokenAccount.address,
        mint: mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([centralWallet])
      .rpc();

    // 결과 검증
    const updatedUserAccount = await connection.getTokenAccountBalance(
      userTokenAccount.address
    );

    assert.strictEqual(updatedUserAccount.value.uiAmount, 0.5);
  });
});
