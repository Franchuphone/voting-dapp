"use client";
import { useVotingContext } from "@/components/voting/RoleGuard";
import ActualSession from "@/components/voting/ActualSession";
import ActualRoles from "@/components/voting/ActualRoles";
import AdminPanel from "@/components/voting/AdminPanel";
import VoterPanel from "@/components/voting/VoterPanel";
import VotingEndedPanel from "@/components/voting/VotingEndedPanel";
import HomeButton from "@/components/reusable/HomeButton";

export default function VotingSession() {
  const { isAdmin, isVoter, status } = useVotingContext();

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 justify-items-center">
      <ActualSession />
      <ActualRoles />
      {status === 5 ? (
        <div className="col-span-2 w-full text-center">
          <VotingEndedPanel />
        </div>
      ) : (
        isAdmin && (
          <div className="col-span-2 w-full text-center">
            <AdminPanel />
          </div>
        )
      )}
      {isVoter && (
        <div className="col-span-2 w-full text-center">
          <VoterPanel />
        </div>
      )}
      <HomeButton className="col-span-2 mt-10" />
    </div>
  );
}
