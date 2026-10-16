import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.7.0/ethers.min.js";

// REPLACE THIS WITH YOUR DEPLOYED CONTRACT ADDRESS
const CONTRACT_ADDRESS = "0x97A8C8D90e7d83Db69C22C455F131fA2081051cd"; 

const ABI = [
  "function admin() view returns (address)",
  "function totalDonors() view returns (uint256)",
  "function addHospital(address hospitalAddress, string name)",
  "function revokeHospital(address hospitalAddress)",
  "function registerDonor(string name, uint8 age, uint8 bloodGroup)",
  "function createRequest(uint8 bloodGroup, uint256 unitsRequired)",
  "function recordDonation(uint256 requestId, address donor)",
  "function getRequest(uint256 requestId) view returns (tuple(uint256 id, address hospital, uint8 bloodGroup, uint256 unitsRequired, uint256 unitsFulfilled, uint8 status, uint256 createdAt))",
  "function getRequestCount() view returns (uint256)",
  "function getDonationCount() view returns (uint256)"
];

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const REQUEST_STATUS = ["Open", "Fulfilled", "Cancelled"];

const connectButton = document.querySelector("#connectButton");
const refreshButton = document.querySelector("#refreshButton");
const accountText = document.querySelector("#account");
const statusText = document.querySelector("#status");
const dataOutput = document.querySelector("#dataOutput");

let provider, signer, contract, account, adminAddress;

function showError(error) {
  statusText.textContent = error.shortMessage || error.reason || error.message || String(error);
}

async function connect() {
  if (!window.ethereum) {
    statusText.textContent = "Install MetaMask to use this app.";
    return;
  }
  try {
    provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    signer = await provider.getSigner();
    account = await signer.getAddress();
    contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
    adminAddress = await contract.admin();

    accountText.textContent = `Connected: ${account}`;
    statusText.textContent = "Connected successfully.";
    await refreshData();
  } catch (error) {
    showError(error);
  }
}

async function refreshData() {
  if (!contract) {
    statusText.textContent = "Connect MetaMask first.";
    return;
  }
  try {
    dataOutput.replaceChildren();
    const donorCount = await contract.totalDonors();
    const requestCount = await contract.getRequestCount();
    const donationCount = await contract.getDonationCount();

    document.querySelector("#statDonors").textContent = donorCount.toString();
    document.querySelector("#statRequests").textContent = requestCount.toString();
    document.querySelector("#statDonations").textContent = donationCount.toString();

    if (requestCount === 0n) {
      dataOutput.textContent = "No requests found.";
      return;
    }

    for (let id = requestCount - 1n; id >= 0n; id--) {
      const req = await contract.getRequest(id);
      const card = document.createElement("article");
      card.className = "ticket";
      
      const heading = document.createElement("h3");
      heading.textContent = `Request #${req.id} — ${BLOOD_GROUPS[Number(req.bloodGroup)]}`;
      card.append(heading);
      
      const details = document.createElement("p");
      details.textContent = `Units: ${req.unitsFulfilled}/${req.unitsRequired} · Status: ${REQUEST_STATUS[Number(req.status)]} · Hospital: ${req.hospital}`;
      card.append(details);
      dataOutput.append(card);
      
      if (id === 0n) break;
    }
  } catch (error) {
    showError(error);
  }
}

// Event Listeners for Forms
document.querySelector("#approveHospitalBtn").addEventListener("click", async () => {
  try {
    const addr = document.querySelector("#hospitalAddress").value.trim();
    const name = document.querySelector("#hospitalName").value.trim();
    statusText.textContent = "Confirm hospital approval in MetaMask...";
    const tx = await contract.addHospital(addr, name);
    await tx.wait();
    statusText.textContent = `Hospital approved. Tx: ${tx.hash}`;
  } catch (error) { showError(error); }
});

document.querySelector("#donorForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const name = document.querySelector("#donorName").value.trim();
    const age = Number(document.querySelector("#donorAge").value);
    const group = Number(document.querySelector("#donorGroup").value);
    statusText.textContent = "Confirm registration in MetaMask...";
    const tx = await contract.registerDonor(name, age, group);
    await tx.wait();
    document.querySelector("#donorForm").reset();
    statusText.textContent = `Donor registered. Tx: ${tx.hash}`;
    await refreshData();
  } catch (error) { showError(error); }
});

document.querySelector("#requestForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const group = Number(document.querySelector("#requestGroup").value);
    const units = BigInt(document.querySelector("#requestUnits").value);
    statusText.textContent = "Confirm request creation in MetaMask...";
    const tx = await contract.createRequest(group, units);
    await tx.wait();
    document.querySelector("#requestForm").reset();
    statusText.textContent = `Request created. Tx: ${tx.hash}`;
    await refreshData();
  } catch (error) { showError(error); }
});

document.querySelector("#recordForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const reqId = BigInt(document.querySelector("#actionRequestId").value);
    const donorAddr = document.querySelector("#actionDonor").value.trim();
    statusText.textContent = "Confirm donation record in MetaMask...";
    const tx = await contract.recordDonation(reqId, donorAddr);
    await tx.wait();
    document.querySelector("#recordForm").reset();
    statusText.textContent = `Donation recorded. Tx: ${tx.hash}`;
    await refreshData();
  } catch (error) { showError(error); }
});

connectButton.addEventListener("click", connect);
refreshButton.addEventListener("click", refreshData);

if (window.ethereum) {
  window.ethereum.on("accountsChanged", () => window.location.reload());
  window.ethereum.on("chainChanged", () => window.location.reload());
}