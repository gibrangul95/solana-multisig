// const anchor = require("@project-serum/anchor");
const anchor = require('./ts/dist/cjs');
const assert = require("assert");
const fs = require('fs');
const walletSecret = require('./id.json');

const { accounts: testAccounts } = require('./accounts');

const pid = new anchor.web3.PublicKey('A3HyJSNet7Wx1Sj7rm8WspNrxtLLXamZMWjHG1B6Jc5N');

describe("multisig", () => {
  // Configure the client to use the local cluster.
  let provider = anchor.Provider.local('https://api.devnet.solana.com/')
  anchor.setProvider(provider);

  const program = anchor.workspace.SerumMultisig;

  const systemWallet = anchor.web3.Keypair.fromSecretKey(Buffer.from(walletSecret));
  console.log('Node Wallet Key: ', systemWallet.publicKey.toString())

  it("Tests the multisig program", async () => {
    // Generate a new Solana Keypair (Multisig Account Address)
    const multisig = anchor.web3.Keypair.generate();
    console.log('Multisig Account Address:', multisig.publicKey.toString())

    // Find Corressponding Wallet for the Multisig account, if it doesn't exist create one
    // Generated using the Program Address and Multisig account address
    const [
      multisigSignerWallet,
      nonce,
    ] = await anchor.web3.PublicKey.findProgramAddress(
      [multisig.publicKey.toBuffer()],
      pid
    );
    console.log('Multisig Wallet Address:', multisigSignerWallet.toString())

    // Transaction Size, no detailed documentation
    const multisigSize = 200;

    // Multisig account owners
    const ownerA = anchor.web3.Keypair.generate();
    const ownerB = anchor.web3.Keypair.generate();
    const ownerC = anchor.web3.Keypair.generate();
    const receiver = anchor.web3.Keypair.generate();
    console.log(`Owner A: ${ownerA.publicKey.toString()}`)
    console.log(`Owner B: ${ownerB.publicKey.toString()}`)
    console.log(`Owner C: ${ownerC.publicKey.toString()}`)
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
    const tx = anchor.web3.SystemProgram.transfer({
      fromPubkey: multisigSignerWallet,
      toPubkey: receiver.publicKey,
      lamports: new anchor.BN(1000000000),
    })

    const data = tx.data
    const transferPid = anchor.web3.SystemProgram.programId

    await program.rpc.createTransaction(transferPid, accounts, data, {
      accounts: {
        multisig: multisig.publicKey,
        signer1: ownerA.publicKey,
        signer2: ownerC.publicKey,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        multisigSigner: multisigSignerWallet,
      },
      remainingAccounts:
        [{
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
      signers: [ownerA, ownerC],
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