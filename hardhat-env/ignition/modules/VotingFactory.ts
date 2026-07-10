import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Deploy the factory once per network; the frontend calls createVoting() on it
// to deploy + register individual Voting contracts.
export default buildModule("VotingFactoryModule", (m) => {
  const votingFactory = m.contract("VotingFactory");

  return { votingFactory };
});
