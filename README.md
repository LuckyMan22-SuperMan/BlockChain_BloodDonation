# Blood Donation Registry

A decentralized application for coordinating blood requests and tracking verified donations on a local Ethereum blockchain (Ganache).

Users connect through MetaMask. The admin (the account that deployed the contract) approves hospitals. Approved hospitals create blood requests and record verified donations. Donors register themselves with their age and blood group.

## Project Details

- **Course:** Blockchain Technology (CSE4444)
- **Assignment:** Assignment 2
- **Student name:** Lakshya Agrawal
- **Registration number:** 230905552

## Problem Addressed

Blood requests are often coordinated through unverified social media posts, and donors have no shared way to prove their donation history or eligibility.

Blood Donation Registry keeps a shared record of hospital requests and donor activity. Blockchain transactions make requests and recorded donations independently inspectable. The smart contract enforces rules on-chain: only approved hospitals can raise requests, donors must be 18 to 65, blood groups must match, and a donor must wait 90 days between donations.

The application records what hospitals and donors submit. It does not verify that a physical donation took place.

## Features

- Connect a MetaMask wallet.
- Admin approves hospital addresses.
- Donors register with name, age and blood group.
- Approved hospitals create blood requests (blood group and units).
- Approved hospitals record donations against their own open requests.
- Network statistics (donors, requests, donations) and request cards are read from the blockchain and shown in the UI.
- On-chain validation with readable revert messages.

## Technologies Used

| Component | Technology |
|---|---|
| Smart contract | Solidity (compiler 0.8.34, EVM version shanghai) |
| Blockchain | Ganache local chain (chain ID 1337) |
| Compilation and deployment | Remix IDE |
| Frontend | HTML, CSS, JavaScript |
| Blockchain interaction | Ethers.js v6 (6.7.0 via CDN) |
| Wallet | MetaMask |
| Local web server | Python `http.server` |

## Project Structure

```text
blood-donation-dapp/
├── BloodDonationRegistry.sol
├── index.html
├── style.css
├── app.js
├── README.md
└── screenshots/
```

## Smart Contract Design

### Admin

The constructor stores the deploying account as `admin` (declared `immutable`, so it cannot change).

### Data

- `Donor`: name, age, blood group, last donation time, total donations, registered flag
- `Hospital`: name, approved flag
- `BloodRequest`: id, hospital, blood group, units required, units fulfilled, status (Open, Fulfilled, Cancelled), created time
- `DonationRecord`: request id, donor, hospital, blood group, timestamp

Request IDs begin at `0`. Blood groups are numbered: A+=0, A-=1, B+=2, B-=3, AB+=4, AB-=5, O+=6, O-=7.

### Functions

| Function | Purpose | Access |
|---|---|---|
| `addHospital(address, name)` | Approve a hospital | Admin only |
| `revokeHospital(address)` | Revoke an approved hospital | Admin only |
| `registerDonor(name, age, bloodGroup)` | Register the caller as a donor | Anyone (once) |
| `createRequest(bloodGroup, units)` | Create a blood request | Approved hospital |
| `recordDonation(requestId, donor)` | Record a donation on the hospital's own open request | Approved hospital |
| `getRequest(id)`, `getRequestCount()`, `getDonationCount()`, `totalDonors()`, `admin()` | Read data | Anyone |

### Validation (revert messages)

| Check | Revert message |
|---|---|
| Caller is not the admin | `Only admin` |
| Caller is not an approved hospital | `Only approved hospital` |
| Empty hospital name | `Hospital name required` |
| Hospital already approved | `Hospital already approved` |
| Revoking a hospital that is not approved | `Hospital not approved` |
| Donor already registered | `Already registered` |
| Donor name not 3 to 80 bytes | `Name must be 3-80 chars` |
| Age outside 18 to 65 | `Age must be 18-65` |
| Units not 1 to 20 | `Units must be 1-20` |
| Request id does not exist | `Request does not exist` |
| Request belongs to another hospital | `Not your request` |
| Request already fulfilled or cancelled | `Request not open` |
| Donor not registered | `Donor not registered` |
| Donor and request blood groups differ | `Blood group mismatch` |
| Donor donated in the last 90 days | `Donor not eligible yet` |

### Events

`HospitalApproved`, `HospitalRevoked`, `DonorRegistered`, `RequestCreated`, `DonationRecorded`.

## Deployment Details

| Item | Value |
|---|---|
| Network | Ganache local blockchain (not a public network) |
| RPC URL | `http://127.0.0.1:8545` |
| Chain ID | `1337` |
| Contract address | `0x97A8C8D90e7d83Db69C22C455F131fA2081051cd` |
| Admin (deployer) address | `0xdDef0301AF6445C5A0c20fecdB5035e5cb04042F` |
| Solidity compiler | `0.8.34`, EVM version `shanghai` |
| Deployment transaction hash | `0x35eedf2a805b83021cf347534c30aee534836020ff6cb0814c407699106f2e19` |
| Deployment block | `1` |

Test accounts used (Ganache accounts imported into MetaMask):

| Role | Address |
|---|---|
| Admin | `0xdDef0301AF6445C5A0c20fecdB5035e5cb04042F` |
| Hospital | `0x024d18a4Fff49E38af64D2cA58784B371803238f` |
| Unauthorised user | `0x7A870EC146E021cf1907A578Bb035544e59a615C` |

Some contract-level tests were run in Remix's built-in **Remix VM** (a separate in-browser chain with its own contract instance, `0xd9145CCE52D386f254917e481eB44e9943F39138`). These are labelled in the test tables below.

## How to Run the Application

### Prerequisites

- Node.js and npm
- Python 3
- Google Chrome with the MetaMask extension
- Internet access (Ethers.js loads from a CDN)

### 1. Start Ganache

```bash
npx ganache --chain.chainId 1337
```

Keep this terminal open. Restarting it wipes the chain and the deployed contract.

### 2. Connect MetaMask to Ganache

1. In MetaMask, add a custom network: name `Ganache`, RPC URL `http://127.0.0.1:8545`, chain ID `1337`, currency symbol `ETH`.
2. Import Ganache accounts into MetaMask using the private keys printed in the Ganache terminal, and rename them Admin, Hospital and Unauthorised. These are test-only keys. Never commit private keys.
3. For the website `localhost:3000`, set the connected network to the Ganache network (MetaMask remembers networks per site). If it points to Ethereum Mainnet, the page reports `could not decode result data` because no contract exists at that address there.

### 3. Compile and deploy in Remix

1. Open https://remix.ethereum.org/ and create `BloodDonationRegistry.sol` with the contract source.
2. Under **Solidity Compiler**, choose version 0.8.20 or newer (0.8.34 used), set **EVM Version** to `shanghai` (matches Ganache's hardfork), and compile.
3. Under **Deploy & Run**, choose **Browser Extension, MetaMask** as the environment, with the Admin account selected on the Ganache network.
4. Click **Deploy** and confirm in MetaMask.
5. Copy the deployed contract address from **Deployed Contracts**.

### 4. Run the frontend

1. Set `CONTRACT_ADDRESS` in `app.js` to the deployed address.
2. In the project folder, run:

   ```bash
   python3 -m http.server 3000
   ```

3. Open `http://localhost:3000` in Chrome.
4. Click **Connect MetaMask** and approve.

Keep both terminals running while using the app.

## Interact With the Application

1. **Approve a hospital (Admin):** paste the hospital address and a name under *Admin: Manage Hospitals*, click **Approve**, confirm in MetaMask.
2. **Create a request (Hospital):** switch MetaMask to the Hospital account, reload, connect, choose a blood group and units under *Hospital: Create Request*, and confirm.
3. **Register a donor (any account):** fill in *Donor: Register* and confirm.
4. **Record a donation (Hospital):** enter the request ID and donor address under *Hospital: Record Donation* and confirm.
5. **Read blockchain data:** the statistics and *Active Requests & Logs* update after each transaction, or click **Refresh data**.

Reading data needs no transaction fee. Writing data needs ETH, which Ganache provides.

## Testing

Tests were run in two environments: **Remix VM** (contract-level) and **Ganache** (through the frontend or Remix with MetaMask). Results below are what was observed.

### Valid inputs

| ID | Environment | Account | Action | Expected | Observed result |
|---|---|---|---|---|---|
| V1 | Remix VM | Account 1 | `addHospital(0xAb84…5cb2, "City Hospital")` | Success | Success: "Transaction mined and execution completed", block 2, 1 log emitted |
| V2 | Ganache, UI | Admin | Approve hospital `0x024d…238f` through the page | Success | MetaMask confirmed the transaction as successful |
| V3 | Ganache, UI | Hospital | Create request: O+, 2 units | Request stored | Status line "Request created", Requests: 1, card shows "Request #0 — O+, Units 0/2, Open" |

### Invalid inputs

| ID | Environment | Account | Action | Expected | Observed result |
|---|---|---|---|---|---|
| I1 | Ganache, Remix + MetaMask | Admin | `registerDonor("Minor", 17, 0)` | Rejected: `Age must be 18-65` | Transaction mined in block 5 but execution failed (status 0). The age check is the only rule a 17-year-old violates. |
| I2 | Ganache, UI | Admin | Approve the same hospital a second time | Rejected: `Hospital already approved` | Rejected during gas estimation, no transaction mined. The UI showed a `CALL_EXCEPTION` without the reason text. |

### Unauthorised inputs

| ID | Environment | Account | Action | Expected | Observed result |
|---|---|---|---|---|---|
| U1 | Remix VM | Account 5 (non-admin) | `addHospital(0x617F…E7f2, "Fake")` | Rejected: `Only admin` | Reverted. Remix showed `Reason provided by the contract: "Only admin"`. |
| U2 | Ganache, UI | Unauthorised | Approve hospital `0x7A87…615C` with name "Fake" | Rejected: `Only admin` | Rejected during gas estimation, no transaction mined. The UI showed `missing revert data … CALL_EXCEPTION`. |

An error rejected during gas estimation is a rejected call, not a mined failed transaction. Such a call has no transaction hash. I1 is the only failed transaction that was mined and has a hash.

### Not tested

These contract functions exist but were not exercised during testing: `registerDonor` with valid input, `recordDonation` (including the blood-group and 90-day cooldown checks), `revokeHospital`.

## Transaction Evidence

| Action | Environment | Transaction hash |
|---|---|---|
| Contract deployment | Ganache | `0x35eedf2a805b83021cf347534c30aee534836020ff6cb0814c407699106f2e19` |
| Create request (O+, 2 units) | Ganache | `0x5686d63fc33626a2df18c1f89ccfec9f357f7a20c4364864e7088e49bdf2e947` |
| Failed `registerDonor` (age 17), mined with status 0 | Ganache | `0x4da6242416fd52858fd9006cfbfc1904e396e8585a8666bd96dfc0b1e4a86769` |
| `addHospital` success | Remix VM | `0xae62c6bd98ff46d13020eb4b53539cae3f9017c10adc2f78557d11dbf4c446eb` |

## Screenshots

### Smart contract compilation
![Compilation](screenshots/Successful_compilation.png)

### Smart contract deployment (Ganache)
![Deployment](screenshots/Successful_Deployment.png)

### MetaMask wallet connection
![Wallet connected](screenshots/Wallet_connected_successfully.png)

### Successful transaction
Contract-level (Remix VM):

![Successful transaction in Remix](screenshots/Successful_transaction.png)

Through the UI (Ganache), including blockchain data displayed on the page:

![Successful transaction and data in UI](screenshots/Successful_transaction_UI_BlockChain_data.png)

### Failed transactions
Unauthorised call in Remix VM (`Only admin`):

![Failed transaction in Remix](screenshots/Failed_transaction.png)

Unauthorised call through the UI (Ganache):

![Failed transaction in UI](screenshots/Failed_transaction_UI_BlockChain_data.png)

Invalid input, age 17, mined with status 0 (Ganache):

![Invalid input](screenshots/Invalid.png)

## Security and Limitations

- No private keys, recovery phrases or credentials are included in this repository. Account private keys stay inside MetaMask and the Ganache terminal.
- Authorization is enforced by the smart contract, not only by the interface.
- Data on the chain is public. Donor names and ages should not be real personal data in a real deployment.
- The `Revoke` button in the UI is not connected to the contract in this version. `revokeHospital` exists in the contract and can be called from Remix.
- The UI shows request cards and totals but does not list individual donation records.
- The UI does not check which network MetaMask is on. It must be set to the Ganache network for `localhost:3000`.
- The UI shows raw gas-estimation errors rather than the contract's revert reason for rejected calls.
- The frontend loads requests one at a time and is intended for a small assignment demonstration.
- Deployed on a local Ganache chain for educational testing only.
