import { useVotingContext } from "@/components/voting/RoleGuard";
import WriteCallCard from "./WriteCallCard";
import { PlusIcon, SendIcon } from "lucide-react";
import { usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { votingAbi } from "@/constants/voting";

// onlyOwner step that advances the workflow, indexed by workflowStatus (last phase has none).
const NEXT_STEP = [
  { fn: "startProposalsRegistering", label: "Open proposals" },
  { fn: "endProposalsRegistering", label: "Close proposals" },
  { fn: "startVotingSession", label: "Open voting" },
  { fn: "endVotingSession", label: "Close voting" },
  { fn: "tallyVotes", label: "Tally votes" },
] as const;

// Phases whose advancing step the contract rejects when empty (0 voters / 0 proposals / 0 votes).
const REGISTERING_PHASE = 0;
const PROPOSALS_PHASE = 1;
const VOTING_PHASE = 3;

// Lower bound for the log scan; the Voting contract is created after its factory.
const FROM_BLOCK = process.env.NEXT_PUBLIC_VOTING_FACTORY_DEPLOYED_BLOCK
  ? BigInt(process.env.NEXT_PUBLIC_VOTING_FACTORY_DEPLOYED_BLOCK)
  : 0n;

const AdminPanel = () => {
  const { contractAddress, status } = useVotingContext();
  const publicClient = usePublicClient();

  const step = status !== undefined ? NEXT_STEP[status] : undefined;
  const isGuardedPhase =
    status === REGISTERING_PHASE ||
    status === PROPOSALS_PHASE ||
    status === VOTING_PHASE;

  // Count voters/proposals/votes from events (identical in old & new contracts, unlike the getters).
  const { data: counts } = useQuery({
    queryKey: ["session-counts", contractAddress, status],
    enabled: !!publicClient && isGuardedPhase,
    queryFn: async () => {
      const [voters, proposals, votes] = await Promise.all([
        publicClient!.getContractEvents({
          address: contractAddress,
          abi: votingAbi,
          eventName: "VoterRegistered",
          fromBlock: FROM_BLOCK,
        }),
        publicClient!.getContractEvents({
          address: contractAddress,
          abi: votingAbi,
          eventName: "ProposalRegistered",
          fromBlock: FROM_BLOCK,
        }),
        publicClient!.getContractEvents({
          address: contractAddress,
          abi: votingAbi,
          eventName: "Voted",
          fromBlock: FROM_BLOCK,
        }),
      ]);
      return {
        voters: voters.length,
        proposals: proposals.length,
        votes: votes.length,
      };
    },
  });

  // Disable the step when the contract would revert; `?? 0` also blocks while counts load.
  const stepBlocked =
    (status === REGISTERING_PHASE && (counts?.voters ?? 0) === 0) ||
    (status === PROPOSALS_PHASE && (counts?.proposals ?? 0) === 0) ||
    (status === VOTING_PHASE && (counts?.votes ?? 0) === 0);

  const stepDescription = stepBlocked
    ? status === REGISTERING_PHASE
      ? "Register at least one voter before opening proposals."
      : status === PROPOSALS_PHASE
        ? "Register at least one proposal before closing."
        : "At least one vote must be cast before closing."
    : "Advance the session to its next phase.";

  return (
    <section className="flex w-full flex-col gap-4">
      <h2 className="font-heading text-2xl font-medium">Admin controls</h2>
      {status === 0 && (
        <WriteCallCard
          address={contractAddress}
          functionName="addVoter"
          label="Add a voter"
          description="Add a voter address 0x..."
          toaster="You have added a new voter"
          icon={PlusIcon}
          pattern={/^0x[a-fA-F0-9]{40}$/}
        />
      )}
      {step && (
        <WriteCallCard
          address={contractAddress}
          functionName={step.fn}
          label={step.label}
          description={stepDescription}
          toaster="You have correctly switched to the next phase"
          icon={SendIcon}
          disabled={stepBlocked}
        />
      )}
    </section>
  );
};

export default AdminPanel;
