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
  initialLogoutNotice?: {
    type: 'concurrent_login' | 'inactivity' | 'admin_forced' | 'user_blocked' | 'normal';
    message: string;
  } | null;
  onClearNotice?: () => void;
}

const PERU_ADMIN_PHONE = '990010020';
const PERU_ADMIN_PHONE_FORMATTED = '+51 990 010 020';

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess,
  initialLogoutNotice,
  onClearNotice 
}) => {
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
  const [activeChannel, setActiveChannel] = useState<'telegram' | 'whatsapp' | 'sms'>('telegram');
  const [countdown, setCountdown] = useState<number>(45);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [twoFaError, setTwoFaError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState<boolean>(false);
  const [dispatchStatusMessage, setDispatchStatusMessage] = useState<string | null>(null);

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

  // Direct channel dispatcher helpers for Peru 990010020
  const triggerSendChannel = (ch: 'telegram' | 'whatsapp' | 'sms', codeToSend: string) => {
    setActiveChannel(ch);
    const msgText = `🔒 Código de Seguridad TCT: ${codeToSend}\nPara acceso de Administrador a Corporación TCT (Perú +51 990010020).`;
    
    if (ch === 'telegram') {
      const tgUrl = `https://t.me/share/url?url=https%3A%2F%2Fcorporaciontct.pe&text=${encodeURIComponent(msgText)}`;
      window.open(tgUrl, '_blank', 'noopener,noreferrer');
      setDispatchStatusMessage('✓ Código listo para enviar por Telegram a Perú (+51 990010020).');
    } else if (ch === 'whatsapp') {
      const waUrl = `https://api.whatsapp.com/send?phone=51990010020&text=${encodeURIComponent(msgText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      setDispatchStatusMessage('✓ Código listo para enviar por WhatsApp a Perú (+51 990010020).');
    } else if (ch === 'sms') {
      const smsUrl = `sms:+51990010020?body=${encodeURIComponent(`Codigo TCT: ${codeToSend}`)}`;
      window.location.href = smsUrl;
      setDispatchStatusMessage('✓ Solicitud de SMS enviada a Perú (+51 990010020).');
    }

    setTimeout(() => {
      setDispatchStatusMessage(null);
    }, 4500);
  };

  // Generate a random 6-digit numeric OTP code and dispatch internally
  const generateNewOtpCode = (autoOpenChannel?: 'telegram' | 'whatsapp' | 'sms') => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setInputCode('');
    setCountdown(45);
    setCanResend(false);
    setTwoFaError(null);

    // Dispatch internally to Peru phone 990010020
    try {
      window.dispatchEvent(new CustomEvent('tct_admin_otp_dispatched', {
        detail: { phone: PERU_ADMIN_PHONE, code, timestamp: Date.now() }
      }));
      console.log(`[TCT Security] Código OTP ${code} generado para Perú +51 ${PERU_ADMIN_PHONE}`);
    } catch (err) {
      console.error('Error dispatching OTP internally:', err);
    }

    if (autoOpenChannel) {
      triggerSendChannel(autoOpenChannel, code);
    }

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
          // Admin role REQUIRES 2FA (Sent internally to 990010020)
          setPendingUser(result.user);
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

  // Copy code to clipboard
  const handleCopyCode = () => {
    if (!verificationCode) return;
    navigator.clipboard.writeText(verificationCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  // Instant 1-click autofill & authenticate
  const handleQuickAutofillAndLogin = () => {
    if (!verificationCode || !pendingUser) return;
    setInputCode(verificationCode);
    setIsVerifyingCode(true);
    setTimeout(() => {
      setIsVerifyingCode(false);
      onLoginSuccess(pendingUser, rememberMe);
    }, 250);
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
        setTwoFaError('Código de verificación incorrecto. Verifique el número e intente nuevamente.');
      }
    }, 400);
  };

  // Resend code internally and to channel
  const handleResendCurrentChannel = () => {
    if (!canResend) return;
    generateNewOtpCode(activeChannel);
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
        
        {/* TCT Official Circular Emblem Logo (Matching User Uploaded 4 TCT REDONDO.png) */}
        <div className="text-center space-y-2">
          <div className="relative inline-flex items-center justify-center">
            {/* Ambient golden halo */}
            <div className="absolute -inset-2 bg-amber-500/20 rounded-full blur-xl pointer-events-none" />
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden relative z-10 bg-slate-950 flex items-center justify-center border-2 border-amber-400/40 shadow-[0_10px_25px_rgba(0,0,0,0.85)] transition-transform duration-300 hover:scale-105">
              <img
                src="/assets/tct-logo.png"
                alt="Corporación TCT Logo Redondo Oficial"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover select-none"
              />
            </div>
          </div>

          {/* Title and Slogan */}
          <div className="pt-1">
            <h1 className="text-2xl sm:text-[26px] font-black tracking-wider text-white flex items-center justify-center gap-1.5">
              <span>CORPORACIÓN</span>
              <span className="text-amber-400 italic">TCT</span>
            </h1>
            <p className="text-xs text-amber-400 font-serif italic tracking-wider mt-0.5">
              « Marcando Historia »
            </p>
          </div>
        </div>

        {/* Logout / Inactivity / Concurrency Notice Banner */}
        {initialLogoutNotice && (
          <div className={`p-4 rounded-2xl border shadow-xl flex items-start justify-between gap-3 animate-fade-in ${
            initialLogoutNotice.type === 'concurrent_login'
              ? 'bg-amber-950/90 border-amber-500/80 text-amber-200'
              : initialLogoutNotice.type === 'inactivity'
              ? 'bg-blue-950/90 border-blue-500/80 text-blue-200'
              : initialLogoutNotice.type === 'user_blocked'
              ? 'bg-red-950/90 border-red-500/80 text-red-200'
              : 'bg-slate-900/90 border-slate-700 text-slate-200'
          }`}>
            <div className="flex items-start space-x-2.5 min-w-0">
              <div className="p-1.5 rounded-lg bg-black/40 border border-white/10 shrink-0 mt-0.5">
                {initialLogoutNotice.type === 'concurrent_login' ? (
                  <Smartphone className="w-4 h-4 text-amber-400 animate-pulse" />
                ) : initialLogoutNotice.type === 'inactivity' ? (
                  <RotateCcw className="w-4 h-4 text-blue-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider block opacity-90">
                  {initialLogoutNotice.type === 'concurrent_login'
                    ? '⚠️ Sesión en otro dispositivo'
                    : initialLogoutNotice.type === 'inactivity'
                    ? '⏱️ Cierre por inactividad / desuso'
                    : initialLogoutNotice.type === 'user_blocked'
                    ? '🚫 Acceso bloqueado'
                    : '🔒 Aviso de sesión'}
                </span>
                <p className="text-xs font-semibold leading-tight">
                  {initialLogoutNotice.message}
                </p>
              </div>
            </div>
            {onClearNotice && (
              <button
                type="button"
                onClick={onClearNotice}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                title="Cerrar aviso"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

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
          /* STAGE 2: 2FA VERIFICATION CODE (CON TELEGRAM, WHATSAPP, SMS & AUTOCOMPLETADO) */
          /* ========================================================================= */
          <div className="bg-[#0b111e]/95 backdrop-blur-xl border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 animate-fadeIn">
            
            {/* Top Bar inside 2FA with Back button */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <button
                type="button"
                onClick={handleCancel2FA}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Login</span>
              </button>

              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
                Verificación Admin 2FA
              </span>
            </div>

            {/* 2FA Header Information */}
            <div className="text-center space-y-1">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto shadow-md">
                <ShieldCheck className="w-5 h-5" />
              </div>

              <h2 className="text-base font-black text-white">
                Código de Seguridad TCT
              </h2>

              <p className="text-xs text-slate-300">
                Destinado al Administrador: <strong className="text-amber-300">Perú (+51) 990010020</strong>
              </p>
            </div>

            {/* Dispatch Status Feedback Banner */}
            {dispatchStatusMessage && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-semibold">{dispatchStatusMessage}</span>
              </div>
            )}

            {/* Error Message Alert in 2FA */}
            {twoFaError && (
              <div className="p-3 bg-red-950/80 border border-red-500/50 rounded-2xl text-red-200 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{twoFaError}</span>
              </div>
            )}

            {/* Security Code Showcase Card with 1-Click Action */}
            <div className="bg-gradient-to-br from-amber-500/15 via-slate-900 to-black p-3.5 rounded-2xl border border-amber-500/30 text-center space-y-2">
              <div className="text-[11px] uppercase font-bold tracking-wider text-amber-300/80">
                Tu Código de Acceso Generado:
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl sm:text-3xl font-mono font-black text-amber-400 tracking-[0.25em] bg-black/60 px-4 py-1.5 rounded-xl border border-amber-400/40 shadow-inner">
                  {verificationCode}
                </span>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/30 transition-all cursor-pointer"
                  title="Copiar código"
                >
                  {codeCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* 1-Click Instant Complete & Login Button */}
              <button
                type="button"
                id="btn-quick-autofill-login"
                onClick={handleQuickAutofillAndLogin}
                className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>⚡ Autocompletar e Ingresar de Inmediato</span>
              </button>
            </div>

            {/* Direct Channel Dispatch Action Buttons */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                Enviar directo a tu celular (Perú 990010020):
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {/* Telegram */}
                <button
                  type="button"
                  id="btn-send-telegram"
                  onClick={() => triggerSendChannel('telegram', verificationCode)}
                  className="py-2 px-2 bg-sky-950/80 hover:bg-sky-900 border border-sky-500/50 hover:border-sky-400 text-sky-200 rounded-xl text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                  title="Enviar código directo por Telegram"
                >
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  <span>Telegram</span>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  id="btn-send-whatsapp"
                  onClick={() => triggerSendChannel('whatsapp', verificationCode)}
                  className="py-2 px-2 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 hover:border-emerald-400 text-emerald-200 rounded-xl text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                  title="Enviar código directo por WhatsApp a 990010020"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp</span>
                </button>

                {/* SMS */}
                <button
                  type="button"
                  id="btn-send-sms"
                  onClick={() => triggerSendChannel('sms', verificationCode)}
                  className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-slate-200 rounded-xl text-[11px] font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition-all cursor-pointer shadow-xs"
                  title="Enviar código por SMS a 990010020"
                >
                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                  <span>SMS</span>
                </button>
              </div>
            </div>

            {/* 2FA Manual Input Form */}
            <form onSubmit={handleVerify2FACode} className="space-y-3 pt-1">
              <div>
                <label htmlFor="input-2fa-code" className="block text-[11px] font-bold text-slate-300 mb-1 text-center">
                  O escribe los 6 dígitos aquí:
                </label>
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
                  placeholder="000000"
                  className="w-full text-center py-2.5 bg-black/70 border border-slate-700 rounded-xl text-xl font-mono font-black text-amber-400 tracking-[0.35em] placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>

              <button
                type="submit"
                id="btn-verify-2fa-submit"
                disabled={isVerifyingCode || inputCode.length !== 6}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isVerifyingCode ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verificando...</span>
                  </div>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Confirmar e Ingresar</span>
                  </>
                )}
              </button>
            </form>

            {/* Resend button */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span>{countdown > 0 ? `Reenviar en ${countdown}s` : '¿Nuevo código?'}</span>
              <button
                type="button"
                disabled={!canResend}
                onClick={handleResendCurrentChannel}
                className="font-bold text-amber-400 hover:text-amber-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Generar nuevo código
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
