import { ethers, run, network } from "hardhat";

async function main() {
  console.log("=".repeat(60));
  console.log("BaseEscrow Deployment Script");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`Chain ID: ${network.config.chainId}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("-".repeat(60));

  // Protocol fee: 150 basis points = 1.5%
  const PROTOCOL_FEE = 150;

  // Deploy BaseEscrow
  console.log("\n1. Deploying BaseEscrow...");
  const BaseEscrow = await ethers.getContractFactory("BaseEscrow");
  const escrow = await BaseEscrow.deploy(PROTOCOL_FEE);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log(`   BaseEscrow deployed to: ${escrowAddress}`);

  // Deploy ArbitrationSystem
  console.log("\n2. Deploying ArbitrationSystem...");
  const ArbitrationSystem = await ethers.getContractFactory("ArbitrationSystem");
  const arbitration = await ArbitrationSystem.deploy(escrowAddress);
  await arbitration.waitForDeployment();
  const arbitrationAddress = await arbitration.getAddress();
  console.log(`   ArbitrationSystem deployed to: ${arbitrationAddress}`);

  // Configure BaseEscrow to use ArbitrationSystem
  console.log("\n3. Configuring contracts...");
  const setArbTx = await escrow.setArbitrationContract(arbitrationAddress);
  await setArbTx.wait();
  console.log("   ArbitrationSystem linked to BaseEscrow");

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log(`BaseEscrow:        ${escrowAddress}`);
  console.log(`ArbitrationSystem: ${arbitrationAddress}`);
  console.log(`Protocol Fee:      ${PROTOCOL_FEE / 100}%`);
  console.log("=".repeat(60));

  // Verify contracts on BaseScan (skip for local network)
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\n4. Waiting for block confirmations before verification...");
    console.log("   Waiting 30 seconds...");
    await new Promise((resolve) => setTimeout(resolve, 30000));

    console.log("\n5. Verifying contracts on BaseScan...");

    try {
      console.log("   Verifying BaseEscrow...");
      await run("verify:verify", {
        address: escrowAddress,
        constructorArguments: [PROTOCOL_FEE],
      });
      console.log("   BaseEscrow verified!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("   BaseEscrow already verified");
      } else {
        console.log(`   Error verifying BaseEscrow: ${error.message}`);
      }
    }

    try {
      console.log("   Verifying ArbitrationSystem...");
      await run("verify:verify", {
        address: arbitrationAddress,
        constructorArguments: [escrowAddress],
      });
      console.log("   ArbitrationSystem verified!");
    } catch (error: any) {
      if (error.message.includes("Already Verified")) {
        console.log("   ArbitrationSystem already verified");
      } else {
        console.log(`   Error verifying ArbitrationSystem: ${error.message}`);
      }
    }
  }

  // Write deployment info to file
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    contracts: {
      BaseEscrow: escrowAddress,
      ArbitrationSystem: arbitrationAddress,
    },
    configuration: {
      protocolFee: `${PROTOCOL_FEE / 100}%`,
      protocolFeeBasisPoints: PROTOCOL_FEE,
    },
    timestamp: new Date().toISOString(),
  };

  const fs = await import("fs");
  const deploymentPath = `./deployments/${network.name}.json`;

  // Create deployments directory if it doesn't exist
  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }

  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log(`\nDeployment info saved to: ${deploymentPath}`);

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Complete!");
  console.log("=".repeat(60));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
