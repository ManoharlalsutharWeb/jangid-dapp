import { ethers } from 'ethers';

export const CONTRACT_ADDRESS = "0x047f0C9991f68040DdbFB33E9Bb6188e5EC5DbFf";

export const CONTRACT_ABI = [
  "function registerDomain(string memory _name) external payable",
  "function isAvailable(string memory _name) external view returns (bool)",
  "function resolve(string memory _name) external view returns (address)",
  "function domainOwner(string memory) external view returns (address)",
  "function totalDomains() external view returns (uint256)",
  "function domainPrice() external view returns (uint256)",
  "function setPrice(uint256 _newPrice) external",
  "function withdraw() external",
  "function getTokenDomain(uint256 _tokenId) external view returns (string memory)",
  "event DomainRegistered(string domain, address owner, uint256 tokenId)"
];

export function getContract(signer) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
}

export async function checkAvailability(name) {
  const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  return await contract.isAvailable(name);
}

export async function registerDomain(name, signer) {
  const contract = getContract(signer);
  const price = ethers.parseEther("0.01");
  const tx = await contract.registerDomain(name, { value: price });
  await tx.wait();
  return tx;
}

export async function getUserDomains(address) {
  const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
  const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
  
  const filter = contract.filters.DomainRegistered(null, address);
  const events = await contract.queryFilter(filter, 0, 'latest');
  
  const domains = await Promise.all(
    events.map(async (event) => {
      const name = event.args[0];
      const resolvedAddress = await contract.resolve(name);
      return { name, resolvedAddress };
    })
  );
  
  return domains;
}
