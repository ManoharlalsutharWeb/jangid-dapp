import { ethers } from 'ethers';

export const CONTRACT_ADDRESS: string;
export const CONTRACT_ABI: string[];
export function getContract(signer: ethers.Signer): ethers.Contract;
export function checkAvailability(name: string): Promise<boolean>;
export function registerDomain(name: string, signer: ethers.Signer): Promise<ethers.ContractTransactionResponse>;
export function getUserDomains(address: string): Promise<Array<{ name: string; resolvedAddress: string }>>;
