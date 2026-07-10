"use client";

import CustomButton from "./CustomButton";

// Link back to the landing page; `className` styles the wrapper for placement.
const HomeButton = ({ className }: { className?: string }) => {
  return (
    <div className={className}>
      <CustomButton path="/" text="Home" variant="outline" />
    </div>
  );
};

export default HomeButton;
