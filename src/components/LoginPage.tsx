import React, { useState, useEffect, useRef } from 'react';
import { AuthUser, UserRole } from '../types';
import { authenticateUser } from '../utils/authStorage';
import { TCTLogo } from './TCTLogo';
import { WhatsAppAssistantBot } from './WhatsAppAssistantBot';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  UserCheck, 
  Sparkles, 
  LogIn, 
  AlertCircle,
  KeyRound,
  MessageSquare,
  Smartphone,
  Send,
  RotateCcw,
  CheckCircle2,
  Copy,
  Check,
  LogOut,
  ArrowLeft,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser, remember: boolean) => void;
}

const PERU_ADMIN_PHONE = '990010020';
const PERU_ADMIN_PHONE_FORMATTED = '+51 990 010 020';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  // Login Form States (Default to 'employee' as explicitly requested)
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>('employee');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 2FA Admin Verification States
  const [is2FAStage, setIs2FAStage] = useState<boolean>(false);
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [inputCode, setInputCode] = useState<string>('');
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [countdown, setCountdown] = useState<number>(45);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);
  const [showSimulatedBanner, setShowSimulatedBanner] = useState<boolean>(true);

  // Auto-decrement countdown timer for 2FA resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (is2FAStage && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [is2FAStage, countdown]);

  // Generate a random 6-digit numeric OTP code
  const generateNewOtpCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setInputCode('');
    setCountdown(45);
    setCanResend(false);
    setTwoFaError(null);
    setShowSimulatedBanner(true);
    return code;
  };

  // Handle Tab Switch
  const handleSelectRoleTab = (role: UserRole) => {
    setSelectedRoleTab(role);
    setErrorMessage(null);
  };

  // Step 1: Submit Credentials
  const handleSubmitCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = authenticateUser(username, password);
      setIsLoading(false);

      if (result.success && result.user) {
        if (result.user.role === 'admin') {
          // Admin role REQUIRES 2FA (SMS by default, with WhatsApp fallback to 990010020)
          setPendingUser(result.user);
          setChannel('sms');
          generateNewOtpCode();
          setIs2FAStage(true);
        } else {
          // Employee role logs in directly
          onLoginSuccess(result.user, rememberMe);
        }
      } else {
        setErrorMessage(result.error || 'Credenciales inválidas. Verifique su usuario y contraseña.');
      }
    }, 350);
  };

  // Step 2: Validate 2FA Code
  const handleVerify2FACode = (e: React.FormEvent) => {
    e.preventDefault();
    setTwoFaError(null);

    const cleanInput = inputCode.trim();
    if (cleanInput.length !== 6) {
      setTwoFaError('El código debe contener exactamente 6 dígitos numéricos.');
      return;
    }

    setIsVerifyingCode(true);

    setTimeout(() => {
      setIsVerifyingCode(false);
      if (cleanInput === verificationCode) {
        if (pendingUser) {
          onLoginSuccess(pendingUser, rememberMe);
        }
      } else {
        setTwoFaError('Código de verificación incorrecto o expirado. Verifique el código recibido.');
      }
    }, 400);
  };

  // Switch to WhatsApp Channel
  const handleSwitchToWhatsApp = () => {
    setChannel('whatsapp');
    const newCode = generateNewOtpCode();
    
    // Create WhatsApp direct link
    const message = encodeURIComponent(`Hola TCT, tu código de verificación de Administrador es: ${newCode}`);
    const waUrl = `https://wa.me/51${PERU_ADMIN_PHONE}?text=${message}`;
    
    try {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      console.log('WhatsApp open notice:', e);
    }
  };

  // Resend via current channel (SMS or WhatsApp)
  const handleResendCurrentChannel = () => {
    generateNewOtpCode();
  };

  // Auto-fill OTP Code
  const handleAutoFillCode = () => {
    setInputCode(verificationCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  // Cancel 2FA & go back to login form
  const handleCancel2FA = () => {
    setIs2FAStage(false);
    setPendingUser(null);
    setInputCode('');
    setTwoFaError(null);
  };

  // Exit Applet (Clear form & reload state)
  const handleExitApp = () => {
    if (window.confirm('¿Desea salir del aplicativo Corporación TCT?')) {
      setUsername('');
      setPassword('');
      setIs2FAStage(false);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] flex flex-col justify-between items-center p-4 sm:p-6 lg:p-8 relative overflow-x-hidden text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      
      {/* Background Ambience / Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Bar with Online status & Exit button */}
      <div className="w-full max-w-sm flex items-center justify-between z-20 mb-2">
        <div className="flex items-center space-x-2 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
            TCT Online
          </span>
        </div>

        <button
          type="button"
          id="btn-exit-login-app"
          onClick={handleExitApp}
          className="p-2 rounded-full bg-slate-900/80 hover:bg-red-950/80 text-slate-400 hover:text-red-400 border border-slate-800 transition-all shadow-md group cursor-pointer"
          title="Salir del aplicativo"
          aria-label="Salir"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main Login Card (Matching Screenshot Image 1) */}
      <div className="w-full max-w-sm relative z-10 space-y-5 my-auto">
        
        {/* Title and Slogan (Logo removed as requested) */}
        <div className="text-center space-y-1.5 pt-2">
          <h1 className="text-2xl sm:text-[28px] font-black tracking-wider text-white flex items-center justify-center gap-1.5">
            <span>CORPORACIÓN</span>
            <span className="text-amber-400 italic">TCT</span>
          </h1>
          <p className="text-xs text-amber-400 font-serif italic tracking-wider">
            « Marcando Historia »
          </p>
        </div>

        {/* ========================================================================= */}
        {/* STAGE 1: CREDENTIALS LOGIN FORM */}
        {/* ========================================================================= */}
        {!is2FAStage ? (
          <div className="bg-[#0b111e]/90 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            
            {/* Role Tabs (Empleado selected by default) */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/60 rounded-2xl border border-slate-800/90">
              <button
                type="button"
                id="tab-login-employee"
                onClick={() => handleSelectRoleTab('employee')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  selectedRoleTab === 'employee'
                    ? 'bg-[#00DF8F] text-slate-950 shadow-md ring-1 ring-emerald-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Empleado</span>
              </button>

              <button
                type="button"
                id="tab-login-admin"
                onClick={() => handleSelectRoleTab('admin')}
                className={`py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  selectedRoleTab === 'admin'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-md ring-1 ring-amber-400/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Administrador</span>
              </button>
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-200 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmitCredentials} className="space-y-3.5">
              
              {/* Username Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black italic tracking-widest text-slate-300 uppercase">
                  USUARIO
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="usuario"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-slate-800/90 rounded-2xl text-sm text-white placeholder-slate-500 placeholder:italic focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-transparent transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-black italic tracking-widest text-slate-300 uppercase">
                  CLAVE DE ACCESO
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-10 pr-11 py-2.5 bg-black/60 border border-slate-800/90 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/70 focus:border-transparent transition-all font-medium select-text"
                  />
                  <button
                    type="button"
                    id="btn-toggle-show-password"
                    tabIndex={-1}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowPassword((prev) => !prev);
                    }}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center justify-center text-slate-400 hover:text-amber-400 transition-colors cursor-pointer z-20 focus:outline-none"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? (
                      <Eye className="w-4 h-4 text-amber-400 hover:text-amber-300" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-400 hover:text-slate-200" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm rounded-2xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-4"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Ingresar</span>
                  </>
                )}
              </button>

            </form>
          </div>
        ) : (
          /* ========================================================================= */
          /* STAGE 2: 2FA VERIFICATION CODE (SMS / WHATSAPP PERU 990010020) */
          /* ========================================================================= */
          <div className="bg-[#0b111e]/95 backdrop-blur-xl border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-fadeIn">
            
            {/* Top Bar inside 2FA with Back button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                type="button"
                onClick={handleCancel2FA}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
                Verificación 2FA
              </span>
            </div>

            {/* 2FA Header Information */}
            <div className="text-center space-y-1">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                {channel === 'sms' ? <Smartphone className="w-5 h-5" /> : <MessageSquare className="w-5 h-5 text-emerald-400" />}
              </div>

              <h2 className="text-base font-black text-white">
                Código de Administrador
              </h2>

              <p className="text-xs text-slate-300">
                {channel === 'sms' ? (
                  <>Enviado por <strong>SMS</strong> a Perú:</>
                ) : (
                  <>Enviado por <strong>WhatsApp</strong> a Perú:</>
                )}
              </p>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-black/60 border border-slate-700 text-amber-300 font-mono font-black text-xs">
                <span>🇵🇪 {PERU_ADMIN_PHONE_FORMATTED}</span>
              </div>
            </div>

            {/* Live Incoming Code Bubble */}
            {showSimulatedBanner && (
              <div className="p-3 rounded-2xl bg-black/70 border border-amber-500/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-amber-400 font-bold">
                    Código Generado para 990010020:
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono font-bold">
                    Activo
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-amber-400 font-mono tracking-widest">
                    {verificationCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoFillCode}
                    className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1 transition-all"
                  >
                    {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{codeCopied ? 'Pegado' : 'Auto-rellenar'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={`sms:+51${PERU_ADMIN_PHONE}?body=Codigo%20TCT:%20${verificationCode}`}
                    className="flex-1 py-1 px-2 bg-slate-900 text-amber-300 border border-slate-700 rounded-lg text-[10px] font-bold text-center flex items-center justify-center gap-1"
                  >
                    <Smartphone className="w-3 h-3" />
                    <span>App SMS</span>
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?phone=51${PERU_ADMIN_PHONE}&text=${encodeURIComponent(`Hola TCT, código admin: ${verificationCode}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 rounded-xl text-[10px] font-bold text-center flex items-center justify-center gap-1.5 transition-all"
                  >
                    <img src="/assets/whatsapp-3d.png" alt="WA" referrerPolicy="no-referrer" className="w-3.5 h-3.5 object-contain" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* Error Message Alert in 2FA */}
            {twoFaError && (
              <div className="p-2.5 bg-red-950/80 border border-red-500/50 rounded-xl text-red-200 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{twoFaError}</span>
              </div>
            )}

            {/* 2FA Input Form */}
            <form onSubmit={handleVerify2FACode} className="space-y-3">
              <div>
                <input
                  id="input-2fa-code"
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={inputCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setInputCode(val);
                  }}
                  placeholder="______"
                  className="w-full text-center py-2.5 bg-black/70 border border-slate-700 rounded-2xl text-2xl font-mono font-black text-amber-400 tracking-[0.4em] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                id="btn-verify-2fa-submit"
                disabled={isVerifyingCode || inputCode.length !== 6}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isVerifyingCode ? (
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Confirmar Acceso Admin</span>
                  </>
                )}
              </button>
            </form>

            {/* WhatsApp Fallback Option if SMS doesn't arrive */}
            {channel === 'sms' && (
              <button
                type="button"
                onClick={handleSwitchToWhatsApp}
                className="w-full py-2.5 px-3 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-600/40 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <img src="/assets/whatsapp-3d.png" alt="WA" referrerPolicy="no-referrer" className="w-4 h-4 object-contain" />
                <span>¿No llegó SMS? Enviar a WhatsApp 990010020</span>
              </button>
            )}

            {/* Resend button */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>{countdown > 0 ? `Reenviar en: ${countdown}s` : '¿No llegó?'}</span>
              <button
                type="button"
                disabled={!canResend}
                onClick={handleResendCurrentChannel}
                className="font-bold text-amber-400 hover:text-amber-300 disabled:opacity-40"
              >
                Reenviar código
              </button>
            </div>

          </div>
        )}

        {/* Bottom Institutional Slogan (Exact requested quote, no carousel) */}
        <div className="border border-emerald-500/30 bg-[#06101c]/80 backdrop-blur-md rounded-2xl p-4 text-center shadow-lg">
          <p className="text-xs sm:text-sm font-semibold italic text-slate-200 leading-relaxed font-serif">
            « No grabámos escenas, grabámos recuerdos de durarán generaciones »
          </p>
        </div>

      </div>

      {/* Floating Draggable WhatsApp Bot Button and Assistant Modal */}
      <WhatsAppAssistantBot />

    </div>
  );
};
