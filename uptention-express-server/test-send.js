import anchor from "@coral-xyz/anchor";
const { BN } = anchor;
import { Connection, clusterApiUrl, PublicKey, Keypair, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";

import fs from "fs";

// === 1. 설정 ===
const idl = JSON.parse(fs.readFileSync("./anchor_token_transfer.json", "utf8")); // IDL 파일 경로
// const programId = new PublicKey(idl.address); // anchor deploy 후 나온 ID
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// === 2. 지갑 로드 ===
const payer = anchor.web3.Keypair.fromSecretKey(
  new Uint8Array(JSON.parse(fs.readFileSync("/home/ubuntu/keys/my-keypair.json", "utf8")))
);

// === 3. Anchor provider & program 준비 ===
const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(payer), {});
const program = new anchor.Program(idl, provider);

// === 4. 토큰 및 계정 정보 ===
const mint = new PublicKey("5ymZGsCFkfSzZN6AbwMWU2v4A4c5yeqmGj1vSpRWg75n"); // SPL Token mint address
const recipient = new PublicKey("2xNTBVYAu1NFmu1ALrwQq6VCse6Yj5MAQUbvNoLY5jAh");

(async () => {
  // === 5. 송신자 & 수신자 ATA 가져오기 (없으면 생성)
  const fromATA = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  const toATA = await getOrCreateAssociatedTokenAccount(connection, payer, mint, recipient);

  const amount = 5000;
  const decimals = 8;
  // === 6. Anchor 프로그램 호출
  const ix = await program.methods
    .sendToken(new BN(amount * 10 ** decimals)) // 예: 0.5 토큰 (decimals 6 기준)
    .accounts({
      sourceAuthority: payer.publicKey,
      sourceTokenAccount: fromATA.address,
      destTokenAccount: toATA.address,
      mint: mint,
      tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
    })
    .instruction();
    // .signers([payer])
    // .rpc();

  const tx = new Transaction().add(ix);
  const txSignature = await sendAndConfirmTransaction(connection, tx, [payer]);

  console.log("✅ 토큰 전송 성공!");
  console.log("🔗 트랜잭션 주소:", `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`);
})();
