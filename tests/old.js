// const anchor = require("@project-serum/anchor");
// const assert = require("assert");
// const fs = require('fs');

// const { accounts: testAccounts } = require('./accounts');

// describe("multisig", () => {
//   // Configure the client to use the local cluster.
//   anchor.setProvider(anchor.Provider.env());

//   const program = anchor.workspace.SerumMultisig;

//   const systemWallet = anchor.web3.Keypair.fromSecretKey(
//     Buffer.from(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET, { encoding: "utf-8" })))
//   );
//   console.log('Node Wallet Key: ', systemWallet.publicKey.toString())

//   it("Tests the multisig program", async () => {
//     // Generate a new Solana Keypair (Multisig Account Address)
//     const multisig = anchor.web3.Keypair.generate();
//     console.log('Multisig Account Address: ', multisig.publicKey.toString())
//     // console.log('SecretKey: ', Buffer.from(multisig.secretKey).toString('hex'))

//     // Find Corressponding Wallet for the Multisig account, if it doesn't exist create one
//     // Generated using the Program Address and Multisig account address
//     const [
//       multisigSignerWallet,
//       nonce,
//     ] = await anchor.web3.PublicKey.findProgramAddress(
//       [multisig.publicKey.toBuffer()],
//       program.programId
//     );
//     console.log('Multisig Wallet Address: ', multisigSignerWallet.toString())

//     // Transaction Size, no detailed documentation
//     const multisigSize = 200;

//     // Multisig account owners
//     const ownerA = anchor.web3.Keypair.fromSecretKey(testAccounts.account1.secretKey)
//     const ownerB = anchor.web3.Keypair.fromSecretKey(testAccounts.account2.secretKey)
//     const ownerC = anchor.web3.Keypair.fromSecretKey(testAccounts.account3.secretKey)
//     const receiver = anchor.web3.Keypair.fromSecretKey(testAccounts.account4.secretKey)
//     const owners = [ownerA.publicKey, ownerB.publicKey, ownerC.publicKey];

//     // Set minimum signers
//     const threshold = new anchor.BN(2);
//     // await program.rpc.createMultisig(owners, threshold, nonce, {
//     //   accounts: {
//     //     multisig: multisig.publicKey,
//     //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//     //   },
//     //   instructions: [
//     //     await program.account.multisig.createInstruction(
//     //       multisig,
//     //       multisigSize
//     //     ),
//     //   ],
//     //   signers: [multisig],
//     // });
//     // let multisigAccount = await program.account.multisig.fetch(multisig.publicKey);
//     // assert.strictEqual(multisigAccount.nonce, nonce);
//     // assert.ok(multisigAccount.threshold.eq(new anchor.BN(2)));
//     // assert.deepStrictEqual(multisigAccount.owners, owners);
//     // assert.ok(multisigAccount.ownerSetSeqno === 0);

//     // console.log(multisigSignerWallet.toString())
//     // const pid = program.programId;
//     // const accounts = [
//     //   {
//     //     pubkey: multisigSignerWallet,
//     //     isWritable: true,
//     //     isSigner: true,
//     //   },
//     //   {
//     //     pubkey: receiver.publicKey,
//     //     isWritable: true,
//     //     isSigner: false,
//     //   },
//     // ];

//     // // await transfer(provider, localAccount.publicKey, multisigSignerWallet, localAccount)

//     // const data = anchor.web3.SystemProgram.transfer({
//     //   fromPubkey: multisigSignerWallet,
//     //   toPubkey: receiver.publicKey,
//     //   lamports: new anchor.BN(1000000000),
//     // }).data
//     // const transferPid = anchor.web3.SystemProgram.programId

//     // const transaction = anchor.web3.Keypair.generate();
//     // const txSize = 1000; // Big enough, cuz I'm lazy.
//     // await program.rpc.createTransaction(transferPid, accounts, data, {
//     //   accounts: {
//     //     multisig: multisig.publicKey,
//     //     transaction: transaction.publicKey,
//     //     proposer: ownerA.publicKey,
//     //     rent: anchor.web3.SYSVAR_RENT_PUBKEY,
//     //   },
//     //   instructions: [
//     //     await program.account.transaction.createInstruction(
//     //       transaction,
//     //       txSize
//     //     ),
//     //   ],
//     //   signers: [transaction, ownerA],
//     // });

//     // const txAccount = await program.account.transaction.fetch(transaction.publicKey);

//     // assert.ok(txAccount.programId.equals(transferPid));
//     // assert.deepEqual(txAccount.accounts, accounts);
//     // assert.deepEqual(txAccount.data, data);
//     // assert.ok(txAccount.multisig.equals(multisig.publicKey));
//     // assert.equal(txAccount.didExecute, false);

//     // await program.rpc.approve({
//     //   accounts: {
//     //     multisig: multisig.publicKey,
//     //     transaction: transaction.publicKey,
//     //     owner: ownerC.publicKey,
//     //   },
//     //   signers: [ownerC],
//     // });

//     // // Now that we've reached the threshold, send the transactoin.
//     // await program.rpc.executeTransaction({
//     //   accounts: {
//     //     multisig: multisig.publicKey,
//     //     multisigSigner: multisigSignerWallet,
//     //     transaction: transaction.publicKey,
//     //   },
//     //   remainingAccounts:
//     //     [{
//     //       pubkey: multisig.publicKey,
//     //       isWritable: true,
//     //       isSigner: false,
//     //     }, {
//     //       pubkey: anchor.web3.SystemProgram.programId,
//     //       isWritable: true,
//     //       isSigner: false,
//     //     }, {
//     //       pubkey: multisigSignerWallet,
//     //       isWritable: true,
//     //       isSigner: false,
//     //     }, {
//     //       pubkey: receiver.publicKey,
//     //       isWritable: true,
//     //       isSigner: false,
//     //     }, {
//     //       pubkey: program.programId,
//     //       isWritable: true,
//     //       isSigner: false,
//     //     }],
//     // });
//   });
// });

// async function transfer(provider, from, to, authority) {

//   const instructions = [anchor.web3.SystemProgram.transfer({
//     fromPubkey: from,
//     toPubkey: to,
//     lamports: new anchor.BN(2000000000),
//   }),
//   ]

//   const tx = new anchor.web3.Transaction();
//   tx.add(...instructions);

//   await provider.send(tx, [authority]);
//   return;
// }