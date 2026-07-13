import type { NextConfig } from "next";
import os from 'os';

function getLocalIps() {
  const ips: string[] = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const ips = getLocalIps();

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ips,
  serverExternalPackages: [],
  experimental: {
    serverActions: {
      allowedOrigins: ips.map(ip => `${ip}:3000`)
    }
  }
};

export default nextConfig;
