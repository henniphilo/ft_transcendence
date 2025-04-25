# Blockchain Integration

In this project, the winner can store the fact that they won on the blockchain after the tournament is ended. We use the **Sepolia testnet**, a public Ethereum test network, which allows us to operate without real Ethereum. Test tokens (Sepolia ETH) are free and can be obtained from a faucet. The [Google Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia) was the only one we found that did not require a starting balance.

### Wallet
- **Address**: `0x6b2af2c8599c5dfa30aa1d478e3762c1c3509b28`
- Created with [MetaMask](https://portfolio.metamask.io/), a browser extension for managing Ethereum wallets.
- Learn more at [MetaMask Developer Docs](https://developer.metamask.io/).

### Smart Contract
- **Address**: `0x8DfF57b0F2204aF8b78a47c66DD7d112721C6c78`
- **Purpose**: Stores tournament results (winner_tournament_name, timestamp).
- Compiled and deployed using [Remix Ethereum IDE](https://remix.ethereum.org/).
- The contract was also uploaded to and authenticated with Etherscan, allowing users to decode the data to check the original strings. 


---

## How It Works

We opted to only store tournament results in the blockchain, since the results of other games carry less weight and therefore it is not worth it to spend cryptocurrency (which would not be free in a real world application) to store these. Here is how it works: 

**After a Tournament**:
   - The winner can opt to save their score to the blockchain.
   - The backend sends the result to the `TournamentScores` contract on Sepolia.
   - Transactions cost a small amount of Sepolia ETH, this is the commission (also called gas price) paid to any third party actors who verify the transaction.
   - View all transactions for our wallet on [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x6b2af2c8599c5dfa30aa1d478e3762c1c3509b28). On Etherscan you can click a transaction and then expand the details with the "show more" button. Here you are able to use the "Decode input Data" button to view the user's tournament name and timestamp. 
   - The values saved are the tournament name of the winner and the timestamp. The reason no username is saved is because of privacy reasons: tournament names are easy to change afterwards while changing a username would require creating a new account. 


## Notes
- **No Real Money**: Sepolia ETH has no value; it’s for testing only.
- **Visibility**: All transactions are public on Etherscan.
- **Wallet Balance**: Check our wallet’s Sepolia ETH on MetaMask Portfolio or Etherscan.
