import { ethers, run, network } from "hardhat";

// BaseEscrow address from previous deployment
const ESCROW_ADDRESS = "0x3E85720F2073Ed91a467EfC24848D7c29050Ecc4";

async function main() {
  console.log("=".repeat(60));
  console.log("ArbitrationSystem Deployment (Continuation)");
  console.log("=".repeat(60));
  console.log(`Network: ${network.name}`);
  console.log(`BaseEscrow: ${ESCROW_ADDRESS}`);

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
  console.log("-".repeat(60));

  // Deploy ArbitrationSystem
  console.log("\n1. Deploying ArbitrationSystem...");
  const ArbitrationSystem = await ethers.getContractFactory("ArbitrationSystem");
  const arbitration = await ArbitrationSystem.deploy(ESCROW_ADDRESS);
  await arbitration.waitForDeployment();
  const arbitrationAddress = await arbitration.getAddress();
  console.log(`   ArbitrationSystem deployed to: ${arbitrationAddress}`);

  // Configure BaseEscrow to use ArbitrationSystem
  console.log("\n2. Linking ArbitrationSystem to BaseEscrow...");
  const escrow = await ethers.getContractAt("BaseEscrow", ESCROW_ADDRESS);
  const setArbTx = await escrow.setArbitrationContract(arbitrationAddress);
  await setArbTx.wait();
  console.log("   ArbitrationSystem linked to BaseEscrow");

  console.log("\n" + "=".repeat(60));
  console.log("Deployment Summary");
  console.log("=".repeat(60));
  console.log(`BaseEscrow:        ${ESCROW_ADDRESS}`);
  console.log(`ArbitrationSystem: ${arbitrationAddress}`);
  console.log("=".repeat(60));

  // Verify contracts
  console.log("\n3. Waiting 30s before verification...");
  await new Promise((resolve) => setTimeout(resolve, 30000));

  console.log("\n4. Verifying contracts on BaseScan...");

  // Verify BaseEscrow
  try {
    console.log("   Verifying BaseEscrow...");
    await run("verify:verify", {
      address: ESCROW_ADDRESS,
      constructorArguments: [150], // Protocol fee 1.5%
    });
    console.log("   BaseEscrow verified!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   BaseEscrow already verified");
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }

  // Verify ArbitrationSystem
  try {
    console.log("   Verifying ArbitrationSystem...");
    await run("verify:verify", {
      address: arbitrationAddress,
      constructorArguments: [ESCROW_ADDRESS],
    });
    console.log("   ArbitrationSystem verified!");
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log("   ArbitrationSystem already verified");
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }

  // Save deployment info
  const fs = await import("fs");
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    deployer: deployer.address,
    contracts: {
      BaseEscrow: ESCROW_ADDRESS,
      ArbitrationSystem: arbitrationAddress,
    },
    timestamp: new Date().toISOString(),
  };

  if (!fs.existsSync("./deployments")) {
    fs.mkdirSync("./deployments");
  }
  fs.writeFileSync(`./deployments/${network.name}.json`, JSON.stringify(deploymentInfo, null, 2));

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
