const anchor = require("@project-serum/anchor");
const assert = require("assert");
const fs = require('fs');

const { accounts: testAccounts } = require('./accounts');

describe("multisig", () => {
  // Configure the client to use the local cluster.
  let provider = anchor.Provider.env()
  anchor.setProvider(provider);

  const program = anchor.workspace.SerumMultisig;

  const systemWallet = anchor.web3.Keypair.fromSecretKey(
    Buffer.from(JSON.parse(fs.readFileSync(process.env.ANCHOR_WALLET, { encoding: "utf-8" })))
  );
  console.log('Node Wallet Key: ', systemWallet.publicKey.toString())

  it("Tests the multisig program", async () => {
    // Generate a new Solana Keypair (Multisig Account Address)
    const multisig = anchor.web3.Keypair.generate();
    console.log('Multisig Account Address: ', multisig.publicKey.toString())
    // console.log('SecretKey: ', Buffer.from(multisig.secretKey).toString('hex'))

    // Find Corressponding Wallet for the Multisig account, if it doesn't exist create one
    // Generated using the Program Address and Multisig account address
    const [
      multisigSignerWallet,
      nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      program.programId
    );
    console.log('Multisig Wallet Address: ', multisigSignerWallet.toString())

    // Transaction Size, no detailed documentation
    const multisigSize = 200;

    // Multisig account owners
    const ownerA = anchor.web3.Keypair.generate();
    const ownerB = anchor.web3.Keypair.generate();
    const ownerC = anchor.web3.Keypair.generate();
    const receiver = anchor.web3.Keypair.generate();
    console.log('Receiver Address: ', receiver.publicKey.toString())
    const owners = [ownerA.publicKey, ownerB.publicKey, ownerC.publicKey];

    // Set minimum signers
    const threshold = new anchor.BN(2);

    // Broadcast transaction to set owners of the newly created multisig account
    // The multisig account signs the transaction to approve the new owners
    await program.rpc.createMultisig(owners, threshold, nonce, {
      accounts: {
        multisig: multisig.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      instructions: [
        await program.account.multisig.createInstruction(
          multisig,
          multisigSize
        ),
      ],
      signers: [multisig],
    });

    // Validate the multisig account and its owners 
    let multisigAccount = await program.account.multisig.fetch(multisig.publicKey);
    assert.strictEqual(multisigAccount.nonce, nonce);
    assert.ok(multisigAccount.threshold.eq(new anchor.BN(2)));
    assert.deepStrictEqual(multisigAccount.owners, owners);
    assert.ok(multisigAccount.ownerSetSeqno === 0);

    // Transfer 2 SOL to the newly created wallet using our system wallet
    await transfer(provider, systemWallet.publicKey, multisigSignerWallet, systemWallet)

    // Multisig Program ID
    const pid = program.programId;

    // Accounts we need to transfer between
    // Account 1: Multisig Account wallet
    // Account 2: Destination Account
    const accounts = [
      {
        pubkey: multisigSignerWallet,
        isWritable: true,
        isSigner: true,
      },
      {
        pubkey: receiver.publicKey,
        isWritable: true,
        isSigner: false,
      },
    ];

    // Create the serialized data for a native asset transfer transaction (sender: multisig wallet address, receiver: destination)
    const data = anchor.web3.SystemProgram.transfer({
      fromPubkey: multisigSignerWallet,
      toPubkey: receiver.publicKey,
      lamports: new anchor.BN(1000000000),
    }).data

    const transferPid = anchor.web3.SystemProgram.programId

    // Owner A proposes the transfer transaction on the network
    // Build a transaction that invokes the multisig program on the chain
    // Wraps our original native asset transaction
    // transactionID holds the keyPair for the transaction
    const transactionID = anchor.web3.Keypair.generate();
    const txSize = 1000; // Again no documentation for size
    await program.rpc.createTransaction(transferPid, accounts, data, {
      accounts: {
        multisig: multisig.publicKey,
        transaction: transactionID.publicKey,
        proposer: ownerA.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      },
      instructions: [
        await program.account.transaction.createInstruction(
          transactionID,
          txSize
        ),
      ],
      // signers of the transaction, includes the proposer
      signers: [transactionID, ownerA],
    });

    // Validate that the transaction has been broadcasted on the network
    const txAccount = await program.account.transaction.fetch(transactionID.publicKey);

    assert.ok(txAccount.programId.equals(transferPid));
    assert.deepEqual(txAccount.accounts, accounts);
    assert.deepEqual(txAccount.data, data);
    assert.ok(txAccount.multisig.equals(multisig.publicKey));
    assert.equal(txAccount.didExecute, false);

    // Second signer approves the transaction
    await program.rpc.approve({
      accounts: {
        multisig: multisig.publicKey,
        transaction: transactionID.publicKey,
        owner: ownerC.publicKey,
      },
      signers: [ownerC],
    });

    // The transaction the network is approved after reaching the threshold
    await program.rpc.executeTransaction({
      accounts: {
        multisig: multisig.publicKey,
        multisigSigner: multisigSignerWallet,
        transaction: transactionID.publicKey,
      },
      remainingAccounts:
        [{
          pubkey: multisig.publicKey,
          isWritable: true,
          isSigner: false,
        }, {
          pubkey: anchor.web3.SystemProgram.programId,
          isWritable: true,
          isSigner: false,
        }, {
          pubkey: multisigSignerWallet,
          isWritable: true,
          isSigner: false,
        }, {
          pubkey: receiver.publicKey,
          isWritable: true,
          isSigner: false,
        }, {
          pubkey: program.programId,
          isWritable: true,
          isSigner: false,
        }],
    });
  });
});

async function transfer(provider, from, to, authority) {

  const instructions = [anchor.web3.SystemProgram.transfer({
    fromPubkey: from,
    toPubkey: to,
    lamports: new anchor.BN(2000000000),
  }),
  ]

  const tx = new anchor.web3.Transaction();
  tx.add(...instructions);

  await provider.send(tx, [authority]);
  return;
}