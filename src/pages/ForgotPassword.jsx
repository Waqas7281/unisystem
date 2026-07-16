import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../app/api';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await forgotPassword({ email }).unwrap();
      toast.success(res.message);
    } catch {
      toast.error('Something went wrong. Try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md card">
        <h2 className="text-lg font-semibold mb-4">Reset your password</h2>
        <form onSubmit={submit} className="space-y-4">
          <input type="email" required className="input" placeholder="Your account email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>
        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-primary-600 hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await resetPassword({ token, newPassword }).unwrap();
      toast.success('Password updated. Please log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.data?.message || 'Reset link invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md card">
        <h2 className="text-lg font-semibold mb-4">Set a new password</h2>
        <form onSubmit={submit} className="space-y-4">
          <input type="password" required minLength={6} className="input" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <button className="btn-primary w-full" disabled={isLoading}>
            {isLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
