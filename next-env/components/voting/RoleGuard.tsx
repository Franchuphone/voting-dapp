"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useParams, useRouter } from "next/navigation";
import { useConnection, useReadContract } from "wagmi";
import { votingAbi } from "@/constants/voting";
import LoadingAlert from "@/components/reusable/LoadingAlert";

type VotingContext = {
  contractAddress: `0x${string}`;
  isAdmin: boolean;
  isVoter: boolean;
  status: number | undefined;
  statusLoading: boolean;
};

const VotingContext = createContext<VotingContext | null>(null);

// Current user's roles for this voting session; usable only inside RoleGuard.
export function useVotingContext() {
  const role = useContext(VotingContext);
  if (!role)
    throw new Error("useVotingContext must be used inside a RoleGuard route");
  return role;
}

// Role gate for /voting/[address]: non owner/voter users are sent back to the dashboard.
export default function RoleGuard({ children }: { children: ReactNode }) {
  const { address: connected } = useConnection();
  const { address: contractParam } = useParams<{ address: string }>();
  const router = useRouter();

  const contractAddress = contractParam as `0x${string}` | undefined;

  const { data: status, isLoading: statusLoading } = useReadContract({
    address: contractAddress,
    abi: votingAbi,
    functionName: "workflowStatus",
  });

  // Admin = owner() (the Voting contract is Ownable).
  const { data: owner, isLoading: ownerLoading } = useReadContract({
    address: contractAddress,
    abi: votingAbi,
    functionName: "owner",
    query: { enabled: !!contractAddress },
  });

  const isAdmin =
    !!owner && !!connected && owner.toLowerCase() === connected.toLowerCase();

  // Voter = getVoter (onlyVoters) succeeds when called as `connected`; retry:false fails fast.
  const { isSuccess: isVoter, isLoading: voterLoading } = useReadContract({
    address: contractAddress,
    abi: votingAbi,
    functionName: "getVoter",
    args: [connected as `0x${string}`],
    account: connected,
    query: { enabled: !!contractAddress && !!connected, retry: false },
  });

  const hasRole = isAdmin || isVoter;
  // Wait for owner, and (unless already admin) the voter probe, before deciding.
  const isResolving = ownerLoading || (!isAdmin && voterLoading);

  useEffect(() => {
    if (!isResolving && !hasRole) {
      router.replace("/dashboard");
    }
  }, [isResolving, hasRole, router]);

  if (isResolving) {
    return <LoadingAlert text="Checking access…" />;
  }

  // Reaching here means reads succeeded, so contractAddress is defined.
  if (!hasRole || !contractAddress) return null;

  return (
    <VotingContext.Provider
      value={{ statusLoading, status, contractAddress, isAdmin, isVoter }}
    >
      {children}
    </VotingContext.Provider>
  );
}
