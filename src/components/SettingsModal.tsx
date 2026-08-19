/**
 * @file SettingsModal.tsx
 * @author Jesvin M Mathew
 * @description Advanced Quantitative Settings and Sandbox configuration terminal.
 */
import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Sliders, Monitor, FileText, Key, Mail, RefreshCw, 
  Trash2, LogOut, Check, X, ShieldAlert, Award, Volume2, VolumeX, 
  Sparkles, ToggleLeft, ToggleRight, Loader2, CheckCircle2 
} from 'lucide-react';
import { authSecurityService } from '../services/authSecurityService';
import { TradingService } from '../services/trading';
import { formatINR } from '../utils/formatters';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: any;
  onAuthSuccess?: (user: any) => void;
  onLogout?: () => void;
  onNavigate?: (path: string) => void;
  initialTab?: string;
}

type TabType = 'profile' | 'security' | 'preferences' | 'sandbox' | 'legal';

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  user: passedUser, 
  onAuthSuccess, 
  onLogout, 
  onNavigate, 
  initialTab 
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialTab) {
      if (initialTab === 'general') setActiveTab('profile');
      else if (initialTab === 'security') setActiveTab('security');
      else if (initialTab === 'appearance') setActiveTab('preferences');
      else if (initialTab === 'sandbox') setActiveTab('sandbox');
      else if (initialTab === 'legal') setActiveTab('legal');
    }
  }, [isOpen, initialTab]);

  // Profile data
  const [fullName, setFullName] = useState('');
  const [user, setUser] = useState<{ id: string; email: string; name: string; created_at: string; googleLinked: boolean; identityId?: string } | null>(null);

  // Security variables
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passStrength, setPassStrength] = useState(0);
  const [newEmail, setNewEmail] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Preferences (Alert toggles)
  const [prefPasswordAlert, setPrefPasswordAlert] = useState(true);
  const [prefEmailAlert, setPrefEmailAlert] = useState(true);
  const [prefOauthAlert, setPrefOauthAlert] = useState(true);
  const [prefMfaAlert, setPrefMfaAlert] = useState(true);

  // Sandbox variables
  const [sandboxCapital, setSandboxCapital] = useState<string>('1000000');
  const [sandboxLeverage, setSandboxLeverage] = useState<number>(5);
  const [slippageEnabled, setSlippageEnabled] = useState(true);

  // Workspace UI variables
  const [viewTab, setViewTab] = useState('Dashboard');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState<'high' | 'balanced' | 'performance'>('high');

  useEffect(() => {
    if (!isOpen) return;
    const userStored = localStorage.getItem("supabase_user");
    if (userStored) {
      try {
        const parsed = JSON.parse(userStored);
        const googleIdentity = parsed.identities?.find((i: any) => i.provider === 'google');
        setUser({
          id: parsed.id || 'N/A',
          email: parsed.email || 'N/A',
          name: parsed.user_metadata?.full_name || 'Quantitative Trader',
          created_at: parsed.created_at || new Date().toISOString(),
          googleLinked: !!googleIdentity,
          identityId: googleIdentity?.id
        });
        setFullName(parsed.user_metadata?.full_name || 'Quantitative Trader');
      } catch (_) {}
    }

    setSandboxCapital(TradingService.getCash().toString());
    setSandboxLeverage(TradingService.getLeverage());
  }, [isOpen]);

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleNameSave = async () => {
    if (!fullName.trim()) return;
    setIsLoading(true);
    try {
      await authSecurityService.updateProfileName(fullName.trim());
      showStatus('success', 'Full name updated successfully.');
    } catch (err: any) {
      showStatus('error', err.message || 'Name update failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showStatus('error', 'Password must be at least 6 characters.');
      return;
    }
    setIsLoading(true);
    try {
      await authSecurityService.updatePassword(newPassword);
      showStatus('success', 'Password updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setPassStrength(0);
    } catch (err: any) {
      showStatus('error', err.message || 'Password update failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetEmail = async () => {
    if (!user?.email) return;
    setIsLoading(true);
    try {
      await authSecurityService.sendPasswordReset(user.email);
      showStatus('success', 'Reset link sent to your registered email.');
    } catch (err: any) {
      showStatus('error', err.message || 'Failed to dispatch reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;
    setIsLoading(true);
    try {
      await authSecurityService.updateEmailAddress(newEmail);
      showStatus('success', 'Verification emails dispatched to old and new addresses.');
      setNewEmail('');
    } catch (err: any) {
      showStatus('error', err.message || 'Email update failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLinking = async () => {
    try {
      if (user?.googleLinked && user.identityId) {
        await authSecurityService.unlinkSignInMethod(user.identityId);
        showStatus('success', 'Google authentication account unlinked.');
      } else {
        await authSecurityService.linkSignInMethod('google');
        showStatus('success', 'Redirecting to link Google account...');
      }
    } catch (err: any) {
      showStatus('error', err.message || 'OAuth linking configuration failed.');
    }
  };

  const handleSandboxSave = () => {
    const capital = parseFloat(sandboxCapital);
    if (isNaN(capital) || capital <= 0) {
      showStatus('error', 'Please enter a valid starting capital.');
      return;
    }
    TradingService.setCash(capital);
    TradingService.setLeverage(sandboxLeverage);
    TradingService.setPortfolio([]);
    showStatus('success', 'Sandbox parameters calibrated and open positions reset.');
  };

  const handleWipeSandbox = () => {
    if (confirm("Are you sure you want to delete all transaction ledgers? This action is irreversible.")) {
      TradingService.resetAccount();
      setSandboxCapital(TradingService.getCash().toString());
      setSandboxLeverage(TradingService.getLeverage());
      showStatus('success', 'Demo account cleared & re-seeded.');
    }
  };

  const signOut = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem("supabase_user");
      window.location.reload();
    }
  };

  const checkPassStrength = (val: string) => {
    setNewPassword(val);
    let strength = 0;
    if (val.length >= 6) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;
    setPassStrength(strength);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl h-[620px] bg-slate-950/90 border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden text-white relative font-sans">
        
        {/* Toast Status Banner */}
        {statusMessage && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-xs font-bold border border-white/10 z-[100] shadow-2xl ${
            statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
          }`}>
            {statusMessage.text}
          </div>
        )}

        {/* Close Modal Trigger */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer border-none"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side-Tab Menu */}
        <div className="w-64 border-r border-white/5 bg-white/[0.02] p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-cyan-400 font-mono">Terminal settings</div>
            
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('profile')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'profile' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/25' : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <User className="w-4 h-4" /> Account Profile
              </button>
              
              <button 
                onClick={() => setActiveTab('security')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'security' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/25' : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <Shield className="w-4 h-4" /> Security & Auth
              </button>

              <button 
                onClick={() => setActiveTab('preferences')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'preferences' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/25' : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <Monitor className="w-4 h-4" /> Workspace UI
              </button>
              
              <button 
                onClick={() => setActiveTab('sandbox')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'sandbox' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/25' : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <Sliders className="w-4 h-4" /> Trading Sandbox
              </button>

              <button 
                onClick={() => setActiveTab('legal')} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'legal' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/25' : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <FileText className="w-4 h-4" /> Legal & SEBI Guard
              </button>
            </div>
          </div>

          <button 
            onClick={signOut} 
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer border-none bg-transparent"
          >
            <LogOut className="w-4 h-4" /> Terminate Session
          </button>
        </div>

        {/* Right Content Viewport */}
        <div className="flex-1 p-6 overflow-y-auto bg-slate-900/30 text-left">
          
          {/* Tab 1: Profile & Identity */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Account Profile</h4>
                <p className="text-[11px] text-slate-400">View identities and verify credentials.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Full Name</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg text-xs px-3 py-1.5 text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button 
                      onClick={handleNameSave}
                      disabled={isLoading}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition-all cursor-pointer border-none"
                    >
                      {isLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Registered Email</span>
                    <span className="text-white text-xs">{user?.email}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                    ✓ Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 text-[10px] font-mono">
                  <div>
                    <span className="text-slate-500 block">Supabase Client ID</span>
                    <span className="text-white block select-all truncate">{user?.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Created On</span>
                    <span className="text-white block">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Security & Credentials */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Credentials & Security</h4>
                <p className="text-[11px] text-slate-400">Update credentials, passwords, or link OAuth single sign-in configurations.</p>
              </div>

              <div className="space-y-4">
                {/* Inline Password Change */}
                <form onSubmit={handlePasswordUpdate} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <h5 className="text-xs font-bold flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-cyan-400" /> Update Password</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="password"
                      required
                      placeholder="Current Password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="bg-white/[0.04] border border-white/10 rounded-lg text-xs px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none"
                    />
                    <input
                      type="password"
                      required
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => checkPassStrength(e.target.value)}
                      className="bg-white/[0.04] border border-white/10 rounded-lg text-xs px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {newPassword && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] text-slate-400">
                        <span>Strength Meter</span>
                        <span>
                          {passStrength === 1 && 'Weak'}
                          {passStrength === 2 && 'Fair'}
                          {passStrength === 3 && 'Strong'}
                          {passStrength === 4 && 'Excellent'}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-300 ${
                          passStrength === 1 ? 'w-1/4 bg-rose-500' :
                          passStrength === 2 ? 'w-2/4 bg-amber-500' :
                          passStrength === 3 ? 'w-3/4 bg-cyan-400' :
                          passStrength === 4 ? 'w-full bg-emerald-500' : 'w-0'
                        }`} />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1">
                    <button
                      type="button"
                      onClick={handlePasswordResetEmail}
                      className="text-[10px] text-slate-400 hover:text-white underline bg-transparent border-none cursor-pointer"
                    >
                      Or send password reset recovery email
                    </button>
                    <button 
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition-all cursor-pointer border-none"
                    >
                      Save Password
                    </button>
                  </div>
                </form>

                {/* Email Update */}
                <form onSubmit={handleEmailUpdate} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <h5 className="text-xs font-bold flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-cyan-400" /> Update Email Address</h5>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      placeholder="Enter new email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg text-xs px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none"
                    />
                    <button 
                      type="submit"
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 text-xs font-semibold cursor-pointer transition-all"
                    >
                      Send Verification
                    </button>
                  </div>
                  <p className="text-[9px] text-amber-400">
                    *Note: Verification links will be dispatched to confirm ownership of both your old and new email addresses.
                  </p>
                </form>

                {/* OAuth Linking */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold">Google Authentication</h5>
                    <p className="text-[10px] text-slate-400">
                      {user?.googleLinked ? 'Google account connected to this profile.' : 'Connect Google login for single click auth.'}
                    </p>
                  </div>
                  <button
                    onClick={handleGoogleLinking}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      user?.googleLinked 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                    }`}
                  >
                    {user?.googleLinked ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Workspace & Alerts Preferences */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Workspace UI & Alerts</h4>
                <p className="text-[11px] text-slate-400">Configure theme, sound alerts, and real-time security alerts.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold">Password Changed Alerts</h5>
                    <p className="text-[10px] text-slate-500">Dispatch validation email as soon as credential passwords update.</p>
                  </div>
                  <button onClick={() => setPrefPasswordAlert(!prefPasswordAlert)} className="cursor-pointer border-none bg-transparent">
                    {prefPasswordAlert ? <ToggleRight className="w-9 h-9 text-cyan-400" /> : <ToggleLeft className="w-9 h-9 text-slate-500" />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <h5 className="text-xs font-bold">Email Address Changed Alerts</h5>
                    <p className="text-[10px] text-slate-500">Receive warnings on original email when account addresses change.</p>
                  </div>
                  <button onClick={() => setPrefEmailAlert(!prefEmailAlert)} className="cursor-pointer border-none bg-transparent">
                    {prefEmailAlert ? <ToggleRight className="w-9 h-9 text-cyan-400" /> : <ToggleLeft className="w-9 h-9 text-slate-500" />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <h5 className="text-xs font-bold">OAuth Single Sign-In Alerts</h5>
                    <p className="text-[10px] text-slate-500">Alert triggers on linking or unlinking Google integrations.</p>
                  </div>
                  <button onClick={() => setPrefOauthAlert(!prefOauthAlert)} className="cursor-pointer border-none bg-transparent">
                    {prefOauthAlert ? <ToggleRight className="w-9 h-9 text-cyan-400" /> : <ToggleLeft className="w-9 h-9 text-slate-500" />}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <h5 className="text-xs font-bold">Two-Factor / MFA Alerts</h5>
                    <p className="text-[10px] text-slate-500">Urgent notifications when authenticator codes are activated.</p>
                  </div>
                  <button onClick={() => setPrefMfaAlert(!prefMfaAlert)} className="cursor-pointer border-none bg-transparent">
                    {prefMfaAlert ? <ToggleRight className="w-9 h-9 text-cyan-400" /> : <ToggleLeft className="w-9 h-9 text-slate-500" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Sandbox Trading Controls */}
          {activeTab === 'sandbox' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Simulated Sandbox & Risk</h4>
                <p className="text-[11px] text-slate-400">Configure demo balances and intraday equity multiplier thresholds.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Starting Virtual Capital</label>
                  <select
                    value={sandboxCapital}
                    onChange={(e) => setSandboxCapital(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-lg text-xs text-white p-2.5 cursor-pointer focus:outline-none focus:border-cyan-400"
                  >
                    <option value="100000">₹1,00,000</option>
                    <option value="500000">₹5,00,000</option>
                    <option value="1000000">₹10,00,000</option>
                    <option value="5000000">₹50,00,000</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Default Margin Leverage</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 1, label: "1x Delivery" },
                      { val: 5, label: "5x Intraday" }
                    ].map((lev) => (
                      <button
                        key={lev.val}
                        type="button"
                        onClick={() => setSandboxLeverage(lev.val)}
                        className={`py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                          sandboxLeverage === lev.val
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-white"
                        }`}
                      >
                        {lev.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-rose-400">Wipe Virtual Ledger</h5>
                    <p className="text-[10px] text-slate-500">Remove all trade histories, demo statements, and reset margin balance.</p>
                  </div>
                  <button
                    onClick={handleWipeSandbox}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold cursor-pointer transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5 inline mr-1" /> Wipe sandbox
                  </button>
                </div>

                <button
                  onClick={handleSandboxSave}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider transition-all hover:bg-cyan-400 shadow-md shadow-cyan-500/10 cursor-pointer border-none"
                >
                  Save sandbox parameters
                </button>
              </div>
            </div>
          )}

          {/* Tab 5: Legal & Regulatory Disclaimers */}
          {activeTab === 'legal' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Legal & Regulatory</h4>
                <p className="text-[11px] text-slate-400">Regulatory disclosures and agreements.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="space-y-3">
                  <span className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">Compliance Disclosures</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent("marketverse_open_legal", { detail: "terms" }))}
                      className="py-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold cursor-pointer transition-all"
                    >
                      Terms of Service
                    </button>
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent("marketverse_open_legal", { detail: "privacy" }))}
                      className="py-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold cursor-pointer transition-all"
                    >
                      Privacy Policy
                    </button>
                    <button 
                      onClick={() => window.dispatchEvent(new CustomEvent("marketverse_open_legal", { detail: "sebi" }))}
                      className="py-2.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-xs font-semibold cursor-pointer transition-all"
                    >
                      SEBI Disclosures
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 text-[11px] text-slate-400 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold">
                    <Award className="w-4 h-4" />
                    <span>Signed Agreement Timestamp</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    You accepted that MarketVerse India represents simulated portfolios.
                  </p>
                  <div className="px-3 py-1.5 rounded-lg bg-[#0a0e17] border border-white/10 font-mono text-[9px] text-slate-350">
                    ✓ Accepted on: {new Date(user?.created_at || Date.now()).toUTCString()}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
