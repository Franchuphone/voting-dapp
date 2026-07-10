/**
 * @file Integration tests for the `Voting` contract.
 * @summary Exercises the full workflow (voter registration → proposals → voting →
 *   tally) plus the hardening guards: unbounded-gas DoS resistance, duplicate-proposal
 *   rejection, deterministic tie-breaking, and the zero-address / no-proposal / no-vote
 *   guards. Runs on `node:test` and drives the contract through viem clients.
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import { getAddress } from "viem";

/** In-process Hardhat network connection exposing the viem helpers. */
const { viem } = await network.create();

/** Mirror of the contract's `WorkflowStatus` enum (values must match on-chain order). */
enum WorkflowStatus {
  RegisteringVoters,
  ProposalsRegistrationStarted,
  ProposalsRegistrationEnded,
  VotingSessionStarted,
  VotingSessionEnded,
  VotesTallied,
}

/**
 * Deploys a fresh `Voting` contract and returns it alongside the wallet clients used
 * throughout the suite (deployer is the owner).
 * @returns The deployed contract and the owner / three voters / a non-voter clients.
 */
async function setUpSmartContract() {
  const [owner, voter1, voter2, voter3, nonVoter] =
    await viem.getWalletClients();
  const votingContract = await viem.deployContract("Voting");
  return { votingContract, owner, voter1, voter2, voter3, nonVoter };
}

/** Resolved shape of {@link setUpSmartContract}, used to type the shared fixtures. */
type Deployed = Awaited<ReturnType<typeof setUpSmartContract>>;

describe("Voting Contract", () => {
  let votingContract: Deployed["votingContract"];
  let owner: Deployed["owner"];
  let voter1: Deployed["voter1"];
  let voter2: Deployed["voter2"];
  let voter3: Deployed["voter3"];
  let nonVoter: Deployed["nonVoter"];

  /**
   * Registers three voters and opens the proposals-registration phase.
   * Leaves the workflow in `ProposalsRegistrationStarted`.
   */
  async function AddThreeVotersAndStartsProposalRegistration() {
    await votingContract.write.addVoter([voter1.account.address]);
    await votingContract.write.addVoter([voter2.account.address]);
    await votingContract.write.addVoter([voter3.account.address]);
    await votingContract.write.startProposalsRegistering();
  }
  /**
   * Builds on the previous helper: adds four real proposals (indices 1–4, since 0 is the
   * BLANK VOTE), closes registration and opens voting.
   * Leaves the workflow in `VotingSessionStarted`.
   */
  async function AddFourProposalsAndStartsVotingSession() {
    await AddThreeVotersAndStartsProposalRegistration();
    await votingContract.write.addProposal(["Proposal A"], {
      account: voter1.account,
    });
    await votingContract.write.addProposal(["Proposal B"], {
      account: voter2.account,
    });
    await votingContract.write.addProposal(["Proposal C"], {
      account: voter1.account,
    });
    await votingContract.write.addProposal(["Proposal D"], {
      account: voter3.account,
    });
    await votingContract.write.endProposalsRegistering();
    await votingContract.write.startVotingSession();
  }
  /**
   * Full setup through the end of voting: two votes for proposal 1, one for proposal 2,
   * then closes the session. Leaves the workflow in `VotingSessionEnded`, ready to tally
   * (expected winner: proposal 1).
   */
  async function fullSetup() {
    await AddFourProposalsAndStartsVotingSession();
    await votingContract.write.setVote([1n], { account: voter1.account });
    await votingContract.write.setVote([1n], { account: voter2.account });
    await votingContract.write.setVote([2n], { account: voter3.account });
    await votingContract.write.endVotingSession();
  }

  beforeEach(async () => {
    ({ votingContract, owner, voter1, voter2, voter3, nonVoter } =
      await setUpSmartContract());
  });

  ////////////////////////////////////////////////
  //                DEPLOYMENT                  //
  ////////////////////////////////////////////////

  describe("Initial deployment", () => {
    it("Should set the right owner", async () => {
      assert.equal(
        getAddress(await votingContract.read.owner()),
        getAddress(owner.account.address),
      );
    });

    it("Should start in RegisteringVoters status", async () => {
      assert.equal(
        await votingContract.read.workflowStatus(),
        WorkflowStatus.RegisteringVoters,
      );
    });

    it("Should initialize winningProposalID to 0", async () => {
      assert.equal(await votingContract.read.winningProposalID(), 0n);
    });
  });

  ////////////////////////////////////////////////
  //                GETTERS (onlyVoters)        //
  ////////////////////////////////////////////////

  describe("Getters (onlyVoters)", () => {
    beforeEach(async () => {
      await AddThreeVotersAndStartsProposalRegistration();
    });

    it("Should return voter information called by another voter", async () => {
      const voterInfo = await votingContract.read.getVoter(
        [voter2.account.address],
        { account: voter1.account },
      );
      assert.equal(voterInfo.isRegistered, true);
      assert.equal(voterInfo.hasVoted, false);
      assert.equal(voterInfo.votedProposalId, 0n);
    });

    it("Should revert getVoter if caller is not a voter", async () => {
      await viem.assertions.revertWith(
        votingContract.read.getVoter([voter1.account.address], {
          account: nonVoter.account,
        }),
        "You're not a voter",
      );
    });

    it("Should return proposal information called by a voter", async () => {
      const proposal = await votingContract.read.getOneProposal([0n], {
        account: voter1.account,
      });
      assert.equal(proposal.description, "BLANK VOTE");
      assert.equal(proposal.voteCount, 0n);
    });

    it("Should revert getOneProposal if caller is not a voter", async () => {
      await viem.assertions.revertWith(
        votingContract.read.getOneProposal([0n], { account: nonVoter.account }),
        "You're not a voter",
      );
    });

    it("Should revert getOneProposal on non existing id", async () => {
      // ONLY BLANK VOTE EXISTS AT INDEX 0
      await viem.assertions.revert(
        votingContract.read.getOneProposal([99n], { account: voter1.account }),
      );
    });

    it("Should return non registered on calling getVoter with a non registered address", async () => {
      const voterInfo = await votingContract.read.getVoter(
        [owner.account.address],
        { account: voter1.account },
      );
      assert.equal(voterInfo.isRegistered, false);
    });
  });

  ////////////////////////////////////////////////
  //              WORKFLOW TRANSITIONS          //
  ////////////////////////////////////////////////

  describe("Workflow Transitions", () => {
    ///////// START PROPOSALS REGISTERING /////////

    describe("startProposalsRegistering", () => {
      it("Should update status to ProposalsRegistrationStarted", async () => {
        await votingContract.write.startProposalsRegistering();
        assert.equal(
          await votingContract.read.workflowStatus(),
          WorkflowStatus.ProposalsRegistrationStarted,
        );
      });

      it("Should emit event with correct args on startProposalsRegistering", async () => {
        await viem.assertions.emitWithArgs(
          votingContract.write.startProposalsRegistering(),
          votingContract,
          "WorkflowStatusChange",
          [
            WorkflowStatus.RegisteringVoters,
            WorkflowStatus.ProposalsRegistrationStarted,
          ],
        );
      });

      it("Should revert if caller is not owner", async () => {
        await viem.assertions.revertWithCustomError(
          votingContract.write.startProposalsRegistering({
            account: voter1.account,
          }),
          votingContract,
          "OwnableUnauthorizedAccount",
        );
      });

      it("Should revert startProposalsRegistering if not in RegisteringVoters status", async () => {
        assert.equal(
          await votingContract.read.workflowStatus(),
          WorkflowStatus.RegisteringVoters,
        );
        await votingContract.write.startProposalsRegistering();
        await viem.assertions.revertWith(
          votingContract.write.startProposalsRegistering(),
          "Registering proposals cant be started now",
        );
      });

      it("Should initialize BLANK VOTE proposal at index 0", async () => {
        await AddThreeVotersAndStartsProposalRegistration();
        const blankVote = await votingContract.read.getOneProposal([0n], {
          account: voter1.account,
        });
        assert.equal(blankVote.description, "BLANK VOTE");
        assert.equal(blankVote.voteCount, 0n);
      });
    });

    ///////// END PROPOSALS REGISTERING /////////

    describe("endProposalsRegistering", () => {
      beforeEach(async () => {
        await AddThreeVotersAndStartsProposalRegistration();
        // at least one real proposal is required to end registration
        await votingContract.write.addProposal(["Proposal A"], {
          account: voter1.account,
        });
      });

      it("Should update status to endProposalsRegistering", async () => {
        await votingContract.write.endProposalsRegistering();
        assert.equal(
          await votingContract.read.workflowStatus(),
          WorkflowStatus.ProposalsRegistrationEnded,
        );
      });

      it("Should emit event with correct args on endProposalsRegistering", async () => {
        await viem.assertions.emitWithArgs(
          votingContract.write.endProposalsRegistering(),
          votingContract,
          "WorkflowStatusChange",
          [
            WorkflowStatus.ProposalsRegistrationStarted,
            WorkflowStatus.ProposalsRegistrationEnded,
          ],
        );
      });

      it("Should revert if caller is not owner", async () => {
        await viem.assertions.revertWithCustomError(
          votingContract.write.endProposalsRegistering({
            account: voter1.account,
          }),
          votingContract,
          "OwnableUnauthorizedAccount",
        );
      });

      it("Should revert endProposalsRegistering if not in ProposalsRegistrationStarted status", async () => {
        assert.equal(
          await votingContract.read.workflowStatus(),
          WorkflowStatus.ProposalsRegistrationStarted,
        );
        await votingContract.write.endProposalsRegistering();
        await viem.assertions.revertWith(
          votingContract.write.endProposalsRegistering(),
          "Registering proposals havent started yet",
        );
      });

      it("Should revert endProposalsRegistering if no real proposal was registered", async () => {
        // fresh session with voters + open registration but no real proposal
        const { votingContract: emptyVoting, voter1: v1 } =
          await setUpSmartContract();
        await emptyVoting.write.addVoter([v1.account.address]);
        await emptyVoting.write.startProposalsRegistering();
        await viem.assertions.revertWith(
          emptyVoting.write.endProposalsRegistering(),
          "No proposal registered",
        );
      });
    });

    //////// START VOTING SESSION /////////

    describe("startVotingSession", () => {
      beforeEach(async () => {
        await AddThreeVotersAndStartsProposalRegistration();
        // at least one real proposal is required to end registration
        await votingContract.write.addProposal(["Proposal A"], {
          account: voter1.account,
        });
        await votingContract.write.endProposalsRegistering();
      });

      it("Should update status to VotingSessionStarted", async () => {
        await votingContract.write.startVotingSession();
        assert.equal(
          await votingContract.read.workflowStatus(),
          WorkflowStatus.VotingSessionStarted,
        );
      });

      it("Should emit event with correct args on startVotingSession", async () => {
        await viem.assertions.emitWithArgs(
          votingContract.write.startVotingSession(),
          votingContract,
          "WorkflowStatusChange",
          [
            WorkflowStatus.ProposalsRegistrationEnded,
            WorkflowStatus.VotingSessionStarted,
          ],
        );
      });

      it("Should revert if caller is not owner", async () => {
        await viem.assertions.revertWithCustomError(
          votingContract.write.startVotingSession({ account: voter1.account }),
          votingContract,
          "OwnableUnauthorizedAccount",
        );
      });

      it("Should revert startVotingSession if not in ProposalsRegistrationEnded status", async () => {
        assert.equal(
          await votingContract.read.workflowStatus(),
          WorkflowStatus.ProposalsRegistrationEnded,
        );
        await votingContract.write.startVotingSession();
        await viem.assertions.revertWith(
          votingContract.write.startVotingSession(),
          "Registering proposals phase is not finished",
        );
      });
    });

    //////// END VOTING SESSION /////////

    describe("endVotingSession", () => {
      beforeEach(async () => {
        await AddFourProposalsAndStartsVotingSession();
        // at least one vote is required to end the voting session
        await votingContract.write.setVote([1n], { account: voter1.account });
      });

      it("Should update status to VotingSessionEnded", async () => {
        await votingContract.write.endVotingSession();
        assert.equal(
          await votingContract.read.workflowStatus(),
          WorkflowStatus.VotingSessionEnded,
        );
      });

      it("Should emit event with correct args on endVotingSession", async () => {
        await viem.assertions.emitWithArgs(
          votingContract.write.endVotingSession(),
          votingContract,
          "WorkflowStatusChange",
          [
            WorkflowStatus.VotingSessionStarted,
            WorkflowStatus.VotingSessionEnded,
          ],
        );
      });

      it("Should revert if caller is not owner", async () => {
        await viem.assertions.revertWithCustomError(
          votingContract.write.endVotingSession({ account: voter1.account }),
          votingContract,
          "OwnableUnauthorizedAccount",
        );
      });

      it("Should revert endVotingSession if not in VotingSessionStarted status", async () => {
        assert.equal(
          await votingContract.read.workflowStatus(),
          WorkflowStatus.VotingSessionStarted,
        );
        await votingContract.write.endVotingSession();
        await viem.assertions.revertWith(
          votingContract.write.endVotingSession(),
          "Voting session havent started yet",
        );
      });

      it("Should revert endVotingSession if no vote has been cast", async () => {
        // fresh session opened for voting but with zero votes cast
        const {
          votingContract: noVotes,
          voter1: v1,
          voter2: v2,
          voter3: v3,
        } = await setUpSmartContract();
        await noVotes.write.addVoter([v1.account.address]);
        await noVotes.write.addVoter([v2.account.address]);
        await noVotes.write.addVoter([v3.account.address]);
        await noVotes.write.startProposalsRegistering();
        await noVotes.write.addProposal(["Proposal A"], {
          account: v1.account,
        });
        await noVotes.write.endProposalsRegistering();
        await noVotes.write.startVotingSession();
        await viem.assertions.revertWith(
          noVotes.write.endVotingSession(),
          "No vote has been cast",
        );
      });
    });
  });

  ////////////////////////////////////////////////
  //              VOTER REGISTRATION            //
  ////////////////////////////////////////////////

  describe("Voter Registration", () => {
    it("Should store a voter correctly", async () => {
      await votingContract.write.addVoter([voter1.account.address]);
      // SELF-CALL (onlyVoters)
      const voter = await votingContract.read.getVoter(
        [voter1.account.address],
        { account: voter1.account },
      );
      assert.equal(voter.isRegistered, true);
      assert.equal(voter.hasVoted, false);
      assert.equal(voter.votedProposalId, 0n);
    });

    it("Should emit event on voter registration", async () => {
      await viem.assertions.emitWithArgs(
        votingContract.write.addVoter([voter1.account.address]),
        votingContract,
        "VoterRegistered",
        [voter1.account.address],
      );
    });

    it("Should revert if non-owner tries to add a voter", async () => {
      await viem.assertions.revertWithCustomError(
        votingContract.write.addVoter([voter2.account.address], {
          account: voter1.account,
        }),
        votingContract,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should revert if workflow status is not RegisteringVoters", async () => {
      // WORKFLOW NEEDS TO BE CHANGED TO TEST THIS ONE
      await votingContract.write.startProposalsRegistering();
      await viem.assertions.revertWith(
        votingContract.write.addVoter([voter1.account.address]),
        "Voters registration is not open yet",
      );
    });

    it("Should revert when adding the zero address as a voter", async () => {
      await viem.assertions.revertWith(
        votingContract.write.addVoter([
          "0x0000000000000000000000000000000000000000",
        ]),
        "Zero address cannot be a voter",
      );
    });

    it("Should revert on double registration", async () => {
      await votingContract.write.addVoter([voter1.account.address]);
      await viem.assertions.revertWith(
        votingContract.write.addVoter([voter1.account.address]),
        "Already registered",
      );
    });

    it("Should allow registering multiple voters", async () => {
      await votingContract.write.addVoter([voter1.account.address]);
      await votingContract.write.addVoter([voter2.account.address]);

      const registeredVoter1 = await votingContract.read.getVoter(
        [voter1.account.address],
        { account: voter1.account },
      );
      const registeredVoter2 = await votingContract.read.getVoter(
        [voter2.account.address],
        { account: voter1.account },
      );
      assert.equal(registeredVoter1.isRegistered, true);
      assert.equal(registeredVoter2.isRegistered, true);
    });
  });

  ////////////////////////////////////////////////
  //            PROPOSALS REGISTRATION          //
  ////////////////////////////////////////////////

  describe("Proposals Registration", () => {
    beforeEach(async () => {
      await AddThreeVotersAndStartsProposalRegistration();
    });

    it("Should store the proposal description correctly", async () => {
      await votingContract.write.addProposal(["Proposal A"], {
        account: voter1.account,
      });
      const expectedProposal = await votingContract.read.getOneProposal([1n], {
        account: voter1.account,
      });
      assert.equal(expectedProposal.description, "Proposal A");
      assert.equal(expectedProposal.voteCount, 0n);
    });

    it("Should emit event on proposal registration", async () => {
      await viem.assertions.emitWithArgs(
        votingContract.write.addProposal(["Proposal A"], {
          account: voter1.account,
        }),
        votingContract,
        "ProposalRegistered",
        [1n],
      );
    });

    it("Should revert if non-voter tries to add a proposal", async () => {
      await viem.assertions.revertWith(
        votingContract.write.addProposal(["Bad Proposal"], {
          account: nonVoter.account,
        }),
        "You're not a voter",
      );
    });

    it("Should revert if workflow status is not ProposalsRegistration", async () => {
      // a real proposal is required before registration can be ended
      await votingContract.write.addProposal(["Proposal A"], {
        account: voter1.account,
      });
      await votingContract.write.endProposalsRegistering();
      await viem.assertions.revertWith(
        votingContract.write.addProposal(["Bad Proposal"], {
          account: voter1.account,
        }),
        "Proposals are not allowed yet",
      );
    });

    it("Should revert on empty proposal", async () => {
      await viem.assertions.revertWith(
        votingContract.write.addProposal([""], { account: voter1.account }),
        "Empty proposal is not allowed",
      );
    });

    it("Should revert on duplicate proposal", async () => {
      await votingContract.write.addProposal(["Proposal A"], {
        account: voter1.account,
      });
      // Same description again — even from a different voter — must be rejected
      await viem.assertions.revertWith(
        votingContract.write.addProposal(["Proposal A"], {
          account: voter2.account,
        }),
        "Proposal already exists",
      );
    });

    it("Should assign incremental IDs to proposals", async () => {
      await votingContract.write.addProposal(["Proposal A"], {
        account: voter1.account,
      });
      await votingContract.write.addProposal(["Proposal B"], {
        account: voter2.account,
      });

      const expectedProposal1 = await votingContract.read.getOneProposal([1n], {
        account: voter1.account,
      });
      const expectedProposal2 = await votingContract.read.getOneProposal([2n], {
        account: voter1.account,
      });
      assert.equal(expectedProposal1.description, "Proposal A");
      assert.equal(expectedProposal2.description, "Proposal B");
    });
  });

  ////////////////////////////////////////////////
  //                VOTING SESSION              //
  ////////////////////////////////////////////////

  describe("Voting Session", () => {
    beforeEach(async () => {
      await AddFourProposalsAndStartsVotingSession();
    });

    it("Should increment proposal voteCount", async () => {
      await votingContract.write.setVote([1n], { account: voter1.account });
      await votingContract.write.setVote([1n], { account: voter2.account });
      await votingContract.write.setVote([2n], { account: voter3.account });
      const proposal1 = await votingContract.read.getOneProposal([1n], {
        account: voter1.account,
      });
      const proposal2 = await votingContract.read.getOneProposal([2n], {
        account: voter1.account,
      });
      assert.equal(proposal1.voteCount, 2n);
      assert.equal(proposal2.voteCount, 1n);
    });

    it("Should update voter state after vote", async () => {
      await votingContract.write.setVote([1n], { account: voter1.account });
      const voterInfo = await votingContract.read.getVoter(
        [voter1.account.address],
        { account: voter1.account },
      );
      assert.equal(voterInfo.hasVoted, true);
      assert.equal(voterInfo.votedProposalId, 1n);
    });

    it("Should emit event on vote registration", async () => {
      await viem.assertions.emitWithArgs(
        votingContract.write.setVote([1n], { account: voter1.account }),
        votingContract,
        "Voted",
        [voter1.account.address, 1n],
      );
    });

    it("Should revert if non-voter tries to vote", async () => {
      await viem.assertions.revertWith(
        votingContract.write.setVote([1n], { account: nonVoter.account }),
        "You're not a voter",
      );
    });

    it("Should revert if workflow status is not VotingSessionStarted", async () => {
      // a vote is required so the session can be ended (status check runs first
      // in setVote, so voter1 still hits the status revert below)
      await votingContract.write.setVote([1n], { account: voter1.account });
      await votingContract.write.endVotingSession();
      await viem.assertions.revertWith(
        votingContract.write.setVote([1n], { account: voter1.account }),
        "Voting session havent started yet",
      );
    });

    it("Should revert on double vote", async () => {
      await votingContract.write.setVote([1n], { account: voter1.account });
      await viem.assertions.revertWith(
        votingContract.write.setVote([2n], { account: voter1.account }),
        "You have already voted",
      );
    });

    it("Should revert if voter votes for non-existent proposal", async () => {
      await viem.assertions.revertWith(
        votingContract.write.setVote([99n], { account: voter1.account }),
        "Proposal not found",
      );
    });
  });

  ////////////////////////////////////////////////
  //                TALLYING VOTES              //
  ////////////////////////////////////////////////

  describe("Tallying Votes", () => {
    it("Should determine the correct winner", async () => {
      await fullSetup();
      await votingContract.write.tallyVotes();
      assert.equal(await votingContract.read.winningProposalID(), 1n);
    });

    it("Should change workflow status to VotesTallied", async () => {
      await fullSetup();
      await votingContract.write.tallyVotes();
      assert.equal(
        await votingContract.read.workflowStatus(),
        WorkflowStatus.VotesTallied,
      );
    });

    it("Should emit event on tallyVotes", async () => {
      await fullSetup();
      await viem.assertions.emitWithArgs(
        votingContract.write.tallyVotes(),
        votingContract,
        "WorkflowStatusChange",
        [WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied],
      );
    });

    it("Should revert tallyVotes if called by non-owner", async () => {
      await fullSetup();
      await viem.assertions.revertWithCustomError(
        votingContract.write.tallyVotes({ account: voter1.account }),
        votingContract,
        "OwnableUnauthorizedAccount",
      );
    });

    it("Should revert if workflow status is not VotingSessionEnded", async () => {
      await viem.assertions.revertWith(
        votingContract.write.tallyVotes(),
        "Current status is not voting session ended",
      );
    });

    it("Should keep first proposal in case of tie", async () => {
      await AddFourProposalsAndStartsVotingSession();
      await votingContract.write.setVote([1n], { account: voter1.account });
      await votingContract.write.setVote([2n], { account: voter3.account });
      await votingContract.write.endVotingSession();
      await votingContract.write.tallyVotes();

      assert.equal(await votingContract.read.winningProposalID(), 1n);
    });

    it("Should keep lowest index on tie regardless of vote order", async () => {
      // Votes arrive in REVERSE index order (2 before 1) but the tie must still
      // resolve to the lowest index (1) — guards against order-dependent tallying.
      await AddFourProposalsAndStartsVotingSession();
      await votingContract.write.setVote([2n], { account: voter3.account });
      await votingContract.write.setVote([1n], { account: voter1.account });
      await votingContract.write.endVotingSession();
      await votingContract.write.tallyVotes();

      assert.equal(await votingContract.read.winningProposalID(), 1n);
    });

    it(
      "Crash test of tallyVotes on incremented number of proposals",
      // PUSH TIMEOUT DURATION TO AVOID BLOCKING EXECUTION
      { timeout: 300_000 },
      async () => {
        const publicClient = await viem.getPublicClient();
        // ARBITRARY NUMBERS, CAN BE CHANGED EASILY TO WIDE TESTS
        const step = 500;
        const maxProposals = 10000;

        for (let size = step; size <= maxProposals; size += step) {
          // NEEDS NEW CONTRACT DECLARATION ON EACH LOOP DUE TO WORKFLOW LIMITATIONS
          ({ votingContract, owner } = await setUpSmartContract());
          await votingContract.write.addVoter([owner.account.address]);
          await votingContract.write.startProposalsRegistering();
          for (let p = 1; p <= size; p++) {
            await votingContract.write.addProposal(["P" + p]);
          }

          await votingContract.write.endProposalsRegistering();
          await votingContract.write.startVotingSession();
          await votingContract.write.setVote([1n]);
          await votingContract.write.endVotingSession();

          // CATCHING THE ERROR AVOID TO HAVE THE TEST REJECTED BUT RETURNED THE FAILURE POINT
          try {
            const hash = await votingContract.write.tallyVotes();
            const receipt = await publicClient.waitForTransactionReceipt({
              hash,
            });
            console.log(
              `  ✓ ${size} proposals | gas used : ${receipt.gasUsed}`,
            );
            assert.equal(await votingContract.read.winningProposalID(), 1n);
          } catch (err) {
            console.log(
              `  X ${size} proposals | REVERTED: ${(err as Error).message}`,
            );
            break;
          }
        }
      },
    );
  });
});
