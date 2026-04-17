import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Login() {
  const [step, setStep] = useState('mobile'); // mobile | otp
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const sendOTP = async () => {
    if (mobile.length !== 10) return setError('Enter valid 10-digit mobile number');
    setLoading(true); setError('');
    try {
      await api.post('/auth/send-otp', { mobile });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) return setError('Enter 6-digit OTP');
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-otp', { mobile, otp });
      const { user, token } = res.data;
      if (user.role !== 'admin') {
        setError('Access denied. Admin accounts only.');
        return;
      }
      login(user, token);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>
            <svg viewBox="0 0 40 40" width="40" height="40">
              <circle cx="20" cy="20" r="20" fill="#185FA5"/>
              <line x1="9" y1="15" x2="20" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <line x1="20" y1="7" x2="20" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <line x1="31" y1="15" x2="20" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <line x1="33" y1="23" x2="20" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <line x1="25" y1="33" x2="20" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <line x1="15" y1="33" x2="20" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <line x1="6" y1="24" x2="20" y2="20" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
              <circle cx="9" cy="15" r="3" fill="#1D9E75"/>
              <circle cx="20" cy="7" r="2.5" fill="#F2C94C"/>
              <circle cx="31" cy="15" r="3" fill="#1D9E75"/>
              <circle cx="33" cy="23" r="2.5" fill="#F2C94C"/>
              <circle cx="25" cy="33" r="2.5" fill="#1D9E75"/>
              <circle cx="15" cy="33" r="2.5" fill="#F2C94C"/>
              <circle cx="6" cy="24" r="2.5" fill="#1D9E75"/>
              <circle cx="20" cy="20" r="6" fill="white" opacity="0.15"/>
              <circle cx="20" cy="20" r="4" fill="white" opacity="0.25"/>
              <circle cx="20" cy="20" r="2.5" fill="white"/>
              <circle cx="20" cy="20" r="1.2" fill="#185FA5"/>
            </svg>
          </div>
          <div>
            <div style={styles.logoName}>VendorNet</div>
            <div style={styles.logoSub}>Admin Portal</div>
          </div>
        </div>

        <h1 style={styles.title}>
          {step === 'mobile' ? 'Welcome back' : 'Enter OTP'}
        </h1>
        <p style={styles.subtitle}>
          {step === 'mobile'
            ? 'Sign in with your admin mobile number'
            : `OTP sent to +91 ${mobile}`}
        </p>

        {error && <div style={styles.error}>{error}</div>}

        {step === 'mobile' ? (
          <>
            <div style={styles.inputWrap}>
              <span style={styles.prefix}>+91</span>
              <input
                style={styles.input}
                type="tel"
                maxLength={10}
                placeholder="Mobile number"
                value={mobile}
                onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && sendOTP()}
                autoFocus
              />
            </div>
            <button style={styles.btn} onClick={sendOTP} disabled={loading}>
              {loading ? 'Sending...' : 'Send OTP →'}
            </button>
          </>
        ) : (
          <>
            <input
              style={{...styles.input, ...styles.otpInput}}
              type="tel"
              maxLength={6}
              placeholder="6-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verifyOTP()}
              autoFocus
            />
            <button style={styles.btn} onClick={verifyOTP} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Login →'}
            </button>
            <button style={styles.link} onClick={() => { setStep('mobile'); setOtp(''); setError(''); }}>
              ← Change number
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'linear-gradient(135deg, #0e3d6e 0%, #185FA5 50%, #1D9E75 100%)',
    padding: '24px',
  },
  card: {
    background: '#fff', borderRadius: 20, padding: '40px',
    width: '100%', maxWidth: 400,
    boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
    animation: 'fadeIn 0.4s ease',
  },
  logoWrap: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 },
  logoIcon: {},
  logoName: { fontSize: 20, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 },
  logoSub: { fontSize: 12, color: '#185FA5', fontWeight: 500, letterSpacing: '0.05em' },
  title: { fontSize: 24, fontWeight: 700, color: '#0f172a', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#64748b', marginBottom: 24 },
  error: {
    background: '#fff0f0', border: '1px solid #fecaca', color: '#dc2626',
    borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16,
  },
  inputWrap: {
    display: 'flex', alignItems: 'center',
    border: '1.5px solid #e2e8f0', borderRadius: 12,
    overflow: 'hidden', marginBottom: 14,
    transition: 'border-color 0.2s',
  },
  prefix: {
    padding: '12px 14px', background: '#f8fafc',
    color: '#64748b', fontSize: 14, fontWeight: 500,
    borderRight: '1.5px solid #e2e8f0',
  },
  input: {
    flex: 1, padding: '13px 14px', border: 'none', outline: 'none',
    fontSize: 15, color: '#0f172a', background: 'transparent',
    width: '100%',
  },
  otpInput: {
    border: '1.5px solid #e2e8f0', borderRadius: 12,
    marginBottom: 14, letterSpacing: '0.3em', textAlign: 'center',
    fontSize: 20, fontWeight: 600, display: 'block',
  },
  btn: {
    width: '100%', padding: '14px', background: '#185FA5',
    color: '#fff', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    transition: 'background 0.2s', marginBottom: 10,
  },
  link: {
    width: '100%', padding: '8px', background: 'none',
    border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer',
  },
};
