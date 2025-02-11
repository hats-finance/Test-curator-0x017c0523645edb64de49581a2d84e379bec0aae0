const HATToken = artifacts.require("./HATTokenMock.sol");
const HATTokenArbitrumBridgeL1 = artifacts.require("./HATTokenArbitrumBridgeL1.sol");
const HATTokenArbitrumBridgeL2 = artifacts.require("./HATTokenArbitrumBridgeL2.sol");
const MockL1CustomGateway = artifacts.require("./MockL1CustomGateway.sol");
const MockL2GatewayRouter = artifacts.require("./MockL2GatewayRouter.sol");
const utils = require("./utils.js");
const { fromRpcSig } = require("ethereumjs-util");
const ethSigUtil = require("eth-sig-util");
const Wallet = require("ethereumjs-wallet").default;

const EIP712Domain = [
  { name: 'name', type: 'string' },
  { name: 'version', type: 'string' },
  { name: 'chainId', type: 'uint256' },
  { name: 'verifyingContract', type: 'address' },
];

function assertVMException(error) {
  let condition =
    error.message.search("VM Exception") > -1 ||
    error.message.search("Transaction reverted") > -1;
  assert.isTrue(
    condition,
    "Expected a VM Exception, got this instead:" + error.message
  );
}

contract("HATToken", (accounts) => {
  it("should put 0 tokens in the first account", async () => {
    const token = await HATToken.new(accounts[0]);
    let balance = await token.balanceOf.call(accounts[0]);
    assert.equal(balance.valueOf(), 0);
  });

  it("should be owned by gov set on creation", async () => {
    const token = await HATToken.new(accounts[0]);
    let governance = await token.owner();
    assert.equal(governance, accounts[0]);
  });

  it("should mint tokens to minter account", async () => {
    let governance, totalSupply, userSupply;
    governance = accounts[0];
    const token = await HATToken.new(governance);
    totalSupply = await token.totalSupply();
    userSupply = await token.balanceOf(governance);
    assert.equal(totalSupply, 0);
    assert.equal(userSupply, 0);
    const cap = web3.utils.toWei("175000");
    await token.setMinter(accounts[0], cap);
    await token.mint(accounts[0], 1000);
    totalSupply = await token.totalSupply();
    userSupply = await token.balanceOf(governance);
    assert.equal(totalSupply, 1000);
    assert.equal(userSupply, 1000);

    try {
      await token.mint("0x0000000000000000000000000000000000000000", 1300);
      throw "cant mint to 0 address";
    } catch (error) {
      assertVMException(error);
    }

    await token.mint(accounts[2], 1300);
    totalSupply = await token.totalSupply();
    userSupply = await token.balanceOf(accounts[2]);
    assert.equal(totalSupply, 2300);
    assert.equal(userSupply, 1300);
  });

  it("only owner can set minter", async () => {
    const token = await HATToken.new(accounts[0]);
    try {
      await token.setMinter(accounts[0], 1000, { from: accounts[1] });
      assert(false, "only owner");
    } catch (ex) {
      assertVMException(ex, "Ownable: caller is not the owner");
    }
    await token.setMinter(accounts[0], 1000);
  });

  it("should allow minting tokens only by minter", async () => {
    const token = await HATToken.new(accounts[0]);
    let governance = await token.owner();
    let totalSupply = await token.totalSupply();
    await token.setMinter(accounts[0], 1000);

    // calling 'mint' as a non-minter throws an error
    try {
      await token.mint(governance, 1000, { from: accounts[1] });
      throw "an error";
    } catch (error) {
      assertVMException(error);
    }

    // and so the supply of tokens should remain unchanged
    let newSupply = await token.totalSupply();
    assert.equal(totalSupply.toNumber(), newSupply.toNumber());
  });

  it("log the Transfer event on mint", async () => {
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], 1000);
    const tx = await token.mint(accounts[1], 1000, { from: accounts[0] });

    assert.equal(tx.logs.length, 1);
    assert.equal(tx.logs[0].event, "Transfer");
    assert.equal(tx.logs[0].args.to, accounts[1]);
    assert.equal(tx.logs[0].args.value.toNumber(), 1000);
  });

  it("mint should be reflected in totalSupply", async () => {
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], 2000);
    await token.mint(accounts[1], 1000, { from: accounts[0] });
    let amount = await token.totalSupply();

    assert.equal(amount, 1000);

    await token.mint(accounts[2], 500, { from: accounts[0] });
    amount = await token.totalSupply();

    assert.equal(amount.toNumber(), 1500);
  });

  it("mint should be reflected in balances", async () => {
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], 1000);

    await token.mint(accounts[1], 1000, { from: accounts[0] });

    const amount = await token.balanceOf(accounts[1]);

    assert.equal(amount.toNumber(), 1000);
  });

  it("totalSupply is 0 on init", async () => {
    const token = await HATToken.new(accounts[0]);
    const totalSupply = await token.totalSupply();

    assert.equal(totalSupply.toNumber(), 0);
  });

  it("burn", async () => {
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], 1000);
    await token.mint(accounts[1], 1000, { from: accounts[0] });
    var amount = await token.balanceOf(accounts[1]);

    assert.equal(amount.toNumber(), 1000);

    await token.burn(100, { from: accounts[1] });

    try {
      await token.burnFrom("0x0000000000000000000000000000000000000000", 0);
      throw "cant burn from 0 address";
    } catch (error) {
      assertVMException(error);
    }

    amount = await token.balanceOf(accounts[1]);

    assert.equal(amount.toNumber(), 900);

    const totalSupply = await token.totalSupply();

    assert.equal(totalSupply.toNumber(), 900);

    try {
      await token.burn(0, { from: accounts[1] });
      throw "cannot burn 0";
    } catch (ex) {
      assertVMException(ex);
    }

    try {
      await token.burn(901, { from: accounts[1] });
      throw "an error";
    } catch (error) {
      assertVMException(error);
    }
  });

  it("getPastVotes ", async () => {
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], 2000);

    try {
      await token.getPastVotes(
        accounts[1],
        (await web3.eth.getBlock("latest")).number + 1
      );
      throw "cant get for future block";
    } catch (error) {
      assertVMException(error);
    }

    // Should start at 0
    let currentVote = await token.getPastVotes(
      accounts[1],
      (await web3.eth.getBlock("latest")).number - 1
    );
    assert.equal(currentVote, 0);

    await token.mint(accounts[1], 100);
    currentVote = await token.getVotes(accounts[1]);
    assert.equal(currentVote, 0);
    await token.delegate(accounts[1], { from: accounts[1] });
    currentVote = await token.getVotes(accounts[1]);
    assert.equal(currentVote, 100);
    let currentBlockNumber = (await web3.eth.getBlock("latest")).number;
    let firstBlockNumber = currentBlockNumber;
    //increment block number
    await utils.increaseTime(40);
    currentVote = await token.getPastVotes(accounts[1], currentBlockNumber);
    assert.equal(currentVote, 100);
    await token.burn(50, { from: accounts[1] });
    currentBlockNumber = (await web3.eth.getBlock("latest")).number;
    //increment block number
    await utils.increaseTime(40);
    currentVote = await token.getPastVotes(accounts[1], currentBlockNumber);
    assert.equal(currentVote, 50);

    // Should be 0 before first action
    currentVote = await token.getPastVotes(accounts[1], 0);
    assert.equal(currentVote, 0);

    // Check old votes count
    currentVote = await token.getPastVotes(accounts[1], firstBlockNumber);
    assert.equal(currentVote, 100);

    // Check old votes count
    currentVote = await token.getPastVotes(
      accounts[1],
      currentBlockNumber - 1
    );
    assert.equal(currentVote, 100);

    // Move block
    await token.setMinter(accounts[0], 2000);
    await token.setMinter(accounts[0], 2000);
    await token.setMinter(accounts[0], 2000);
    await token.burn(1, { from: accounts[1] });
    // Check old votes count
    currentVote = await token.getPastVotes(accounts[1], currentBlockNumber);
    assert.equal(currentVote.toString(), "50");
    currentVote = await token.getPastVotes(
      accounts[1],
      currentBlockNumber + 2
    );
    assert.equal(currentVote.toString(), "50");
  });

  it("delegate twice in same block ", async () => {
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], 2000);

    // Should start at 0
    let currentVote = await token.getPastVotes(
      accounts[1],
      (await web3.eth.getBlock("latest")).number - 1
    );
    assert.equal(currentVote, 0);

    await token.mint(accounts[1], 100);
    currentVote = await token.getVotes(accounts[1]);
    assert.equal(currentVote, 0);
    await token.delegateTwice(accounts[1], accounts[2], { from: accounts[1] });
    currentVote = await token.getVotes(accounts[1]);
    assert.equal(currentVote, 100);
  });

  it("CappedToken ", async () => {
    const token = await HATToken.new(accounts[0]);
    const cap = web3.utils.toWei("100000000");
    await token.setMinter(accounts[0], web3.utils.toWei("160000000"));
    await token.mint(accounts[1], cap);

    var amount = await token.balanceOf(accounts[1]);

    assert.equal(amount, cap);

    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, cap);

    try {
      await token.mint(accounts[1], 1);
      throw "an error";
    } catch (error) {
      assertVMException(error);
    }

    totalSupply = await token.totalSupply();

    assert.equal(totalSupply, cap);
  });

  it("master minting is capped ", async () => {
    const master = accounts[2];
    const token = await HATToken.new(accounts[0]);
    const cap = web3.utils.toWei("175000");
    await token.setMinter(master, cap);

    await token.mint(accounts[1], cap, { from: master });

    var amount = await token.balanceOf(accounts[1]);

    assert.equal(amount, cap);

    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, cap);

    try {
      await token.mint(accounts[1], 1, { from: master });
      throw "an error";
    } catch (error) {
      assertVMException(error);
    }

    totalSupply = await token.totalSupply();

    assert.equal(totalSupply, cap);
  });

  describe("onlyMinter", () => {
    it("mint by minter", async () => {
      const token = await HATToken.new(accounts[0]);
      await token.setMinter(accounts[0], 10);
      try {
        await token.mint(accounts[1], 10, { from: accounts[0] });
      } catch (ex) {
        assert(false, "minter could not mint");
      }

      await token.setMinter(accounts[0], 5);

      try {
        await token.mint(accounts[1], 4, { from: accounts[0] });
      } catch (ex) {
        assert(false, "minter could not mint");
      }

      try {
        await token.mint(accounts[1], 2, { from: accounts[0] });
        assert(false, "minter cannot mint above limit");
      } catch (ex) {
        assertVMException(ex);
      }

      try {
        await token.mint(accounts[1], 1, { from: accounts[0] });
      } catch (ex) {
        assert(false, "minter could not mint");
      }

      try {
        await token.mint(accounts[1], 0, { from: accounts[0] });
        throw "cannot mint 0";
      } catch (ex) {
        assertVMException(ex);
      }
    });

    it("mint by not minter", async () => {
      const token = await HATToken.new(accounts[0]);
      await token.setMinter(accounts[0], 10);
      try {
        await token.mint(accounts[1], 10, { from: accounts[1] });
      } catch (ex) {
        return;
      }

      try {
        await token.mint(accounts[1], 0, { from: accounts[1] });
        throw "cannot mint 0";
      } catch (ex) {
        assertVMException(error);
      }

      assert(false, "non-minter was able to mint");
    });
  });

  it("increase/decrease allowance", async () => {
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(accounts[1], web3.utils.toWei("100"));
    let value = web3.utils.toWei("10");
    try {
      await token.increaseAllowance(utils.NULL_ADDRESS, value, {
        from: accounts[1],
      });
      assert(false, "spender cannot be null");
    } catch (ex) {
      assertVMException(ex);
    }
    await token.increaseAllowance(accounts[2], value, { from: accounts[1] });
    assert.equal(
      (await token.allowance(accounts[1], accounts[2])).toString(),
      value.toString()
    );
    await token.increaseAllowance(accounts[2], value, { from: accounts[1] });
    assert.equal(
      (await token.allowance(accounts[1], accounts[2])).toString(),
      web3.utils.toWei("20")
    );

    try {
      await token.decreaseAllowance(utils.NULL_ADDRESS, value, {
        from: accounts[1],
      });
      assert(false, "spender cannot be null");
    } catch (ex) {
      assertVMException(ex);
    }

    await token.decreaseAllowance(accounts[2], value, { from: accounts[1] });
    assert.equal(
      (await token.allowance(accounts[1], accounts[2])).toString(),
      value.toString()
    );
    try {
      await token.decreaseAllowance(accounts[2], web3.utils.toWei("20"), {
        from: accounts[1],
      });
      assert(false, "cannot decrease more than allowence");
    } catch (ex) {
      assertVMException(ex);
    }
  });

  it("transfer from and to 0 address not allowed", async () => {
    const token = await HATToken.new(accounts[0]);
    await token.setTransferable({from: accounts[0]});
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(accounts[1], web3.utils.toWei("100"));
    let value = web3.utils.toWei("10");

    await token.approve(accounts[2], value, { from: accounts[1] });

    assert.equal(
      (await token.allowance(accounts[1], accounts[2])).toString(),
      value.toString()
    );

    try {
      await token.transferFrom(
        accounts[1],
        "0x0000000000000000000000000000000000000000",
        web3.utils.toWei("1"),
        { from: accounts[2] }
      );
      assert(false, "cannot send to 0 address");
    } catch (ex) {
      assertVMException(ex);
    }

    try {
      await token.transferFromZero(accounts[3], web3.utils.toWei("1"), {
        from: accounts[2],
      });
      assert(false, "cannot send from 0 address");
    } catch (ex) {
      assertVMException(ex);
    }
  });

  it("approve", async () => {
    const token = await HATToken.new(accounts[0]);
    await token.setTransferable({from: accounts[0]});
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(accounts[1], web3.utils.toWei("100"));
    let value = web3.utils.toWei("10");

    await token.approve(accounts[2], value, { from: accounts[1] });

    assert.equal(
      (await token.allowance(accounts[1], accounts[2])).toString(),
      value.toString()
    );

    let recipientBalance = (await token.balanceOf(accounts[3])).toString();
    assert.equal(recipientBalance, "0");

    await token.transferFrom(accounts[1], accounts[3], web3.utils.toWei("5"), {
      from: accounts[2],
    });

    recipientBalance = (await token.balanceOf(accounts[3])).toString();
    assert.equal(recipientBalance, web3.utils.toWei("5"));

    try {
      await token.transferFrom(
        accounts[1],
        accounts[3],
        web3.utils.toWei("6"),
        { from: accounts[2] }
      );
      assert(false, "cannot send above amount allowed");
    } catch (ex) {
      assertVMException(ex);
    }

    recipientBalance = (await token.balanceOf(accounts[3])).toString();
    assert.equal(recipientBalance, web3.utils.toWei("5"));

    await token.transferFrom(accounts[1], accounts[3], web3.utils.toWei("5"), {
      from: accounts[2],
    });
    recipientBalance = (await token.balanceOf(accounts[3])).toString();
    assert.equal(recipientBalance, web3.utils.toWei("10"));
  });

  it("approve max", async () => {
    const token = await HATToken.new(accounts[0]);
    await token.setTransferable({from: accounts[0]});
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(accounts[1], web3.utils.toWei("100"));
    let value = web3.utils
      .toBN(2)
      .pow(web3.utils.toBN(256))
      .sub(web3.utils.toBN(1));

    await token.approve(accounts[2], value.sub(web3.utils.toBN(1)), {from: accounts[1]});
    await token.approve(accounts[2], value, { from: accounts[1] });

    assert.equal(
      (await token.allowance(accounts[1], accounts[2])).toString(),
      web3.utils
        .toBN(2)
        .pow(web3.utils.toBN(256))
        .sub(web3.utils.toBN(1))
        .toString()
    );
    await token.transferFrom(accounts[1], accounts[3], web3.utils.toWei("5"), {
      from: accounts[2],
    });
    recipientBalance = (await token.balanceOf(accounts[3])).toString();
    assert.equal(recipientBalance, web3.utils.toWei("5"));

    try {
      await token.increaseAllowance(accounts[2], web3.utils.toBN(1), {
        from: accounts[1],
      });
      assert(false, "cannot allow amount larger than 256 bits");
    } catch (ex) {
      assertVMException(ex);
    }
  });

  const Permit = [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ];

  const buildDataPermit = (
    chainId,
    verifyingContract,
    owner,
    spender,
    value,
    nonce,
    deadline
  ) => ({
    primaryType: "Permit",
    types: { EIP712Domain, Permit },
    domain: { name: "hats.finance", version: "1", chainId, verifyingContract },
    message: { owner, spender, value, nonce, deadline },
  });

  it("permit", async () => {
    const wallet = Wallet.generate();
    const owner = wallet.getAddressString();
    const token = await HATToken.new(accounts[0]);
    await token.setTransferable({from: accounts[0]});
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(owner, web3.utils.toWei("100"));

    let currentBlockTimestamp = (await web3.eth.getBlock("latest")).timestamp;
    let chainId = await token.getChainId();
    let value = web3.utils.toWei("10");
    let nonce = 0;
    let deadline = currentBlockTimestamp + 7 * 24 * 3600;

    const data = buildDataPermit(
      chainId,
      token.address,
      owner,
      accounts[2],
      value,
      nonce,
      deadline
    );
    const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), {
      data,
    });
    const { v, r, s } = fromRpcSig(signature);
    await token.permit(owner, accounts[2], value, deadline, v, r, s);

    assert.equal((await token.nonces(owner)).toString(), "1");
    assert.equal(
      (await token.allowance(owner, accounts[2])).toString(),
      value.toString()
    );

    let recipientBalance = (await token.balanceOf(accounts[3])).toString();
    assert.equal(recipientBalance, "0");

    await token.transferFrom(owner, accounts[3], web3.utils.toWei("5"), {
      from: accounts[2],
    });

    recipientBalance = (await token.balanceOf(accounts[3])).toString();
    assert.equal(recipientBalance, web3.utils.toWei("5"));

    try {
      await token.transferFrom(owner, accounts[3], web3.utils.toWei("6"), {
        from: accounts[2],
      });
      assert(false, "cannot send above amount allowed");
    } catch (ex) {
      assertVMException(ex);
    }

    recipientBalance = (await token.balanceOf(accounts[3])).toString();
    assert.equal(recipientBalance, web3.utils.toWei("5"));

    await token.transferFrom(owner, accounts[3], web3.utils.toWei("5"), {
      from: accounts[2],
    });
    recipientBalance = (await token.balanceOf(accounts[3])).toString();
    assert.equal(recipientBalance, web3.utils.toWei("10"));
  });

  it("permit max", async () => {
    const wallet = Wallet.generate();
    const owner = wallet.getAddressString();
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(owner, web3.utils.toWei("100"));

    let currentBlockTimestamp = (await web3.eth.getBlock("latest")).timestamp;
    let chainId = await web3.eth.net.getId();
    let value = web3.utils
      .toBN(2)
      .pow(web3.utils.toBN(256))
      .sub(web3.utils.toBN(1));
    let nonce = 0;
    let deadline = currentBlockTimestamp + 7 * 24 * 3600;
    // Permit all
    const data = buildDataPermit(
      chainId,
      token.address,
      owner,
      accounts[2],
      value,
      nonce,
      deadline
    );
    const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), {
      data,
    });
    const { v, r, s } = fromRpcSig(signature);
    await token.permit(owner, accounts[2], value, deadline, v, r, s);

    assert.equal((await token.nonces(owner)).toString(), "1");
    assert.equal(
      (await token.allowance(owner, accounts[2])).toString(),
      web3.utils
        .toBN(2)
        .pow(web3.utils.toBN(256))
        .sub(web3.utils.toBN(1))
        .toString()
    );
  });

  it("can't replay permit", async () => {
    const wallet = Wallet.generate();
    const owner = wallet.getAddressString();
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(owner, web3.utils.toWei("100"));

    let currentBlockTimestamp = (await web3.eth.getBlock("latest")).timestamp;
    let chainId = await web3.eth.net.getId();
    let value = web3.utils.toWei("10");
    let nonce = 0;
    let deadline = currentBlockTimestamp + 7 * 24 * 3600;

    const data = buildDataPermit(
      chainId,
      token.address,
      owner,
      accounts[2],
      value,
      nonce,
      deadline
    );
    const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), {
      data,
    });
    const { v, r, s } = fromRpcSig(signature);
    await token.permit(owner, accounts[2], value, deadline, v, r, s);

    assert.equal((await token.nonces(owner)).toString(), "1");
    assert.equal(
      (await token.allowance(owner, accounts[2])).toString(),
      value.toString()
    );

    try {
      await token.permit(owner, accounts[2], value, deadline, v, r, s);
      assert(false, "cannot replay signed permit message");
    } catch (ex) {
      assertVMException(ex);
    }
  });

  it("can't use signed permit after deadline", async () => {
    const wallet = Wallet.generate();
    const owner = wallet.getAddressString();
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(owner, web3.utils.toWei("100"));

    let currentBlockTimestamp = (await web3.eth.getBlock("latest")).timestamp;
    let chainId = await web3.eth.net.getId();
    let value = web3.utils.toWei("10");
    let nonce = 0;
    let deadline = currentBlockTimestamp + 7 * 24 * 3600;

    const data = buildDataPermit(
      chainId,
      token.address,
      owner,
      accounts[2],
      value,
      nonce,
      deadline
    );
    const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), {
      data,
    });
    const { v, r, s } = fromRpcSig(signature);

    await utils.increaseTime(7 * 24 * 3600);

    try {
      await token.permit(owner, accounts[2], value, deadline, v, r, s);
      assert(false, "cannot replay signed permit message");
    } catch (ex) {
      assertVMException(ex);
    }

    assert.equal((await token.nonces(owner)).toString(), "0");
    assert.equal((await token.allowance(owner, accounts[2])).toString(), "0");
  });

  const Delegation = [
    { name: "delegatee", type: "address" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ];

  const buildDataDelegation = (
    chainId,
    verifyingContract,
    delegatee,
    nonce,
    expiry
  ) => ({
    primaryType: "Delegation",
    types: { EIP712Domain, Delegation },
    domain: { name: "hats.finance", version: "1", chainId, verifyingContract },
    message: { delegatee, nonce, expiry },
  });

  it("delegateBySig", async () => {
    const wallet = Wallet.generate();
    const owner = wallet.getAddressString();
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(owner, web3.utils.toWei("100"));

    let currentBlockTimestamp = (await web3.eth.getBlock("latest")).timestamp;
    let chainId = await web3.eth.net.getId();
    let nonce = 0;
    let expiry = currentBlockTimestamp + 7 * 24 * 3600;

    const data = buildDataDelegation(
      chainId,
      token.address,
      accounts[2],
      nonce,
      expiry
    );
    const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), {
      data,
    });
    const { v, r, s } = fromRpcSig(signature);

    // try {
    //     await token.delegateBySig(accounts[3], nonce, expiry, v, r, s);
    //     assert(false, 'cant delegate with wrong signature');
    // } catch (ex) {
    //     assertVMException(ex);
    // }
    await token.delegateBySig(accounts[2], nonce, expiry, v, r, s);

    assert.equal(await token.delegates(owner), accounts[2]);
  });

  it("can't replay delegateBySig", async () => {
    const wallet = Wallet.generate();
    const owner = wallet.getAddressString();
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(owner, web3.utils.toWei("100"));

    let currentBlockTimestamp = (await web3.eth.getBlock("latest")).timestamp;
    let chainId = await web3.eth.net.getId();
    let nonce = 0;
    let expiry = currentBlockTimestamp + 7 * 24 * 3600;

    const data = buildDataDelegation(
      chainId,
      token.address,
      accounts[2],
      nonce,
      expiry
    );
    const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), {
      data,
    });
    const { v, r, s } = fromRpcSig(signature);
    await token.delegateBySig(accounts[2], nonce, expiry, v, r, s);

    assert.equal(await token.delegates(owner), accounts[2]);
    try {
      await token.delegateBySig(accounts[2], nonce, expiry, v, r, s);
      assert(false, "cannot replay signed delegation message");
    } catch (ex) {
      assertVMException(ex);
    }
  });

  it("can't use signed delegation after expiry", async () => {
    const wallet = Wallet.generate();
    const owner = wallet.getAddressString();
    const token = await HATToken.new(accounts[0]);
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(owner, web3.utils.toWei("100"));

    let currentBlockTimestamp = (await web3.eth.getBlock("latest")).timestamp;
    let chainId = await web3.eth.net.getId();
    let nonce = 0;
    let expiry = currentBlockTimestamp + 7 * 24 * 3600;

    const data = buildDataDelegation(
      chainId,
      token.address,
      accounts[2],
      nonce,
      expiry
    );
    const signature = ethSigUtil.signTypedMessage(wallet.getPrivateKey(), {
      data,
    });
    const { v, r, s } = fromRpcSig(signature);
    await utils.increaseTime(7 * 24 * 3600);
    try {
      await token.delegateBySig(accounts[2], nonce, expiry, v, r, s);
      assert(false, "cannot replay signed permit message");
    } catch (ex) {
      assertVMException(ex);
    }

    assert.equal((await token.nonces(owner)).toString(), "0");
    assert.equal(
      await token.delegates(owner),
      "0x0000000000000000000000000000000000000000"
    );
  });

  describe("setTransferable", () => {
    it("can only be called by owner", async () => {
      const token = await HATToken.new(accounts[0]);
      assert.equal(await token.transferable(), false);
      try {
        await token.setTransferable({from: accounts[1]});
        assert(false, "setTransferable can only be called by owner");
      } catch (ex) {
        assertVMException(ex);
      }
      await token.setTransferable({from: accounts[0]});
      assert.equal(await token.transferable(), true);
    });

    it("emits TransferableSet event", async () => {
      const token = await HATToken.new(accounts[0]);
      const tx = await token.setTransferable({from: accounts[0]});
      assert.equal(tx.logs.length, 1);
      assert.equal(tx.logs[0].event, "TransferableSet");
    });

    it("cannot be changed back", async () => {
      const token = await HATToken.new(accounts[0]);
      assert.equal(await token.transferable(), false);
      await token.setTransferable({from: accounts[0]});
      assert.equal(await token.transferable(), true);
      await token.setTransferable({from: accounts[0]});
      assert.equal(await token.transferable(), true);
    });

    it("transfer allowed after", async () => {
      const token = await HATToken.new(accounts[0]);
      await token.setTransferable({from: accounts[0]});
      await token.setMinter(accounts[0], web3.utils.toWei("1000"));
      await token.mint(accounts[1], web3.utils.toWei("100"));
      await token.transfer(accounts[2], web3.utils.toWei("1"),{ from: accounts[1] });
      recipientBalance = (await token.balanceOf(accounts[2])).toString();
      assert.equal(recipientBalance, web3.utils.toWei("1"));
    });

    it("transfer not allowed before", async () => {
      const token = await HATToken.new(accounts[0]);
      await token.setMinter(accounts[0], web3.utils.toWei("1000"));
      await token.mint(accounts[1], web3.utils.toWei("100"));

      try {
        await token.transfer(
          accounts[2],
          web3.utils.toWei("1"),
          { from: accounts[1] }
        );
        assert(false, "cannot transfer before setTransferable");
      } catch (ex) {
        assertVMException(ex, "TransfersDisabled");
      }
    });
  });

  it("test HATTokenArbitrumBridgeL1", async () => {
    const mockGateway = await MockL1CustomGateway.new();
    const mockRouter = await MockL2GatewayRouter.new();
    const token = await HATTokenArbitrumBridgeL1.new(mockGateway.address, mockRouter.address, accounts[0]);
    await token.setTransferable({from: accounts[0]});
    await token.setMinter(accounts[0], web3.utils.toWei("1000"));
    await token.mint(accounts[1], web3.utils.toWei("100"));
    try {
      await token.isArbitrumEnabled();
      assert(false, "This method is not enabled");
    } catch (ex) {
      assertVMException(ex);
    }

    try {
      await token.registerTokenOnL2(
        accounts[0],
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        accounts[0],
        { from: accounts[1] }
      );
      assert(false, "only owner");
    } catch (ex) {
      assertVMException(ex, "Ownable: caller is not the owner");
    }

    await token.registerTokenOnL2(
      accounts[0],
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      accounts[0]
    );

    let value = web3.utils.toWei("10");

    await token.approve(accounts[2], value, { from: accounts[1] });

    await token.transferFrom(accounts[1], accounts[3], web3.utils.toWei("5"), {
      from: accounts[2],
    });

    let recipientBalance = (await token.balanceOf(accounts[3])).toString();
    assert.equal(recipientBalance, web3.utils.toWei("5"));
  });

  it("test HATTokenArbitrumBridgeL2", async () => {
    const token = await HATTokenArbitrumBridgeL2.new(accounts[1], accounts[2]);
    try {
      await token.bridgeMint(
        accounts[0],
        web3.utils.toWei("100")
      );
      assert(false, "only L2 gateway");
    } catch (ex) {
      assertVMException(ex);
    }

    await token.bridgeMint(
      accounts[0],
      web3.utils.toWei("100"),
      { from: accounts[1] }
    );

    let balance = await token.balanceOf.call(accounts[0]);
    assert.equal(balance.valueOf(), web3.utils.toWei("100"));

    try {
      await token.bridgeBurn(
        accounts[0],
        web3.utils.toWei("100")
      );
      assert(false, "only L2 gateway");
    } catch (ex) {
      assertVMException(ex);
    }

    await token.bridgeBurn(
      accounts[0],
      web3.utils.toWei("100"),
      { from: accounts[1] }
    );

    balance = await token.balanceOf.call(accounts[0]);
    assert.equal(balance.valueOf(), 0);
  });

});
