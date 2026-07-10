"use client";

import CustomButton from "./CustomButton";

// Navigates back to the landing page. `className` styles the wrapper so each
// page can place it (e.g. spanning a grid, spacing).
const HomeButton = ({ className }: { className?: string }) => {
  return (
    <div className={className}>
      <CustomButton path="/" text="Home" variant="outline" />
    </div>
  );
};

export default HomeButton;
