// SPDX-License-Identifier: MIT

pragma solidity ^0.8.28;
import "@openzeppelin/contracts/access/Ownable.sol";


/// @title Voting
/// @notice A single-session voting contract driven by its owner through a fixed
///         workflow: register voters, collect proposals, run a voting round, then tally.
/// @dev Ownership/admin actions are gated by OpenZeppelin `Ownable`; voter actions by the
///      `onlyVoters` modifier. Index 0 of `proposalsArray` is a seeded "BLANK VOTE"
///      (abstention) option. The winner is tracked incrementally in `setVote` so that
///      `tallyVotes` never loops over the proposals (avoids an unbounded-gas DoS).
contract Voting is Ownable {


    /// @notice Index (into `proposalsArray`) of the current leading / winning proposal.
    /// @dev Maintained incrementally during voting; only final once `workflowStatus`
    ///      reaches `VotesTallied`. Defaults to 0 (the BLANK VOTE option).
    uint64 public winningProposalID;

    /// @notice Total number of votes cast across the whole session.
    uint96 public totalVotes;

    /// @notice Total number of registered voters.
    uint96 public totalVoters;

    /// @notice A registered participant of the vote.
    /// @param isRegistered    Whether the address may participate.
    /// @param hasVoted        Whether the voter has already cast their single vote.
    /// @param votedProposalId Index of the proposal the voter chose (only meaningful when `hasVoted`).
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    /// @notice A proposal that voters can vote for.
    /// @param description Human-readable text of the proposal.
    /// @param voteCount   Number of votes received.
    struct Proposal {
        string description;
        uint voteCount;
    }

    /// @notice The linear lifecycle of the voting session; each step is owner-driven.
    enum  WorkflowStatus {
        RegisteringVoters,
        ProposalsRegistrationStarted,
        ProposalsRegistrationEnded,
        VotingSessionStarted,
        VotingSessionEnded,
        VotesTallied
    }

    /// @notice Current stage of the workflow.
    WorkflowStatus public workflowStatus;
    /// @dev All proposals; index 0 is the seeded BLANK VOTE option.
    Proposal[] proposalsArray;
    /// @dev Registry of voters keyed by address.
    mapping (address => Voter) voters;
    /// @dev Set of proposal-description hashes already registered, for O(1) duplicate checks.
    mapping (bytes32 => bool) proposalHashes;


    /// @notice Emitted when the owner registers a new voter.
    /// @param voterAddress The newly registered voter.
    event VoterRegistered(address voterAddress);
    /// @notice Emitted on every workflow transition.
    /// @param previousStatus Status before the change.
    /// @param newStatus      Status after the change.
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    /// @notice Emitted when a voter registers a proposal.
    /// @param proposalId Index of the new proposal in `proposalsArray`.
    event ProposalRegistered(uint proposalId);
    /// @notice Emitted when a voter casts their vote.
    /// @param voter      The voter's address.
    /// @param proposalId Index of the proposal voted for.
    event Voted (address voter, uint proposalId);

    /// @notice Deploys the contract and sets the deployer as owner.
    constructor() Ownable(msg.sender) {    }

    /// @notice Restricts a function to registered voters.
    modifier onlyVoters() {
        require(voters[msg.sender].isRegistered, "You're not a voter");
        _;
    }

    // ::::::::::::: GETTERS ::::::::::::: //

    /// @notice Returns the full record of a voter.
    /// @dev Callable only by registered voters.
    /// @param _addr Address to look up.
    /// @return The `Voter` struct for `_addr` (zero-valued if not registered).
    function getVoter(address _addr) external onlyVoters view returns (Voter memory) {
        return voters[_addr];
    }

    /// @notice Returns a single proposal by index.
    /// @dev Callable only by registered voters. Reverts if `_id` is out of range.
    /// @param _id Index into `proposalsArray` (0 is the BLANK VOTE option).
    /// @return The `Proposal` at index `_id`.
    function getOneProposal(uint _id) external onlyVoters view returns (Proposal memory) {
        return proposalsArray[_id];
    }


    // ::::::::::::: REGISTRATION ::::::::::::: //

    /// @notice Registers a new voter.
    /// @dev Owner-only; allowed only during `RegisteringVoters`. Rejects the zero address
    ///      and duplicate registrations.
    /// @param _addr Address to register as a voter.
    function addVoter(address _addr) external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Voters registration is not open yet');
        require(_addr != address(0), 'Zero address cannot be a voter');
        require(voters[_addr].isRegistered != true, 'Already registered');

        voters[_addr].isRegistered = true;
        totalVoters++;
        emit VoterRegistered(_addr);
    }


    // ::::::::::::: PROPOSAL ::::::::::::: //

    /// @notice Registers a new proposal.
    /// @dev Voters-only; allowed only during `ProposalsRegistrationStarted`. Rejects empty
    ///      descriptions and exact-duplicate descriptions (by keccak256 hash).
    /// @param _desc Human-readable description of the proposal.
    function addProposal(string calldata _desc) external onlyVoters {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Proposals are not allowed yet');
        bytes32 descHash = keccak256(abi.encode(_desc));
        require(descHash != keccak256(abi.encode("")), 'Empty proposal is not allowed');
        require(!proposalHashes[descHash], 'Proposal already exists');
        proposalHashes[descHash] = true;

        Proposal memory proposal;
        proposal.description = _desc;
        proposalsArray.push(proposal);
        emit ProposalRegistered(proposalsArray.length-1);
    }

    // ::::::::::::: VOTE ::::::::::::: //

    /// @notice Casts the caller's single vote for a proposal.
    /// @dev Voters-only; allowed only during `VotingSessionStarted`. A voter may vote once.
    ///      The winner is updated incrementally: a strictly-greater count takes the lead,
    ///      and on an exact tie the lowest index is kept, making the outcome deterministic
    ///      and independent of vote order.
    /// @param _id Index of the proposal to vote for (0 = BLANK VOTE / abstention).
    function setVote( uint _id) external onlyVoters {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(voters[msg.sender].hasVoted != true, 'You have already voted');
        require(_id < proposalsArray.length, 'Proposal not found');

        voters[msg.sender].votedProposalId = _id;
        voters[msg.sender].hasVoted = true;
        proposalsArray[_id].voteCount++;
        totalVotes++;

        // Calculating winner here to avoid loop on array and possible DOS out of gas
        uint _leadCount = proposalsArray[winningProposalID].voteCount;
        uint _newCount = proposalsArray[_id].voteCount;
        if (_newCount > _leadCount || (_newCount == _leadCount && _id < winningProposalID)) {
            winningProposalID = uint64(_id);
        }

        emit Voted(msg.sender, _id);
    }

    // ::::::::::::: STATE ::::::::::::: //


    /// @notice Opens the proposals-registration phase and seeds the BLANK VOTE option.
    /// @dev Owner-only; allowed only from `RegisteringVoters`. Requires at least one
    ///      registered voter. Pushes "BLANK VOTE" at index 0 and reserves its hash so
    ///      it cannot be registered again.
    function startProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.RegisteringVoters, 'Registering proposals cant be started now');
        require(totalVoters > 0, 'No voter registered');
        workflowStatus = WorkflowStatus.ProposalsRegistrationStarted;

        // Seed index 0 as the "blank vote" (abstention) option and reserve its hash
        Proposal memory proposal;
        proposal.description = "BLANK VOTE";
        proposalsArray.push(proposal);
        proposalHashes[keccak256(abi.encode("BLANK VOTE"))] = true;

        emit WorkflowStatusChange(WorkflowStatus.RegisteringVoters, WorkflowStatus.ProposalsRegistrationStarted);
    }

    /// @notice Closes the proposals-registration phase.
    /// @dev Owner-only; allowed only from `ProposalsRegistrationStarted`. Requires at least
    ///      one real proposal (beyond the BLANK VOTE at index 0).
    function endProposalsRegistering() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationStarted, 'Registering proposals havent started yet');
        // index 0 is the seeded BLANK VOTE, so require at least one real proposal
        require(proposalsArray.length > 1, 'No proposal registered');
        workflowStatus = WorkflowStatus.ProposalsRegistrationEnded;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationStarted, WorkflowStatus.ProposalsRegistrationEnded);
    }

    /// @notice Opens the voting session.
    /// @dev Owner-only; allowed only from `ProposalsRegistrationEnded`.
    function startVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.ProposalsRegistrationEnded, 'Registering proposals phase is not finished');
        workflowStatus = WorkflowStatus.VotingSessionStarted;
        emit WorkflowStatusChange(WorkflowStatus.ProposalsRegistrationEnded, WorkflowStatus.VotingSessionStarted);
    }

    /// @notice Closes the voting session.
    /// @dev Owner-only; allowed only from `VotingSessionStarted`. Requires at least one
    ///      vote to have been cast.
    function endVotingSession() external onlyOwner {
        require(workflowStatus == WorkflowStatus.VotingSessionStarted, 'Voting session havent started yet');
        require(totalVotes > 0, 'No vote has been cast');
        workflowStatus = WorkflowStatus.VotingSessionEnded;
        emit WorkflowStatusChange(WorkflowStatus.VotingSessionStarted, WorkflowStatus.VotingSessionEnded);
    }


    // ::::::::::::: TALLY ::::::::::::: //

    /// @notice Finalizes the vote and marks the session tallied.
    /// @dev Owner-only; allowed only from `VotingSessionEnded`. `winningProposalID` is
    ///      already computed incrementally in `setVote`, so this only performs the final
    ///      state transition (constant gas, no loop).
   function tallyVotes() external onlyOwner {
       require(workflowStatus == WorkflowStatus.VotingSessionEnded, "Current status is not voting session ended");
       // winningProposalID is already calculated in setVote()
       // tallying is just the final state transition but easier to understand with this name
       workflowStatus = WorkflowStatus.VotesTallied;
       emit WorkflowStatusChange(WorkflowStatus.VotingSessionEnded, WorkflowStatus.VotesTallied);
    }
}
