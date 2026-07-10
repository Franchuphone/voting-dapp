import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { getAddress } from "viem";

const { viem } = await network.create();

async function deployFactory() {
  const [owner, alice, bob] = await viem.getWalletClients();
  const factory = await viem.deployContract("VotingFactory");
  return { factory, owner, alice, bob };
}

type Deployed = Awaited<ReturnType<typeof deployFactory>>;

// The public mapping getter `deployments(index)` returns a positional tuple
// [contractAddress, creator, name, createdAt], not a named object.

describe("VotingFactory", () => {
  let factory: Deployed["factory"];
  let owner: Deployed["owner"];
  let alice: Deployed["alice"];
  let bob: Deployed["bob"];

  beforeEach(async () => {
    ({ factory, owner, alice, bob } = await deployFactory());
  });

  it("starts with zero deployments", async () => {
    assert.equal(await factory.read.deploymentsCount(), 0n);
  });

  it("records a deployment on createVoting", async () => {
    await factory.write.createVoting(["Session A"]);

    assert.equal(await factory.read.deploymentsCount(), 1n);

    const [contractAddress, creator, name, createdAt] =
      await factory.read.deployments([0n]);
    assert.equal(getAddress(creator), getAddress(owner.account.address));
    assert.equal(name, "Session A");
    assert.ok(BigInt(contractAddress) !== 0n, "voting address should be set");
    assert.ok(createdAt > 0n);
  });

  it("transfers ownership of the new Voting to the caller", async () => {
    await factory.write.createVoting(["Session A"], { account: alice.account });

    const [contractAddress] = await factory.read.deployments([0n]);
    const voting = await viem.getContractAt("Voting", contractAddress);
    assert.equal(
      getAddress(await voting.read.owner()),
      getAddress(alice.account.address),
    );
  });

  it("emits VotingCreated with the index", async () => {
    await viem.assertions.emit(
      factory.write.createVoting(["Session A"]),
      factory,
      "VotingCreated",
    );
  });

  it("increments the index and records each creator", async () => {
    await factory.write.createVoting(["A"], { account: alice.account });
    await factory.write.createVoting(["B"], { account: bob.account });

    assert.equal(await factory.read.deploymentsCount(), 2n);

    const [address0, creator0, name0] = await factory.read.deployments([0n]);
    const [address1, creator1, name1] = await factory.read.deployments([1n]);

    assert.equal(name0, "A");
    assert.equal(getAddress(creator0), getAddress(alice.account.address));
    assert.equal(name1, "B");
    assert.equal(getAddress(creator1), getAddress(bob.account.address));
    assert.notEqual(getAddress(address0), getAddress(address1));
  });
});
