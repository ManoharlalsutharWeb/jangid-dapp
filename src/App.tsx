import { useState, useEffect, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useWalletClient, useChainId, useSwitchChain } from 'wagmi';
import { ethers } from 'ethers';
import { Globe, Search, Copy, CheckCircle, XCircle, Loader2, AlertTriangle, ExternalLink, Zap, Shield, Layers } from 'lucide-react';
import { checkAvailability, registerDomain, getUserDomains } from './contract.js';

const SEPOLIA_CHAIN_ID = 11155111;

type DomainEntry = {
  name: string;
  resolvedAddress: string;
};

type SearchState = 'idle' | 'searching' | 'available' | 'taken' | 'error';
type RegisterState = 'idle' | 'processing' | 'success' | 'error';

export default function App() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();

  const [searchInput, setSearchInput] = useState('');
  const [searchedName, setSearchedName] = useState('');
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [registerState, setRegisterState] = useState<RegisterState>('idle');
  const [registerError, setRegisterError] = useState('');
  const [myDomains, setMyDomains] = useState<DomainEntry[]>([]);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState('');

  const isWrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID;

  const fetchMyDomains = useCallback(async () => {
    if (!address) return;
    setLoadingDomains(true);
    try {
      const domains = await getUserDomains(address);
      setMyDomains(domains);
    } catch {
      // silent fail
    } finally {
      setLoadingDomains(false);
    }
  }, [address]);

  useEffect(() => {
    if (isConnected && address && !isWrongNetwork) {
      fetchMyDomains();
    }
  }, [isConnected, address, isWrongNetwork, fetchMyDomains]);

  async function handleSearch() {
    const name = searchInput.trim().toLowerCase();
    if (!name) return;
    setSearchedName(name);
    setSearchState('searching');
    setRegisterState('idle');
    setRegisterError('');
    setRegisterSuccess('');
    try {
      const available = await checkAvailability(name);
      setSearchState(available ? 'available' : 'taken');
    } catch {
      setSearchState('error');
    }
  }

  async function handleRegister() {
    if (!isConnected) return;
    if (isWrongNetwork) {
      switchChain({ chainId: SEPOLIA_CHAIN_ID });
      return;
    }
    if (!walletClient) return;
    setRegisterState('processing');
    setRegisterError('');
    try {
      const provider = new ethers.BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      await registerDomain(searchedName, signer);
      setRegisterState('success');
      setRegisterSuccess(`${searchedName}.jangid successfully register ho gaya!`);
      setSearchState('taken');
      fetchMyDomains();
    } catch (err: any) {
      setRegisterState('error');
      const msg = err?.message || '';
      if (msg.includes('user rejected') || msg.includes('User denied')) {
        setRegisterError('Transaction cancel kar di gayi.');
      } else if (msg.includes('insufficient funds')) {
        setRegisterError('Insufficient ETH balance. 0.01 ETH chahiye.');
      } else {
        setRegisterError('Transaction fail ho gayi. Dobara try karo.');
      }
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedAddress(text);
    setTimeout(() => setCopiedAddress(null), 2000);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch();
  }

  return (
    <div className="min-h-screen cyber-grid" style={{ background: '#0a0a1a' }}>
      {/* Ambient glow orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)' }} />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-white/10 backdrop-blur-md"
        style={{ background: 'rgba(10,10,26,0.8)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #06b6d4)' }}>
                <Globe size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Jangid <span className="text-gradient">Domains</span>
              </span>
            </div>
            <ConnectButton />
          </div>
        </div>
      </nav>

      {/* Wrong network banner */}
      {isWrongNetwork && (
        <div className="relative z-40 px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium"
          style={{ background: 'rgba(220,38,38,0.15)', borderBottom: '1px solid rgba(220,38,38,0.3)' }}>
          <AlertTriangle size={16} className="text-red-400" />
          <span className="text-red-300">Wrong network! Sirf Sepolia Testnet supported hai.</span>
          <button
            onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
            className="px-3 py-1 rounded-lg text-white text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: '#dc2626' }}>
            Switch to Sepolia
          </button>
        </div>
      )}

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

        {/* Hero Section */}
        <section className="text-center pt-20 pb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-medium"
            style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
            <Zap size={14} />
            Sepolia Testnet pe Live
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-5 leading-tight">
            Apna Web3{' '}
            <span className="text-gradient">Domain</span>
            {' '}Lo
          </h1>
          <p className="text-xl sm:text-2xl mb-12 max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
            Blockchain pe apni digital identity — permanent, decentralized, yours.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-0 rounded-full p-2 shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="apna naam likho..."
                className="flex-1 bg-transparent outline-none text-white placeholder-gray-500 text-lg px-4 min-w-0"
              />
              <span className="px-3 py-2 rounded-full text-sm font-bold shrink-0"
                style={{
                  background: 'rgba(124,58,237,0.2)',
                  border: '1px solid rgba(124,58,237,0.4)',
                  color: '#a78bfa',
                }}>
                .jangid
              </span>
              <button
                onClick={handleSearch}
                disabled={!searchInput.trim() || searchState === 'searching'}
                className="ml-2 px-5 py-2.5 rounded-full font-semibold text-white flex items-center gap-2 shrink-0 glow-btn disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              >
                {searchState === 'searching' ? (
                  <><Loader2 size={16} className="animate-spin" /> Searching...</>
                ) : (
                  <><Search size={16} /> Search</>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Search Result */}
        {(searchState === 'available' || searchState === 'taken' || searchState === 'error') && (
          <section className="max-w-2xl mx-auto mb-12">
            {searchState === 'available' && (
              <div className="glass-card p-6 transition-all duration-300"
                style={{ borderColor: 'rgba(5,150,105,0.4)', boxShadow: '0 0 30px rgba(5,150,105,0.1)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle size={24} style={{ color: '#059669' }} />
                  <div>
                    <p className="font-bold text-lg text-white">
                      <span style={{ color: '#34d399' }}>{searchedName}.jangid</span> available hai!
                    </p>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>Abhi register karo — 0.01 ETH</p>
                  </div>
                </div>

                {registerState === 'success' && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                    style={{ background: 'rgba(5,150,105,0.15)', border: '1px solid rgba(5,150,105,0.3)', color: '#34d399' }}>
                    <CheckCircle size={16} /> {registerSuccess}
                  </div>
                )}

                {registerState === 'error' && (
                  <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
                    style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#f87171' }}>
                    <XCircle size={16} /> {registerError}
                  </div>
                )}

                {!isConnected ? (
                  <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-xl"
                    style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
                    <AlertTriangle size={16} />
                    Register karne ke liye pehle wallet connect karo.
                  </div>
                ) : isWrongNetwork ? (
                  <button
                    onClick={() => switchChain({ chainId: SEPOLIA_CHAIN_ID })}
                    className="w-full py-3 rounded-xl font-semibold text-white transition-all"
                    style={{ background: '#dc2626' }}>
                    Switch to Sepolia Network
                  </button>
                ) : (
                  <button
                    onClick={handleRegister}
                    disabled={registerState === 'processing' || registerState === 'success'}
                    className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 glow-btn disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                  >
                    {registerState === 'processing' ? (
                      <><Loader2 size={18} className="animate-spin" /> Processing transaction...</>
                    ) : registerState === 'success' ? (
                      <><CheckCircle size={18} /> Registered!</>
                    ) : (
                      <>Register Karo — 0.01 ETH</>
                    )}
                  </button>
                )}
              </div>
            )}

            {searchState === 'taken' && (
              <div className="glass-card p-6"
                style={{ borderColor: 'rgba(220,38,38,0.3)', boxShadow: '0 0 20px rgba(220,38,38,0.08)' }}>
                <div className="flex items-center gap-3">
                  <XCircle size={24} style={{ color: '#dc2626' }} />
                  <div>
                    <p className="font-bold text-lg text-white">
                      <span style={{ color: '#f87171' }}>{searchedName}.jangid</span> le liya gaya hai!
                    </p>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>Koi aur naam try karo.</p>
                  </div>
                </div>
              </div>
            )}

            {searchState === 'error' && (
              <div className="glass-card p-6"
                style={{ borderColor: 'rgba(220,38,38,0.3)' }}>
                <div className="flex items-center gap-3">
                  <AlertTriangle size={24} style={{ color: '#f59e0b' }} />
                  <div>
                    <p className="font-bold text-white">Search fail ho gayi</p>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>Network error. Dobara try karo.</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* My Domains Section */}
        {isConnected && !isWrongNetwork && (
          <section className="mt-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layers size={22} style={{ color: '#7c3aed' }} />
                Mere Domains
              </h2>
              <button
                onClick={fetchMyDomains}
                disabled={loadingDomains}
                className="text-sm flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                style={{ color: '#a78bfa', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
                {loadingDomains
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Search size={14} />}
                Refresh
              </button>
            </div>

            {loadingDomains ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin" style={{ color: '#7c3aed' }} />
                  <p style={{ color: '#94a3b8' }}>Domains load ho rahe hain...</p>
                </div>
              </div>
            ) : myDomains.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Globe size={48} className="mx-auto mb-4 opacity-30" style={{ color: '#7c3aed' }} />
                <p className="text-lg font-semibold text-white mb-2">Koi domain nahi mila</p>
                <p style={{ color: '#94a3b8' }}>Upar search karke apna pehla .jangid domain register karo!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myDomains.map((domain, i) => (
                  <DomainCard
                    key={i}
                    domain={domain}
                    copiedAddress={copiedAddress}
                    onCopy={copyToClipboard}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Features Section */}
        {!isConnected && (
          <section className="mt-16">
            <h2 className="text-center text-2xl font-bold text-white mb-8">Kyun lena chahiye .jangid domain?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: Shield,
                  title: 'Permanent Ownership',
                  desc: 'Blockchain pe store — koi delete nahi kar sakta. Tera domain hamesha tera.',
                  color: '#7c3aed',
                },
                {
                  icon: Globe,
                  title: 'Web3 Identity',
                  desc: 'Long wallet addresses ki jagah simple naam use karo transactions mein.',
                  color: '#06b6d4',
                },
                {
                  icon: Zap,
                  title: 'Instant Register',
                  desc: 'Sirf 0.01 ETH mein Sepolia testnet pe apna domain register karo — minutes mein!',
                  color: '#059669',
                },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div key={title} className="glass-card p-6 group cursor-default">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110"
                    style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                    <Icon size={22} style={{ color }} />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#94a3b8' }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats Row */}
        <section className="mt-16 grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'TLD', value: '.jangid' },
            { label: 'Domain Price', value: '0.01 ETH' },
            { label: 'Network', value: 'Sepolia' },
          ].map(({ label, value }) => (
            <div key={label} className="glass-card py-5 px-4">
              <p className="text-xl sm:text-2xl font-extrabold text-gradient mb-1">{value}</p>
              <p className="text-xs sm:text-sm" style={{ color: '#94a3b8' }}>{label}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t mt-8 py-8 text-center text-sm"
        style={{ borderColor: 'rgba(255,255,255,0.08)', color: '#64748b' }}>
        <div className="flex items-center justify-center gap-2 mb-2">
          <Globe size={14} style={{ color: '#7c3aed' }} />
          <span>Jangid Domains — Sepolia Testnet</span>
        </div>
        <a
          href={`https://sepolia.etherscan.io/address/0x047f0C9991f68040DdbFB33E9Bb6188e5EC5DbFf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
          style={{ color: '#7c3aed' }}>
          Contract dekhno Etherscan pe <ExternalLink size={12} />
        </a>
      </footer>
    </div>
  );
}

function DomainCard({
  domain,
  copiedAddress,
  onCopy,
}: {
  domain: DomainEntry;
  copiedAddress: string | null;
  onCopy: (addr: string) => void;
}) {
  const isCopied = copiedAddress === domain.resolvedAddress;
  const shortAddr = domain.resolvedAddress
    ? `${domain.resolvedAddress.slice(0, 6)}...${domain.resolvedAddress.slice(-4)}`
    : '—';

  return (
    <div className="glass-card p-5 flex flex-col gap-4 transition-all duration-300 hover:border-glow-purple group">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-white text-lg break-all">{domain.name}<span style={{ color: '#a78bfa' }}>.jangid</span></p>
          <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>Registered Domain</p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <Globe size={16} style={{ color: '#a78bfa' }} />
        </div>
      </div>

      <div className="rounded-xl p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
        <p className="text-xs mb-1" style={{ color: '#94a3b8' }}>Resolved Address</p>
        <p className="text-sm font-mono text-white break-all">{shortAddr}</p>
      </div>

      <button
        onClick={() => onCopy(domain.resolvedAddress)}
        className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:opacity-80 active:scale-95"
        style={{
          background: isCopied ? 'rgba(5,150,105,0.2)' : 'rgba(124,58,237,0.15)',
          border: `1px solid ${isCopied ? 'rgba(5,150,105,0.4)' : 'rgba(124,58,237,0.3)'}`,
          color: isCopied ? '#34d399' : '#a78bfa',
        }}>
        {isCopied ? (
          <><CheckCircle size={15} /> Copied!</>
        ) : (
          <><Copy size={15} /> Copy Address</>
        )}
      </button>
    </div>
  );
}
