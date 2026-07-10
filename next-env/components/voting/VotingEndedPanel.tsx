import { useVotingContext } from "@/components/voting/RoleGuard";
import ReadCallCard from "@/components/voting/ReadCallCard";

const VotingEndedPanel = () => {
  const { contractAddress } = useVotingContext();

  return (
    <section className="flex w-full flex-col gap-4">
      <h2 className="font-heading text-2xl font-medium">
        Voting session ended
      </h2>
      <ReadCallCard
        address={contractAddress}
        functionName="winningProposalID"
        description="Winner proposal ID"
      />
    </section>
  );
};

export default VotingEndedPanel;
