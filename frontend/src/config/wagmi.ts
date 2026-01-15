import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'BaseEscrow',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
  },
  ssr: true,
});

// Contract addresses - Base Mainnet
export const CONTRACT_ADDRESSES = {
  [base.id]: {
    escrow: '0x3E85720F2073Ed91a467EfC24848D7c29050Ecc4' as `0x${string}`,
    arbitration: '0xcE390fDf91783712E6ffF06208Ee0d7CFF27F81a' as `0x${string}`,
  },
  [baseSepolia.id]: {
    escrow: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    arbitration: '0x0000000000000000000000000000000000000000' as `0x${string}`,
  },
} as const;

export const DEFAULT_CHAIN = base;
