const Footer = () => {
  return (
    <footer className="footer">
      All rights reserved &copy;{" "}
      <a href="https://github.com/Franchuphone/voting-dapp" target="blank">
        Franchuphone
      </a>{" "}
      {new Date().getFullYear()}
    </footer>
  );
};

export default Footer;
