# Solana Multisig

## Prerequisites

1. [Docker](https://docs.docker.com/get-started/)
2. Rust

```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustup component add rustfmt
```

3. Solana Tool Suite

```
sh -c "$(curl -sSfL https://release.solana.com/v1.7.12/install)"
```

4. Anchor Cli V16

```
cargo install --git https://github.com/project-serum/anchor --tag v0.16.0 anchor-cli --locked
```

Verify anchor installation

```
anchor --version
```

5. Mocha (npm global)

```
npm install -g mocha
```

6. Project Serum JS package

```
npm install -g @project-serum/anchor
```

7. Ensure Global node path is correct

```
export NODE_PATH="$(npm config get prefix)/lib/node_modules"
```

## Generate Wallet Address

In a separate terminal, start a local network. If you're running solana for the first time, generate a wallet. A new file is generated and stored at `~/.config/solana/id.json`.
Copy the generated Public Key and Secret Seed for later use.

```
solana-keygen new
```

## Config Solana Cli Network

Local network

```
solana config set --url http://127.0.0.1:8899
```

Dev network

```
solana config set --url https://api.devnet.solana.com
```

## Launch the Local Validator node

```
solana-test-validator
```

## Manage Wallet funds

Ensure that the main wallet has funds

### Airdrop Sol To Wallet

```
solana airdrop 10 <WALLET_PUBLIC_KEY>
```

### Ensure funds in Wallet

```
solana balance
```

### Exit the validator Node

Anchor automatically starts and stops the validator while testing

```
Ctrl+c
```

## Build

Build the multisig program into the target directory. Needs a running docker instance.

```bash
anchor build --verifiable
```

## Test

Run the files in the `/tests` directory. Anchor populates the workspace object on `line 12: /tests/multisig.js`. This workspace object it the key to enabling multisig transactions using serum.

```bash
anchor test
```
