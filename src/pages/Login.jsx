import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Lock, Mail, AlertTriangle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Traffic Cop: Fetch user roles
      const userDoc = await getDoc(doc(db, 'volunteers', user.uid));

      if (userDoc.exists()) {
        const data = userDoc.data();

        if (data.role === 'admin') {
          navigate('/admin');
        } else if (data.role === 'volunteer' && data.status === 'approved') {
          navigate('/volunteer');
        } else if (data.role === 'volunteer' && data.status === 'pending') {
          alert('Your account is pending admin approval.');
          await signOut(auth);
          setLoading(false);
        } else {
          setError('Unknown account type.');
          await signOut(auth);
          setLoading(false);
        }
      } else {
        // Safe-fallback for an admin created before this collection structure
        navigate('/admin');
      }
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-base transition-colors duration-300 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-theme-surface transition-colors duration-300 rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="bg-theme-surface transition-colors duration-300 p-6 text-center">
          <h2 className="text-2xl font-bold text-white tracking-wide">Sewa Sync</h2>
          <p className="text-slate-300 text-sm mt-1">Unified Access Portal</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-theme-base transition-colors duration-300 border border-slate-200 rounded-xl outline-none focus:border-brand-teal focus:bg-theme-surface transition-colors duration-300 transition-colors"
                  placeholder="admin@sewasync.org"
                  required
                />
                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-theme-base transition-colors duration-300 border border-slate-200 rounded-xl outline-none focus:border-brand-teal focus:bg-theme-surface transition-colors duration-300 transition-colors"
                  placeholder="••••••••"
                  required
                />
                <Lock className="absolute left-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-brand-teal text-white font-medium py-3 rounded-xl hover:bg-teal-700 transition-colors shadow-md disabled:bg-slate-400"
            >
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          {/* Demo Credentials Box */}
          <div className="mt-6 space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">Admin Demo Credentials</p>
              <p>Email:<span className="font-medium">tandulkarkesar@gmail.com</span></p>
              <p>Password:<span className="font-medium">kesartandulkar</span></p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-sm text-green-800">
              <p className="font-semibold mb-1">Volunteer Demo Credentials</p>
              <p>Email:<span className="font-medium">tandulkarkesar165@gmail.com</span></p>
              <p>Password:<span className="font-medium">123456</span></p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/public')}
              className="text-sm text-slate-500 hover:text-brand-navy underline"
            >
              Return to Public Portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
