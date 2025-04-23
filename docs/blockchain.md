# Blockchain Integration

In this project, the winner can store the fact that they won on the blockchain after the tournament is ended. We use the **Sepolia testnet**, a public Ethereum test network, which allows us to operate without real Ethereum. Test tokens (Sepolia ETH) are free and can be obtained from a [Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia).

---

## Key Components

### Sepolia Testnet
- A test network for Ethereum development.

### Wallet
- **Address**: `0x6b2af2c8599c5dfa30aa1d478e3762c1c3509b28`
- Created with [MetaMask](https://portfolio.metamask.io/), a browser extension for managing Ethereum wallets.
- Learn more at [MetaMask Developer Docs](https://developer.metamask.io/).

### Smart Contract
- **Address**: `0x8DfF57b0F2204aF8b78a47c66DD7d112721C6c78`
- **Purpose**: Stores tournament results (winner_tournament_name, timestamp).
- Compiled and deployed using [Remix Ethereum IDE](https://remix.ethereum.org/).

---

## How It Works

**After a Tournament**:
   - The winner can opt to save their score to the blockchain.
   - The backend sends the result to the `TournamentScores` contract on Sepolia.
   - Transactions cost a small amount of Sepolia ETH.
   - View all transactions for our wallet on [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x6b2af2c8599c5dfa30aa1d478e3762c1c3509b28).


## Notes
- **No Real Money**: Sepolia ETH has no value; it’s for testing only.
- **Visibility**: All transactions are public on Etherscan.
- **Wallet Balance**: Check our wallet’s Sepolia ETH on MetaMask Portfolio or Etherscan.
