# BaseEscrow

A decentralized escrow system for secure peer-to-peer transactions on Base Network with community-powered dispute resolution.

## Features

- **Secure Escrow**: Funds held safely until both parties confirm transaction
- **Community Arbitration**: Disputes resolved by trusted community arbitrators
- **Reputation System**: Build trust through transparent ratings and reviews
- **Timeout Protection**: Automatic refunds/releases if parties don't respond
- **Multiple Categories**: Support for second-hand items, freelancing, services, digital goods
- **Base Mini App Ready**: Fully compliant with Base Mini App standards

## Architecture

```
BaseEscrow/
├── contracts/              # Solidity smart contracts
│   ├── BaseEscrow.sol     # Main escrow contract
│   └── ArbitrationSystem.sol # Dispute resolution
├── scripts/               # Deployment scripts
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom hooks
│   │   ├── config/       # Wagmi & contract config
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets & manifest
└── deployments/          # Deployment artifacts
```

## Quick Start

### Prerequisites

- Node.js v18+
- npm or yarn
- Wallet with ETH on Base

### Installation

```bash
# Clone repository
git clone <repo-url>
cd BaseEscrow

# Install contract dependencies
npm install

# Install frontend dependencies
cd frontend && npm install
```

### Local Development

```bash
# Terminal 1: Start local Hardhat node
npx hardhat node

# Terminal 2: Deploy contracts locally
npm run deploy:local

# Terminal 3: Start frontend
cd frontend && npm run dev
```

### Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

## Smart Contracts

### BaseEscrow.sol

Main escrow contract managing:
- Transaction lifecycle (Created → Funded → Shipped → Completed)
- Timeout mechanisms for buyer/seller protection
- Rating and reputation system
- Protocol fee collection

### ArbitrationSystem.sol

Dispute resolution contract handling:
- Arbitrator registration and staking
- Random arbitrator selection
- Voting mechanism (3 of 5 quorum)
- Reward/penalty distribution

## Transaction Flow

### Happy Path
1. Buyer creates transaction with ETH deposit
2. Seller confirms shipment
3. Buyer confirms receipt
4. Funds released to seller
5. Both parties rate each other

### Dispute Path
1. Either party initiates dispute
2. 5 arbitrators randomly selected
3. Both parties submit evidence
4. Arbitrators vote within 3 days
5. Majority wins, funds distributed accordingly

## Tech Stack

**Contracts:**
- Solidity 0.8.20
- OpenZeppelin Contracts
- Hardhat

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Wagmi v2 + Viem
- RainbowKit

## Base Mini App Compliance

This app meets all Base Mini App requirements:

- ✅ manifest.json with all required fields
- ✅ Multiple icon sizes (192x192, 512x512)
- ✅ Open Graph metadata
- ✅ Farcaster Frame support
- ✅ HTTPS with proper CORS
- ✅ Responsive mobile-first design

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## Security

- Contracts use OpenZeppelin's battle-tested implementations
- ReentrancyGuard on all fund transfers
- Pausable for emergency situations
- Checks-Effects-Interactions pattern

**Audit Status:** Not audited - use at your own risk for production.

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Links

- [Base Network](https://base.org)
- [BaseScan](https://basescan.org)
- [Documentation](./DEPLOYMENT.md)
