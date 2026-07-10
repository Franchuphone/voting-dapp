// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./voting.sol";

/// @title VotingFactory
/// @notice Deploys Voting contracts and keeps an on-chain registry of them.
///         List deployments from the `VotingCreated` events (single getLogs
///         call, no per-item reads); use the emitted `index` as a stable key
///         into `deployments(index)` for a fresh canonical record.
contract VotingFactory {
    struct Deployment {
        address contractAddress;
        address creator;
        string name;
        uint256 createdAt;
    }

    /// @notice Registry keyed by an incrementing index (0 .. deploymentsCount-1).
    mapping(uint256 => Deployment) public deployments;
    uint256 public deploymentsCount;

    /// @param index The registry key — read the full record via `deployments(index)`.
    event VotingCreated(
        uint256 indexed index,
        address indexed voting,
        address indexed creator,
        string name
    );

    /// @notice Deploys a new Voting contract owned by the caller and records it.
    /// @param name A human-readable label for the voting session.
    /// @return The address of the newly deployed Voting contract.
    function createVoting(string calldata name) external returns (address) {
        Voting voting = new Voting();
        // The factory is the initial owner (Ownable(msg.sender) in Voting's
        // constructor), transfer ownership to the caller of the factory
        voting.transferOwnership(msg.sender);

        uint256 index = deploymentsCount;
        deployments[index] = Deployment(
            address(voting),
            msg.sender,
            name,
            block.timestamp
        );
        deploymentsCount = index + 1;

        emit VotingCreated(index, address(voting), msg.sender, name);
        return address(voting);
    }
}
