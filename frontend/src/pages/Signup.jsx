import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/axiosInstance';

const categories = ['Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mason', 'Welder'];

const strengthLabel = (pw) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[!@#$%^&*]/.test(pw)) score++;
  if (score <= 1) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/4' };
  if (score <= 2) return { label: 'Medium', color: 'bg-amber-500', width: 'w-1/2' };
  if (score <= 3) return { label: 'Strong', color: 'bg-green-500', width: 'w-3/4' };
  return { label: 'Very Strong', color: 'bg-green-600', width: 'w-full' };
};

const Signup = () => {
  const [role, setRole] = useState('client');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    category: '', experience: '', pricePerHour: '', skills: [], bio: '',
    city: '', address: ''
  });
  const navigate = useNavigate();
  const strength = strengthLabel(form.password);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const validateStep1 = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Valid email required';
    if (!form.phone.match(/^[0-9]{10}$/)) errs.phone = '10 digit phone required';
    if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (!/[A-Z]/.test(form.password)) errs.password = 'Need 1 uppercase letter';
    if (!/[0-9]/.test(form.password)) errs.password = 'Need 1 number';
    if (!/[!@#$%^&*]/.test(form.password)) errs.password = 'Need 1 special character';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    if (role === 'client') return true;
    const errs = {};
    if (!form.category) errs.category = 'Category required';
    if (!form.pricePerHour || form.pricePerHour < 50) errs.pricePerHour = 'Min ₹50/hr';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
        if (role === 'client') setStep(3); // Skip professional info for client
        else setStep(2);
    }
    if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const signupPath = role === 'client' ? '/auth/client/signup' : '/auth/worker/signup';
      const payload = { ...form };
      if (role === 'client') {
          delete payload.category;
          delete payload.experience;
          delete payload.pricePerHour;
          delete payload.skills;
          delete payload.bio;
      }
      await api.post(signupPath, payload);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!form.skills.includes(skillInput.trim())) {
        update('skills', [...form.skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const inputClass = "w-full border border-gray-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all mt-1";
  const labelClass = "text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Join SewaPro</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create your {role} account</p>
        </div>

        <div className="flex gap-2 mb-6">
            {['client', 'worker'].map(r => (
              <button key={r} onClick={() => { setRole(r); setStep(1); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${role === r ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300'}`}>
                {r === 'client' ? '👤 Client' : '👷 Worker'}
              </button>
            ))}
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map(s => {
              if (role === 'client' && s === 2) return null;
              return (
                <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-slate-700'}`} />
              )
          })}
        </div>
        <p className="text-xs text-center text-gray-400 mb-6">
            {role === 'client' ? (
                `Step ${step === 1 ? '1' : '2'} of 2 — ${step === 1 ? 'Basic Info' : 'Location'}`
            ) : (
                `Step ${step} of 3 — ${['Basic Info', 'Professional Info', 'Location'][step-1]}`
            )}
        </p>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input value={form.name} onChange={e => update('name', e.target.value)} placeholder="Ramesh Patel" className={inputClass} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input type="email" value={form.email} onChange={e => update('email', e.target.value)} placeholder="ramesh@example.com" className={inputClass} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="9876543210" maxLength={10} className={inputClass} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className={labelClass}>Password</label>
                <input type="password" value={form.password} onChange={e => update('password', e.target.value)} placeholder="Min 8 chars" className={inputClass} />
                {form.password && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full">
                      <div className={`h-full rounded-full transition-all ${strength.color} ${strength.width}`} />
                    </div>
                    <p className={`text-xs mt-1 font-medium ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                  </div>
                )}
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>
              <div>
                <label className={labelClass}>Confirm Password</label>
                <input type="password" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} placeholder="Repeat password" className={inputClass} />
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </motion.div>
          )}

          {step === 2 && role === 'worker' && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className={labelClass}>Category</label>
                <select value={form.category} onChange={e => update('category', e.target.value)} className={inputClass}>
                  <option value="">Select your trade</option>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
              </div>
              <div>
                <label className={labelClass}>Years of Experience</label>
                <input type="number" min="0" value={form.experience} onChange={e => update('experience', e.target.value)} placeholder="0" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Price Per Hour (₹)</label>
                <input type="number" min="50" value={form.pricePerHour} onChange={e => update('pricePerHour', e.target.value)} placeholder="150" className={inputClass} />
                {errors.pricePerHour && <p className="text-red-500 text-xs mt-1">{errors.pricePerHour}</p>}
              </div>
              <div>
                <label className={labelClass}>Skills (press Enter to add)</label>
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={addSkill}
                  placeholder="e.g. Pipe fitting" className={inputClass} />
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.skills.map(skill => (
                    <span key={skill} className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded-full">
                      {skill}
                      <button onClick={() => update('skills', form.skills.filter(s => s !== skill))}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Bio / Description</label>
                <textarea value={form.bio} onChange={e => update('bio', e.target.value)}
                  rows={3} placeholder="Tell clients about yourself..."
                  className={inputClass} />
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div>
                <label className={labelClass}>City</label>
                <input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Kadi, Gujarat" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Full Address</label>
                <textarea value={form.address} onChange={e => update('address', e.target.value)} rows={2} placeholder="Street, Area..." className={inputClass} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button onClick={() => setStep(role === 'client' ? 1 : step - 1)}
              className="flex-1 border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl px-6 py-3 font-semibold transition-all">
              ← Back
            </button>
          )}
          {((role === 'worker' && step < 3) || (role === 'client' && step < 3)) ? (
            <button onClick={handleNext}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-semibold transition-all active:scale-95">
              Next →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-3 font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating...</> : 'Create Account 🎉'}
            </button>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:underline">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};
export default Signup;
