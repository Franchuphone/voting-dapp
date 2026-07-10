"use client";
import MenuCard from "@/components/reusable/MenuCard";
import HomeButton from "@/components/reusable/HomeButton";
import { votingFactoryConfig } from "@/constants/votingFactory";
import { useConnection, useContractEvents, useReadContract } from "wagmi";
import EmptyAlert from "@/components/reusable/EmptyAlert";
import LoadingAlert from "@/components/reusable/LoadingAlert";
import { votingAbi } from "@/constants/voting";
import { useCallback, useEffect, useState } from "react";

type VotingLog = NonNullable<
  ReturnType<
    typeof useContractEvents<typeof votingFactoryConfig.abi, "VotingCreated">
  >["data"]
>[number];

type SessionStatus = "loading" | "role" | "none";

// One hook instance per session so getVoter can be called with `account: address`
// (i.e. from = address). getVoter is guarded by onlyVoters, which checks
// msg.sender, so a successful read means `address` is a registered voter here.
// Renders nothing when the user has no role on this session.
const SessionCard = ({
  log,
  address,
  onStatusChange,
}: {
  log: VotingLog;
  address?: `0x${string}`;
  onStatusChange: (key: string, status: SessionStatus) => void;
}) => {
  const votingAddress = log.args.voting;

  const { isSuccess: isVoter, isLoading } = useReadContract({
    address: votingAddress,
    abi: votingAbi,
    functionName: "getVoter",
    args: [address as `0x${string}`],
    account: address,
    query: { enabled: !!address && !!votingAddress },
  });

  const roles: string[] = [];
  if (log.args.creator?.toLowerCase() === address?.toLowerCase())
    roles.push("Admin");
  if (isVoter) roles.push("Voter");

  const hasRole = roles.length > 0;
  // Still "loading" until the voter read settles, so the parent doesn't flash
  // the empty state before we know whether this session is accessible.
  const status: SessionStatus = hasRole
    ? "role"
    : isLoading
      ? "loading"
      : "none";
  const key = log.transactionHash ?? "";
  useEffect(() => {
    onStatusChange(key, status);
  }, [onStatusChange, key, status]);

  if (!hasRole) return null;

  return (
    <div className="w-full">
      <MenuCard
        title={log.args.name ?? ""}
        description={`Roles: ${roles.join(" / ")}`}
        link={`/voting/${votingAddress}`}
      />
    </div>
  );
};

const Dashboard = () => {
  const eventLogs = useContractEvents({
    address: votingFactoryConfig.address,
    abi: votingFactoryConfig.abi,
    eventName: "VotingCreated",
    fromBlock: BigInt(process.env.NEXT_PUBLIC_VOTING_FACTORY_DEPLOYED_BLOCK || 0),
  });
  const { address } = useConnection();

  // Per-session status reported by each card; keyed so it stays correct as
  // roles/reads change instead of latching.
  const [statuses, setStatuses] = useState<Record<string, SessionStatus>>({});
  const handleStatusChange = useCallback(
    (key: string, status: SessionStatus) => {
      setStatuses((prev) =>
        prev[key] === status ? prev : { ...prev, [key]: status },
      );
    },
    [],
  );

  const logs = eventLogs.data ?? [];
  const settled = logs.every((log) => {
    const status = statuses[log.transactionHash ?? ""];
    return status === "role" || status === "none";
  });
  const anyAccessible = logs.some(
    (log) => statuses[log.transactionHash ?? ""] === "role",
  );
  // Only show once events are loaded and every card has settled with no role,
  // so accessible users never see a flash.
  const showEmpty = !eventLogs.isLoading && settled && !anyAccessible;
  // In between: still resolving and nothing accessible to render yet.
  const showLoading = !showEmpty && !anyAccessible;

  return (
    <div className="min-[800px]:grid grid-cols-2 gap-x-4 justify-items-center">
      {showEmpty && (
        <EmptyAlert
          text="No voting sessions accessible"
          className="col-span-2"
        />
      )}

      {showLoading && (
        <LoadingAlert text="Loading sessions…" className="col-span-2" />
      )}

      {logs.map((log) => (
        <SessionCard
          key={log.transactionHash}
          log={log}
          address={address}
          onStatusChange={handleStatusChange}
        />
      ))}
      <HomeButton className="col-span-2 mt-10" />
    </div>
  );
};

export default Dashboard;
