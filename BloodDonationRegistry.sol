// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BloodDonationRegistry {
    enum BloodGroup { A_POS, A_NEG, B_POS, B_NEG, AB_POS, AB_NEG, O_POS, O_NEG }
    enum RequestStatus { Open, Fulfilled, Cancelled }

    struct Donor {
        string name;
        uint8 age;
        BloodGroup bloodGroup;
        uint256 lastDonationTime;
        uint256 totalDonations;
        bool registered;
    }

    struct Hospital {
        string name;
        bool approved;
    }

    struct BloodRequest {
        uint256 id;
        address hospital;
        BloodGroup bloodGroup;
        uint256 unitsRequired;
        uint256 unitsFulfilled;
        RequestStatus status;
        uint256 createdAt;
    }

    struct DonationRecord {
        uint256 requestId;
        address donor;
        address hospital;
        BloodGroup bloodGroup;
        uint256 timestamp;
    }

    address public immutable admin;
    uint256 public totalDonors;

    mapping(address => Donor) private donors;
    mapping(address => Hospital) private hospitals;
    BloodRequest[] private requests;
    DonationRecord[] private donations;

    event HospitalApproved(address indexed hospital, string name);
    event HospitalRevoked(address indexed hospital);
    event DonorRegistered(address indexed donor, string name, BloodGroup bloodGroup);
    event RequestCreated(uint256 indexed requestId, address indexed hospital, BloodGroup bloodGroup, uint256 units);
    event DonationRecorded(uint256 indexed requestId, address indexed donor, address indexed hospital);

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyApprovedHospital() {
        require(hospitals[msg.sender].approved, "Only approved hospital");
        _;
    }

    function addHospital(address hospitalAddress, string calldata name) external onlyAdmin {
        require(bytes(name).length > 0, "Hospital name required");
        require(!hospitals[hospitalAddress].approved, "Hospital already approved");
        hospitals[hospitalAddress] = Hospital(name, true);
        emit HospitalApproved(hospitalAddress, name);
    }

    function revokeHospital(address hospitalAddress) external onlyAdmin {
        require(hospitals[hospitalAddress].approved, "Hospital not approved");
        hospitals[hospitalAddress].approved = false;
        emit HospitalRevoked(hospitalAddress);
    }

    function registerDonor(string calldata name, uint8 age, uint8 bloodGroup) external {
        require(!donors[msg.sender].registered, "Already registered");
        require(bytes(name).length >= 3 && bytes(name).length <= 80, "Name must be 3-80 chars");
        require(age >= 18 && age <= 65, "Age must be 18-65");
        
        donors[msg.sender] = Donor(name, age, BloodGroup(bloodGroup), 0, 0, true);
        totalDonors++;
        emit DonorRegistered(msg.sender, name, BloodGroup(bloodGroup));
    }

    function createRequest(uint8 bloodGroup, uint256 unitsRequired) external onlyApprovedHospital {
        require(unitsRequired > 0 && unitsRequired <= 20, "Units must be 1-20");
        uint256 id = requests.length;
        
        requests.push(BloodRequest({
            id: id,
            hospital: msg.sender,
            bloodGroup: BloodGroup(bloodGroup),
            unitsRequired: unitsRequired,
            unitsFulfilled: 0,
            status: RequestStatus.Open,
            createdAt: block.timestamp
        }));
        
        emit RequestCreated(id, msg.sender, BloodGroup(bloodGroup), unitsRequired);
    }

    function recordDonation(uint256 requestId, address donor) external onlyApprovedHospital {
        require(requestId < requests.length, "Request does not exist");
        BloodRequest storage request = requests[requestId];
        
        require(request.hospital == msg.sender, "Not your request");
        require(request.status == RequestStatus.Open, "Request not open");
        
        Donor storage donorInfo = donors[donor];
        require(donorInfo.registered, "Donor not registered");
        require(donorInfo.bloodGroup == request.bloodGroup, "Blood group mismatch");
        
        // 90-day cooldown check (90 days = 7776000 seconds)
        require(donorInfo.lastDonationTime == 0 || block.timestamp >= donorInfo.lastDonationTime + 7776000, "Donor not eligible yet");

        donorInfo.lastDonationTime = block.timestamp;
        donorInfo.totalDonations++;
        request.unitsFulfilled++;
        
        donations.push(DonationRecord(requestId, donor, msg.sender, request.bloodGroup, block.timestamp));
        emit DonationRecorded(requestId, donor, msg.sender);

        if (request.unitsFulfilled == request.unitsRequired) {
            request.status = RequestStatus.Fulfilled;
        }
    }

    function getRequestCount() external view returns (uint256) {
        return requests.length;
    }

    function getDonationCount() external view returns (uint256) {
        return donations.length;
    }

    function getRequest(uint256 id) external view returns (BloodRequest memory) {
        require(id < requests.length, "Request does not exist");
        return requests[id];
    }
}