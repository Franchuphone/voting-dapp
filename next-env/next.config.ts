import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // Silence benign "module not found" warnings for optional deps that wallet
    // SDKs reference but a web app never uses:
    //   @metamask/sdk    -> @react-native-async-storage/async-storage (RN only)
    //   WalletConnect    -> pino-pretty (logger's optional pretty-printer)
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { message: /Can't resolve '@react-native-async-storage\/async-storage'/ },
      { message: /Can't resolve 'pino-pretty'/ },
    ];
    return config;
  },
};

export default nextConfig;
