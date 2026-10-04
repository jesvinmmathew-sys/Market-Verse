/**
 * @file SettingsModal.tsx
 * @author Jesvin M Mathew
 * @description Advanced Quantitative Settings and Sandbox configuration terminal.
 */
import React, { useState, useEffect } from 'react';
import { 
  User, Shield, Sliders, Monitor, FileText, Key, Mail, RefreshCw, 
  Trash2, LogOut, Check, X, ShieldAlert, Award, Volume2, VolumeX, 
  Sparkles, ToggleLeft, ToggleRight, Loader2, CheckCircle2, Eye, EyeOff, Camera, Upload
} from 'lucide-react';
import { authSecurityService } from '../services/authSecurityService';
import { TradingService } from '../services/trading';
import { formatINR } from '../utils/formatters';
import { supabase } from '../supabaseClient';

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

const PRESET_AVATARS = [
  { id: 'bull', name: 'Bull Trader', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=60' },
  { id: 'bear', name: 'Bear Hedger', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=120&auto=format&fit=crop&q=60' },
  { id: 'quantum', name: 'Algo Quant', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=120&auto=format&fit=crop&q=60' },
  { id: 'alpha', name: 'Alpha Arbitrage', url: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=120&auto=format&fit=crop&q=60' },
];

  // Profile data
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name: string; created_at: string; googleLinked: boolean; identityId?: string; avatarUrl?: string | null } | null>(null);

  // Security variables
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
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
  const [indianNotation, setIndianNotation] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState<'high' | 'balanced' | 'performance'>('high');

  useEffect(() => {
    if (!isOpen) return;
    const userStored = localStorage.getItem("supabase_user");
    if (userStored) {
      try {
        const parsed = JSON.parse(userStored);
        const googleIdentity = parsed.identities?.find((i: any) => i.provider === 'google');
        const url = parsed.user_metadata?.avatar_url || null;
        setUser({
          id: parsed.id || 'N/A',
          email: parsed.email || 'N/A',
          name: parsed.user_metadata?.full_name || 'Quantitative Trader',
          created_at: parsed.created_at || new Date().toISOString(),
          googleLinked: !!googleIdentity,
          identityId: googleIdentity?.id,
          avatarUrl: url
        });
        setFullName(parsed.user_metadata?.full_name || 'Quantitative Trader');
        setAvatarUrl(url);
      } catch (_) {}
    }

    const soundPref = localStorage.getItem("marketverse_sound_effects");
    if (soundPref !== null) setSoundEnabled(soundPref === "true");

    const glowPref = localStorage.getItem("marketverse_glow_intensity");
    if (glowPref) setGlowIntensity(glowPref as any);

    const viewPref = localStorage.getItem("marketverse_default_view");
    if (viewPref) setViewTab(viewPref);

    const notationPref = localStorage.getItem("marketverse_indian_notation");
    if (notationPref !== null) setIndianNotation(notationPref === "true");

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
      
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        localStorage.setItem("supabase_user", JSON.stringify(updatedUser));
        if (onAuthSuccess) {
          onAuthSuccess(updatedUser);
        }
      }
      
      showStatus('success', 'Full name updated successfully.');
    } catch (err: any) {
      showStatus('error', err.message || 'Name update failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    if (!fullName) return "TR";
    return fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  const handleAvatarSelect = async (url: string | null) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: url }
      });
      if (error) throw error;
      setAvatarUrl(url);
      
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      if (updatedUser) {
        localStorage.setItem("supabase_user", JSON.stringify(updatedUser));
        if (onAuthSuccess) {
          onAuthSuccess(updatedUser);
        }
      }
      
      showStatus('success', url ? 'Profile picture updated successfully.' : 'Profile picture removed.');
    } catch (err: any) {
      showStatus('error', err.message || 'Avatar update failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64String = event.target?.result as string;
        if (!base64String) {
          showStatus('error', 'Could not parse file.');
          setIsLoading(false);
          return;
        }
        
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          try {
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            await handleAvatarSelect(compressedBase64);
          } catch (err: any) {
            showStatus('error', err.message || 'Image processing failed.');
          } finally {
            setIsLoading(false);
          }
        };
        img.onerror = () => {
          showStatus('error', 'Invalid image file.');
          setIsLoading(false);
        };
        img.src = base64String;
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showStatus('error', err.message || 'Image upload failed.');
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

  const handleSaveWorkspacePref = () => {
    localStorage.setItem("marketverse_sound_effects", soundEnabled.toString());
    localStorage.setItem("marketverse_glow_intensity", glowIntensity);
    localStorage.setItem("marketverse_default_view", viewTab);
    localStorage.setItem("marketverse_indian_notation", indianNotation.toString());
    showStatus('success', 'Workspace configuration saved successfully.');
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
        <div className="flex-1 p-6 overflow-y-auto bg-slate-900/30 text-left relative">
          
          {/* Dedicated Status message banner in normal flow */}
          {statusMessage && (
            <div className={`mb-4 px-4 py-2.5 rounded-xl text-xs font-bold border ${
              statusMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' : 'bg-rose-500/10 border-rose-500/25 text-rose-400'
            }`}>
              {statusMessage.text}
            </div>
          )}
          {/* Tab 1: Profile & Identity */}
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Account Profile</h4>
                <p className="text-[11px] text-slate-400">View identities, verify credentials, and customize your trading avatar.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                {/* 1. Interactive Avatar Customizer */}
                <div className="flex flex-col sm:flex-row items-center gap-5 pb-4 border-b border-white/5">
                  <div className="relative group w-20 h-20 shrink-0">
                    <div className="w-20 h-20 rounded-full border-2 border-cyan-400/40 ring-4 ring-cyan-500/10 overflow-hidden bg-slate-900 flex items-center justify-center shadow-lg relative">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xl font-mono">
                          {getInitials()}
                        </div>
                      )}
                    </div>
                    {/* Hover Camera icon badge */}
                    <label 
                      htmlFor="custom-avatar-file-input"
                      className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-200"
                    >
                      <Camera className="w-5 h-5 text-white" />
                    </label>
                    <input
                      type="file"
                      id="custom-avatar-file-input"
                      accept="image/*"
                      onChange={handleCustomAvatarUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Configure Avatar</span>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      {PRESET_AVATARS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleAvatarSelect(preset.url)}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 cursor-pointer transition-all ${
                            avatarUrl === preset.url ? 'border-cyan-400 scale-105' : 'border-white/10 hover:border-white/20'
                          }`}
                          title={preset.name}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                      
                      <label
                        htmlFor="custom-avatar-file-input"
                        className="w-9 h-9 rounded-full border-2 border-dashed border-white/20 hover:border-cyan-400/40 flex items-center justify-center text-slate-400 hover:text-cyan-400 cursor-pointer transition-colors bg-white/[0.01]"
                        title="Upload Custom Image"
                      >
                        <Upload className="w-4 h-4" />
                      </label>

                      {avatarUrl && (
                        <button
                          type="button"
                          onClick={() => handleAvatarSelect(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10.5px] font-semibold text-rose-400 border border-white/5 cursor-pointer ml-1"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

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

                <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Account Clearance Level</span>
                    <span className="text-cyan-400 text-xs font-bold font-mono tracking-wide">LEVEL 4 QUANT TRADER</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[9px] font-bold font-mono tracking-widest uppercase">
                    Institutional Member
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Security & Credentials */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Credentials & Security</h4>
                <p className="text-[11px] text-slate-400">Update passwords, update email addresses, and manage single sign-in linked accounts.</p>
              </div>

              <div className="space-y-4">
                {/* Inline Password Change */}
                <form onSubmit={handlePasswordUpdate} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <h5 className="text-xs font-bold flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-cyan-400" /> Update Password</h5>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        required
                        placeholder="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg text-xs pl-3 pr-10 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
                      >
                        {showCurrentPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        required
                        placeholder="New Password"
                        value={newPassword}
                        onChange={(e) => checkPassStrength(e.target.value)}
                        className="w-full bg-white/[0.04] border border-white/10 rounded-lg text-xs pl-3 pr-10 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/40"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer bg-transparent border-none p-0 flex items-center justify-center"
                      >
                        {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
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

                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-black text-xs font-bold hover:bg-cyan-400 transition-all cursor-pointer border-none"
                    >
                      Save Password
                    </button>
                  </div>
                </form>

                {/* Standalone Reset Password Card */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-cyan-400" /> Send Password Reset Email</h5>
                    <p className="text-[10px] text-slate-400">Dispatch a password recovery reset link to your email inbox.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handlePasswordResetEmail}
                    className="px-3.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold cursor-pointer transition-all"
                  >
                    Dispatch Reset Link
                  </button>
                </div>

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
                  <p className="text-[9px] text-amber-400 leading-normal">
                    *Note: Verification links will be dispatched to confirm ownership of both your old and new email addresses.
                  </p>
                </form>

                {/* Google OAuth Connection Card */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                      </svg>
                      Google SSO Integration
                    </h5>
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${user?.googleLinked ? 'bg-emerald-400' : 'bg-rose-455'}`} />
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                        {user?.googleLinked ? 'CONNECTED' : 'DISCONNECTED'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleGoogleLinking}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                      user?.googleLinked 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' 
                        : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20'
                    }`}
                  >
                    {user?.googleLinked ? 'Disconnect Account' : 'Connect Account'}
                  </button>
                </div>

                {/* Transnational email notification preferences moved here */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <h5 className="text-xs font-bold flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-cyan-400" /> Security Audit Alerts</h5>
                  <p className="text-[10px] text-slate-400 mb-2">Toggle automated transactional email audit alerts.</p>
                  
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span>Password Changed Alerts</span>
                      <button type="button" onClick={() => setPrefPasswordAlert(!prefPasswordAlert)} className="cursor-pointer border-none bg-transparent">
                        {prefPasswordAlert ? <ToggleRight className="w-8 h-8 text-cyan-400" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                      <span>Email Address Changed Alerts</span>
                      <button type="button" onClick={() => setPrefEmailAlert(!prefEmailAlert)} className="cursor-pointer border-none bg-transparent">
                        {prefEmailAlert ? <ToggleRight className="w-8 h-8 text-cyan-400" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                      <span>OAuth Integration Linked/Removed Alerts</span>
                      <button type="button" onClick={() => setPrefOauthAlert(!prefOauthAlert)} className="cursor-pointer border-none bg-transparent">
                        {prefOauthAlert ? <ToggleRight className="w-8 h-8 text-cyan-400" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                      <span>Two-Factor / MFA Status Alerts</span>
                      <button type="button" onClick={() => setPrefMfaAlert(!prefMfaAlert)} className="cursor-pointer border-none bg-transparent">
                        {prefMfaAlert ? <ToggleRight className="w-8 h-8 text-cyan-400" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 3: Workspace UI Customization (Only layout/workspace preferences) */}
          {activeTab === 'preferences' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Workspace UI</h4>
                <p className="text-[11px] text-slate-400">Configure sound effects, layout views, glass blur intensity, and notation settings.</p>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4">
                {/* Default Terminal View */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Default Terminal View</label>
                  <select
                    value={viewTab}
                    onChange={(e) => setViewTab(e.target.value)}
                    className="w-full bg-slate-900/60 border border-white/10 rounded-lg text-xs text-white p-2.5 cursor-pointer focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Dashboard">Trading Terminal Dashboard</option>
                    <option value="Market Radar">Market Radar Screener</option>
                    <option value="Options Analytics">Options Analytics & Option Chain</option>
                    <option value="Quantitative Copilot">Quantitative Copilot chat</option>
                  </select>
                </div>

                {/* Sound FX Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <div>
                    <h5 className="text-xs font-bold flex items-center gap-1.5">
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
                      Sound FX & Alerts
                    </h5>
                    <p className="text-[10px] text-slate-400 font-sans">Toggle audio chimes for order execution, updates, and trade triggers.</p>
                  </div>
                  <button onClick={() => setSoundEnabled(!soundEnabled)} className="cursor-pointer border-none bg-transparent">
                    {soundEnabled ? <ToggleRight className="w-8 h-8 text-cyan-400" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}
                  </button>
                </div>

                {/* Indian Notation Format Toggle */}
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <div>
                    <h5 className="text-xs font-bold">Indian Notation Format</h5>
                    <p className="text-[10px] text-slate-400 font-sans">Display simulated currency and balances in standard Lakhs / Crores (₹) representation.</p>
                  </div>
                  <button onClick={() => setIndianNotation(!indianNotation)} className="cursor-pointer border-none bg-transparent">
                    {indianNotation ? <ToggleRight className="w-8 h-8 text-cyan-400" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}
                  </button>
                </div>

                {/* Theme Glass Intensity */}
                <div className="space-y-2 pt-3 border-t border-white/5">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">Theme Glass Intensity & Blur</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'high', label: "High Glass Blur" },
                      { id: 'balanced', label: "Balanced Glow" },
                      { id: 'performance', label: "Performance Mode" }
                    ].map((level) => (
                      <button
                        key={level.id}
                        type="button"
                        onClick={() => setGlowIntensity(level.id as any)}
                        className={`py-2 rounded-lg text-[10.5px] font-semibold border cursor-pointer transition-all ${
                          glowIntensity === level.id
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] text-white"
                        }`}
                      >
                        {level.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save button */}
                <button
                  type="button"
                  onClick={handleSaveWorkspacePref}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 text-black text-xs font-bold uppercase tracking-wider transition-all hover:bg-cyan-400 cursor-pointer border-none"
                >
                  Save Workspace preferences
                </button>

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
                  <span className="text-[9.5px] uppercase font-bold text-slate-500 tracking-wider">Legal Disclosures</span>
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
