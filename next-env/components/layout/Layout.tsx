import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="app">
      <Header />
      <main className="main">
        <div className="main-content">{children}</div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
