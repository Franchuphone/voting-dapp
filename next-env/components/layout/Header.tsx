import Link from "next/link";
import { Vote } from "lucide-react";
import HeaderConnectButton from "../connection/HeaderConnectButton";
import ThemeToggle from "./ThemeToggle";

const Header = () => {
  return (
    <nav className="navbar">
      <div className="grow">
        <Link href="/" aria-label="Home" className="inline-block w-fit">
          <Vote className="size-12 text-primary" />
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <HeaderConnectButton />
        <ThemeToggle />
      </div>
    </nav>
  );
};

export default Header;
