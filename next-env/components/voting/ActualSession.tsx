import { useVotingContext } from "@/components/voting/RoleGuard";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2Icon } from "lucide-react";

// Matches the WorkflowStatus enum order in voting.sol
const WORKFLOW_STATUS_LABELS = [
  "Registering voters",
  "Proposals registration started",
  "Proposals registration ended",
  "Voting session started",
  "Voting session ended",
  "Votes tallied",
] as const;

const ActualSession = () => {
  const { status, statusLoading } = useVotingContext();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardDescription>Current phase</CardDescription>
        <CardTitle className="text-2xl">
          {statusLoading ? (
            <Loader2Icon className="size-6 animate-spin" />
          ) : status !== undefined ? (
            WORKFLOW_STATUS_LABELS[status]
          ) : (
            "Unknown status"
          )}
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default ActualSession;
