import { useVotingContext } from "@/components/voting/RoleGuard";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";

const ActualRoles = () => {
  const { isAdmin, isVoter } = useVotingContext();

  return (
    <Card className="w-full">
      <CardHeader className="text-right">
        <CardDescription>Your roles</CardDescription>
        <CardTitle className="text-2xl">
          {[isAdmin && "Admin", isVoter && "Voter"].filter(Boolean).join(" / ")}
        </CardTitle>
      </CardHeader>
    </Card>
  );
};

export default ActualRoles;
