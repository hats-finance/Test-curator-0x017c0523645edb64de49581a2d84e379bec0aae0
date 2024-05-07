const fs = require("fs");
const ethers = require("ethers");
const web3 = require("web3");
const { default: MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const airdropJson1 = require('./tge-airdrop-1.json');

let airdropTree = {};
let hashes = [];
let totalAmount = web3.utils.toBN(0);

const airdropJsons = [airdropJson1];

for (const airdropData of airdropJsons) {
    for (const beneficiary in airdropData) {
        if (!airdropTree[beneficiary]) {
            airdropTree[beneficiary] = "0";
        }
        for (const amount of Object.values(airdropData[beneficiary]["token_eligibility"])) {
            airdropTree[beneficiary] = web3.utils.toBN(airdropTree[beneficiary]).add(web3.utils.toBN(amount)).toString();
        }
    }
}

fs.writeFileSync("tge/airdrop-data.json", JSON.stringify(airdropTree, undefined, 2));

for (const [account, amount] of Object.entries(airdropTree)) {
    totalAmount = totalAmount.add(web3.utils.toBN(amount));
    hashes.push(hashTokens(account, amount));
}

merkleTree = new MerkleTree(hashes, keccak256, { sortPairs: true });

console.log("Merkle Root:", merkleTree.getHexRoot());
console.log("Total amount:", web3.utils.fromWei(totalAmount.toString()));


function hashTokens(account, amount) {
    return Buffer.from(
        ethers.utils.solidityKeccak256(
            ['address', 'uint256'],
            [account, amount]
        ).slice(2),
        'hex'
    );
}
