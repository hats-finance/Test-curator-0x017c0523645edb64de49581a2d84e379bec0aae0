const CONFIG = require("../config.js");
const { network } = require("hardhat");

const func = async function (hre) {
  
  const config = CONFIG[network.name];
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();
  
  let governance = config["governance"];
  if (!governance && network.name === "hardhat") {
    governance = deployer;
  }

  let hatGovernanceDelay = config.timelockDelay;

  let executors = config.executors;
  if (!executors && network.name === "hardhat") {
    executors = [governance];
  }

  if (executors.indexOf(governance) === -1) {
    executors.push(governance);
  }

  let managers = config.managers;
  if (!managers && network.name === "hardhat") {
    managers = [governance];
  }

  if (managers.indexOf(governance) === -1) {
    managers.push(governance);
  }

  await deploy('HATTimelockController', {
    from: deployer,
    args: [
      hatGovernanceDelay, // minDelay
      [governance], // proposers
      executors, // executors
      managers // managers
    ],
    log: true,
  });

};
module.exports = func;
func.tags = ['HATTimelockController'];
