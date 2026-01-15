import { ethers, run, network } from "hardhat";

const ESCROW_ADDRESS = "0x3E85720F2073Ed91a467EfC24848D7c29050Ecc4";
const ARBITRATION_ADDRESS = "0xcE390fDf91783712E6ffF06208Ee0d7CFF27F81a";

async function main() {
  console.log("=".repeat(60));
  console.log("Link & Verify Contracts");
  console.log("=".repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  // Check if already linked
  const escrow = await ethers.getContractAt("BaseEscrow", ESCROW_ADDRESS);
  const currentArb = await escrow.arbitrationContract();
  console.log(`Current arbitration contract: ${currentArb}`);

  if (currentArb.toLowerCase() === ARBITRATION_ADDRESS.toLowerCase()) {
    console.log("Already linked!");
  } else if (currentArb === "0x0000000000000000000000000000000000000000") {
    console.log("\nLinking ArbitrationSystem to BaseEscrow...");
    const tx = await escrow.setArbitrationContract(ARBITRATION_ADDRESS, {
      gasLimit: 100000,
    });
    console.log(`TX Hash: ${tx.hash}`);
    await tx.wait();
    console.log("Linked successfully!");
  } else {
    console.log(`Already linked to different address: ${currentArb}`);
  }

  // Verify contracts
  console.log("\n" + "=".repeat(60));
  console.log("Verifying on BaseScan...");
  console.log("=".repeat(60));

  try {
    console.log("\nVerifying BaseEscrow...");
    await run("verify:verify", {
      address: ESCROW_ADDRESS,
      constructorArguments: [150],
    });
  } catch (e: any) {
    console.log(e.message.includes("Already") ? "Already verified" : e.message);
  }

  try {
    console.log("\nVerifying ArbitrationSystem...");
    await run("verify:verify", {
      address: ARBITRATION_ADDRESS,
      constructorArguments: [ESCROW_ADDRESS],
    });
  } catch (e: any) {
    console.log(e.message.includes("Already") ? "Already verified" : e.message);
  }

  console.log("\n" + "=".repeat(60));
  console.log("Done!");
  console.log("=".repeat(60));
  console.log(`BaseEscrow:        ${ESCROW_ADDRESS}`);
  console.log(`ArbitrationSystem: ${ARBITRATION_ADDRESS}`);

  // Save deployment
  const fs = await import("fs");
  if (!fs.existsSync("./deployments")) fs.mkdirSync("./deployments");
  fs.writeFileSync("./deployments/base.json", JSON.stringify({
    network: "base",
    chainId: 8453,
    contracts: { BaseEscrow: ESCROW_ADDRESS, ArbitrationSystem: ARBITRATION_ADDRESS },
    timestamp: new Date().toISOString()
  }, null, 2));
}

main().catch(console.error);
