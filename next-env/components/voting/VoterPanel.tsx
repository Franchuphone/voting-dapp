import { useVotingContext } from "@/components/voting/RoleGuard";
import WriteCallCard from "./WriteCallCard";
import { CheckIcon, PlusIcon, SendIcon } from "lucide-react";
import ReadCallCard from "./ReadCallCard";
import { useConnection, useReadContract } from "wagmi";
import { votingAbi } from "@/constants/voting";

const VoterPanel = () => {
  const { contractAddress, status } = useVotingContext();
  const { address } = useConnection();

  // Read the current voter hasVoted status for dynamic display
  const { data: voter } = useReadContract({
    address: contractAddress,
    abi: votingAbi,
    functionName: "getVoter",
    args: [address as `0x${string}`],
    account: address,
    query: { enabled: !!address },
  });
  const hasVoted = voter?.hasVoted ?? false;

  return (
    <section className="flex w-full flex-col gap-4">
      <h2 className="font-heading text-2xl font-medium">Voter controls</h2>
      {status === 1 && (
        <WriteCallCard
          address={contractAddress}
          functionName="addProposal"
          label="Add a proposal"
          description="Add a new proposal"
          toaster="Your proposal has been correctly registered"
          pattern={/\S/}
          icon={PlusIcon}
        />
      )}
      {status === 3 &&
        (hasVoted ? (
          // Already voted: no input, disabled button carries the voted proposal
          <WriteCallCard
            address={contractAddress}
            functionName="setVote"
            label={`Proposal ${voter?.votedProposalId}`}
            description="You have already voted for"
            toaster=""
            icon={CheckIcon}
            disabled
          />
        ) : (
          <WriteCallCard
            address={contractAddress}
            functionName="setVote"
            label="Vote"
            description="Choose a proposal number"
            toaster="Your vote has been correctly counted"
            pattern={/^\d+$/}
            icon={SendIcon}
          />
        ))}
      <ReadCallCard
        address={contractAddress}
        functionName="getVoter"
        label="Get Voter"
        description="Enter an adddress 0x..."
        pattern={/^0x[a-fA-F0-9]{40}$/}
      />
      <ReadCallCard
        address={contractAddress}
        functionName="getOneProposal"
        label="Get Proposal"
        description="Enter a proposal ID"
        pattern={/^\d+$/}
      />
    </section>
  );
};

export default VoterPanel;
