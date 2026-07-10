import { useVotingContext } from "@/components/voting/RoleGuard";
import WriteCallCard from "./WriteCallCard";
import { PlusIcon, SendIcon } from "lucide-react";

// The onlyOwner call that advances the workflow, keyed by the current status.
// Index = current workflowStatus; last phase (Votes tallied) has no next step.
const NEXT_STEP = [
  { fn: "startProposalsRegistering", label: "Open proposals" },
  { fn: "endProposalsRegistering", label: "Close proposals" },
  { fn: "startVotingSession", label: "Open voting" },
  { fn: "endVotingSession", label: "Close voting" },
  { fn: "tallyVotes", label: "Tally votes" },
] as const;

const AdminPanel = () => {
  const { contractAddress, status } = useVotingContext();

  const step = status !== undefined ? NEXT_STEP[status] : undefined;

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
          description="Advance the session to its next phase."
          toaster="You have correctly switched to the next phase"
          icon={SendIcon}
        />
      )}
    </section>
  );
};

export default AdminPanel;
