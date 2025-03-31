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

contract_address = '0x3F9feC4a59121cbb7925d7A91c67333aA6ce6a6d'  # Sepolia-deployed contract address
contract = w3.eth.contract(address=contract_address, abi=contract_abi)

def add_score(tournament_id, user_id, score, private_key):
    """Add a score to the blockchain."""
    account = w3.eth.account.from_key(private_key)
    tx = contract.functions.addScore(tournament_id, user_id, score).build_transaction({
        'from': account.address,
        'gas': 200000,
        'gasPrice': w3.eth.gas_price,
        'nonce': w3.eth.get_transaction_count(account.address),
        'chainId': 11155111  # Sepolia chain ID
    })
    signed_tx = w3.eth.account.sign_transaction(tx, private_key=private_key)
    tx_hash = w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    return w3.eth.wait_for_transaction_receipt(tx_hash)

def get_tournament_scores(tournament_id):
    """Retrieve scores for a tournament from the blockchain."""
    user_ids, scores = contract.functions.getTournamentScores(tournament_id).call()
    return user_ids, scores