const hre = require("hardhat");
const fs = require('fs');

const TGE_TIMESTAMP = 1719792000;
const GOVERNANCE_ADDRESS = "0x7c2C195CD6D34B8F845992d380aADB2730bB9C6F";
const HAT_TOKEN_ADDRESS = "0x8858eeB3DfffA017D4BCE9801D340D36Cf895CCf";
const TOTAL_HAT_SUPPLY = 100_000_000;
const DELEGATE = true;

async function main() {
  try {
    const timelocksData = csvToJSON(await fs.readFileSync("./tge/tokenlocks-data.csv", {
        encoding: "utf8",
        flag: "r",
    }));

    const TokenLockFactory = await hre.ethers.getContractFactory("TokenLockFactory");

    const tokenLockFactoryAddress = "0xf4e77E5Da47AC3125140c470c71cBca77B5c638c";
    const tokenLockFactory = await TokenLockFactory.attach(tokenLockFactoryAddress);

    for (const timelockData of timelocksData) {
        let governance = GOVERNANCE_ADDRESS;
        let beneficiary = timelockData.beneficiary;
        let hatToken = HAT_TOKEN_ADDRESS;
        timelockData.totalAllocationPercentage = parseFloat(timelockData.totalAllocationPercentage.replace("%", ""));
        timelockData.unlockAtTGEPercentage = parseFloat(timelockData.unlockAtTGEPercentage.replace("%", ""));
        let totalAmount = TOTAL_HAT_SUPPLY / 100 * timelockData.totalAllocationPercentage;
        let managedAmount = totalAmount - (totalAmount / 100 * timelockData.unlockAtTGEPercentage);
        let startTime = TGE_TIMESTAMP + (60 * 60 * 24 * 30 * timelockData.releaseStartTimeInMonths);
        let endTime = startTime + (60 * 60 * 24 * 30 * timelockData.durationInMonths);
        let periods = (endTime - startTime) / (60 * 60 * 24);
        let revocable = timelockData.revocable;
        let delegate = DELEGATE;
        const tx = await tokenLockFactory.createTokenLock(
            hatToken,
            governance,
            beneficiary,
            web3.utils.toWei(managedAmount.toString()),
            startTime,
            endTime,
            periods,
            0,
            0,
            revocable,
            delegate
        );
        const tokenLockAddress = (await tx.wait()).events[2].args.contractAddress;
        console.log(timelockData.name, "tokenlock address:", tokenLockAddress, "needs to be funded with", totalAmount, "HAT");
    }
  } catch (error) {
    console.error(error);
  }
}

function csvToJSON(csv) {
    var lines = csv.split("\n");
    var result = [];
    var headers;
    headers = ["name", "beneficiary", "totalAllocationPercentage", "revocable", "unlockAtTGEPercentage", "releaseStartTimeInMonths", "durationInMonths"];

    for (var i = 1; i < lines.length; i++) {
        var obj = {};

        if(lines[i] === undefined || lines[i].trim() === "") {
            continue;
        }

        var words = lines[i].split(",");
        for(var j = 0; j < words.length; j++) {
            obj[headers[j].trim()] = words[j];
        }

        result.push(obj);
    }
    return result;
}

main();
