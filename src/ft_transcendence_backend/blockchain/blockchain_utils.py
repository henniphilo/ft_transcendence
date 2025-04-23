from web3 import Web3
import json
import os
from environ import Env

env = Env()
Env.read_env()  # Reads .env file if present

# Web3 setup for Sepolia testnet
w3 = Web3(Web3.HTTPProvider('https://sepolia.infura.io/v3/a23119c5438f41edb641c7d780467ed9'))

# Load contract ABI and address
with open(os.path.join(os.path.dirname(__file__), 'contract_abi.json')) as f:
    contract_abi = json.load(f)

contract_address = '0x8DfF57b0F2204aF8b78a47c66DD7d112721C6c78'

contract = w3.eth.contract(address=contract_address, abi=contract_abi)

def add_game(winner_tournament_name, timestamp, private_key):
    """Add a game to the blockchain."""
    account = w3.eth.account.from_key(private_key)
    tx = contract.functions.addGame(winner_tournament_name, timestamp).build_transaction({
        'from': account.address,
        'gas': 200000,
        'gasPrice': w3.eth.gas_price,
        'nonce': w3.eth.get_transaction_count(account.address),
        'chainId': 11155111  # Sepolia chain ID
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return w3.eth.wait_for_transaction_receipt(tx_hash)

def get_game(index):
    """Retrieve a game's details from the blockchain."""
    winner_tournament_name, timestamp = contract.functions.getGame(index).call()
    return winner_tournament_name, timestamp

def get_game_count():
    """Retrieve the total number of games from the blockchain."""
    return contract.functions.getGameCount().call()