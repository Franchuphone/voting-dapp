import MenuCard from "../reusable/MenuCard";

export default function ConnectedHome() {
  return (
    <>
      <MenuCard
        title="New voting session"
        link="/new-voting"
        description="Deploy a new instance of voting"
      />
      <MenuCard
        title="Dashboard"
        link="/dashboard"
        description="Your voting center"
      />
    </>
  );
}
