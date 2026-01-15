# BaseEscrow Deployment Guide

This guide covers the complete deployment process for BaseEscrow on Base Mainnet, including smart contract deployment, frontend setup, and Base Mini App configuration.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Smart Contract Deployment](#smart-contract-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Base Mini App Configuration](#base-mini-app-configuration)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

- Node.js v18+ and npm/yarn
- Git
- A wallet with ETH on Base (for deployment gas fees)
- BaseScan API key (for contract verification)
- WalletConnect Project ID

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd BaseEscrow
```

2. Install dependencies for contracts:
```bash
npm install
```

3. Install dependencies for frontend:
```bash
cd frontend
npm install
cd ..
```

---

## Smart Contract Deployment

### Step 1: Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Your deployer wallet private key (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# BaseScan API key for contract verification
BASESCAN_API_KEY=your_basescan_api_key_here
```

### Step 2: Compile Contracts

```bash
npm run compile
```

This will compile both `BaseEscrow.sol` and `ArbitrationSystem.sol`.

### Step 3: Deploy to Base Sepolia (Testnet) - Recommended First

```bash
npm run deploy:base-sepolia
```

Expected output:
```
============================================================
BaseEscrow Deployment Script
============================================================
Network: baseSepolia
Chain ID: 84532
Deployer: 0x...
Balance: X.XX ETH
------------------------------------------------------------

1. Deploying BaseEscrow...
   BaseEscrow deployed to: 0x...

2. Deploying ArbitrationSystem...
   ArbitrationSystem deployed to: 0x...

3. Configuring contracts...
   ArbitrationSystem linked to BaseEscrow

============================================================
Deployment Summary
============================================================
BaseEscrow:        0x...
ArbitrationSystem: 0x...
Protocol Fee:      1.5%
============================================================
```

### Step 4: Deploy to Base Mainnet

Once tested on Sepolia, deploy to mainnet:

```bash
npm run deploy:base
```

### Step 5: Verify Contracts on BaseScan

The deployment script automatically attempts verification. If it fails, verify manually:

```bash
# Verify BaseEscrow
npx hardhat verify --network base <ESCROW_ADDRESS> 150

# Verify ArbitrationSystem
npx hardhat verify --network base <ARBITRATION_ADDRESS> <ESCROW_ADDRESS>
```

### Step 6: Save Contract Addresses

After deployment, note the contract addresses from `deployments/base.json`:

```json
{
  "contracts": {
    "BaseEscrow": "0x...",
    "ArbitrationSystem": "0x..."
  }
}
```

---

## Frontend Deployment

### Step 1: Configure Environment Variables

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Production URL
NEXT_PUBLIC_APP_URL=https://your-domain.com

# WalletConnect Project ID
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Contract addresses from deployment
NEXT_PUBLIC_ESCROW_CONTRACT_BASE=0x...
NEXT_PUBLIC_ARBITRATION_CONTRACT_BASE=0x...
```

### Step 2: Update Contract Addresses in Code

Edit `src/config/wagmi.ts`:

```typescript
export const CONTRACT_ADDRESSES = {
  [base.id]: {
    escrow: '0xYOUR_ESCROW_ADDRESS' as `0x${string}`,
    arbitration: '0xYOUR_ARBITRATION_ADDRESS' as `0x${string}`,
  },
  // ... baseSepolia if needed
} as const;
```

### Step 3: Build the Frontend

```bash
npm run build
```

### Step 4: Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

Or deploy via CLI:

```bash
npm install -g vercel
vercel --prod
```

### Step 5: Configure Custom Domain

1. Add your domain in Vercel settings
2. Configure DNS records as instructed
3. Enable HTTPS (automatic with Vercel)

---

## Base Mini App Configuration

### Step 1: Generate Account Association Signature

The `farcaster.json` requires an account association to prove domain ownership.

**Option A: Use Farcaster Developer Tools (Recommended)**
1. Go to https://warpcast.com/~/developers/frames
2. Create a new Mini App
3. Add your domain
4. Copy the generated `accountAssociation` object

**Option B: Generate manually**
```javascript
// Use @farcaster/hub-web to sign the domain
import { createAppKey } from '@farcaster/hub-web';

const domain = 'baseescrow.app';
// Sign with your Farcaster custody address
```

Update `frontend/public/.well-known/farcaster.json` with your signature:
```json
{
  "accountAssociation": {
    "header": "YOUR_HEADER",
    "payload": "YOUR_PAYLOAD",
    "signature": "YOUR_SIGNATURE"
  }
}
```

### Step 2: Generate App Icons

Create a **1024x1024 PNG icon** (required for Mini Apps):

| Size | Filename | Purpose |
|------|----------|---------|
| 1024x1024 | icon-1024x1024.png | **Mini App icon (REQUIRED)** |
| 512x512 | icon-512x512.png | PWA / Fallback |
| 200x200 | splash.png | Splash screen loader |

**Important**: Icon must be PNG, no transparent background recommended.

Use the provided SVG at `public/icons/icon.svg` as a template.

### Step 3: Create Screenshots

Create app screenshots (recommended 1284x2778 for iPhone):

| Filename | Description |
|----------|-------------|
| dashboard.png | Dashboard view |
| create.png | Create transaction |
| transaction.png | Transaction detail |

Place in `frontend/public/screenshots/`

### Step 4: Create Open Graph / Hero Image

Create these images in `frontend/public/`:

| File | Size | Purpose |
|------|------|---------|
| og-image.png | 1200x630 | Open Graph sharing |
| hero-image.png | 1200x630 | Featured hero banner |

### Step 5: Update farcaster.json URLs

Edit `frontend/public/.well-known/farcaster.json`:

1. Replace `baseescrow.app` with your actual domain
2. Update all image URLs
3. Add your account association signature

### Step 6: Verify Manifest Accessibility

After deployment, verify:

```bash
# Check farcaster.json is accessible
curl https://your-domain.com/.well-known/farcaster.json

# Check icons are accessible
curl -I https://your-domain.com/icons/icon-512x512.png

# Validate JSON structure
curl -s https://your-domain.com/.well-known/farcaster.json | jq .
```

### Step 7: Test in Base Preview Tool

1. Go to https://base.org/builders/miniapps/preview
2. Enter your app URL
3. Verify:
   - Manifest loads correctly
   - Account association is valid
   - All images load
   - App launches properly
4. Test wallet connection and core flows

---

## Post-Deployment Verification

### Smart Contracts

1. **Verify on BaseScan:**
   - Visit `https://basescan.org/address/<CONTRACT_ADDRESS>`
   - Confirm contract is verified
   - Check "Read Contract" and "Write Contract" tabs work

2. **Test Basic Functions:**
   ```javascript
   // Read protocol fee
   const fee = await escrow.protocolFeePercentage();
   console.log('Protocol Fee:', fee.toString());

   // Read arbitration contract
   const arbContract = await escrow.arbitrationContract();
   console.log('Arbitration:', arbContract);
   ```

### Frontend

1. **Check Meta Tags:**
   ```bash
   curl https://your-domain.com | grep -E "(og:|fc:)"
   ```

2. **Lighthouse Audit:**
   - Run Lighthouse in Chrome DevTools
   - Check PWA score
   - Verify performance metrics

3. **Test Wallet Connection:**
   - Test with MetaMask
   - Test with Coinbase Wallet
   - Test with WalletConnect

### Base Mini App

1. **Manifest Validation:**
   - Use a PWA manifest validator
   - Verify all required fields present
   - Check icon URLs resolve

2. **Frame Testing:**
   - Test Farcaster Frame metadata
   - Verify frame preview renders

---

## Troubleshooting

### Contract Deployment Issues

**Error: "insufficient funds"**
- Ensure deployer wallet has enough ETH on Base
- Current gas price: ~0.001 gwei on Base

**Error: "nonce too low"**
- Clear pending transactions
- Or increment nonce manually in transaction

**Verification fails**
- Wait 30-60 seconds after deployment
- Ensure constructor arguments match exactly
- Check BaseScan API key is valid

### Frontend Issues

**Wallet connection fails**
- Verify WalletConnect Project ID is correct
- Check CORS headers allow wallet domains
- Ensure user is on Base network

**Transactions fail**
- Verify contract addresses are correct
- Check user has sufficient ETH for gas
- Verify contract is not paused

### Mini App Issues

**Manifest not loading**
- Check CORS headers on manifest.json
- Verify JSON is valid (no trailing commas)
- Ensure HTTPS is enabled

**Icons not displaying**
- Verify file paths in manifest
- Check images are PNG format
- Ensure proper sizes

---

## Security Checklist

Before going live:

- [ ] Contracts audited (recommended)
- [ ] Contract ownership secured (multisig recommended)
- [ ] Emergency pause function tested
- [ ] Protocol fee withdrawal tested
- [ ] Frontend environment variables secured
- [ ] HTTPS enabled and forced
- [ ] Rate limiting configured
- [ ] Error logging enabled

---

## Maintenance

### Contract Updates

To update protocol parameters:

```javascript
// Update protocol fee (only owner)
await escrow.setProtocolFee(200); // 2%

// Update timeout durations
await escrow.setTimeoutDurations(
  14 * 24 * 60 * 60, // 14 days buyer timeout
  7 * 24 * 60 * 60   // 7 days seller timeout
);

// Pause in emergency
await escrow.pause();
```

### Monitoring

Recommended monitoring:
- Set up event listeners for critical events
- Monitor contract balance
- Track transaction success rates
- Alert on dispute escalations

---

## Support

For issues:
1. Check this documentation
2. Review contract events on BaseScan
3. Open GitHub issue with details

---

**Deployment completed successfully? Submit your app to Base Mini Apps directory!**
