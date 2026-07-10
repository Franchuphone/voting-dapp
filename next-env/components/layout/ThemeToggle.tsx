"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SunIcon, MoonIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // resolvedTheme is client-only; wait for mount to avoid a hydration mismatch.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button variant="outline" size="icon" aria-label="Toggle theme" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <SunIcon className="size-6" />
      ) : (
        <MoonIcon className="size-6" />
      )}
    </Button>
  );
};

export default ThemeToggle;
