import WalletButton from "./WalletButton";
import { cn } from "@/lib/utils";

export default function NotConnectedHome({
  leaving = false,
}: {
  leaving?: boolean;
}) {
  return (
    <div className="flex-col-center">
      <h1 className="text-4xl font-bold mb-10 max-[800px]:text-center">
        Welcome to your voting platform
      </h1>
      {/* On connect, `leaving` triggers the slide-up-then-right + fade toward
          the header's connect button spot. */}
      <div className={cn("connect-travel", leaving && "connect-leaving")}>
        <WalletButton />
      </div>
    </div>
  );
}
