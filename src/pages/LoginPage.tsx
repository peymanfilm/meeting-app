import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';

const schema = z.object({
  username: z.string().min(1, 'نام کاربری الزامی است'),
  password: z.string().min(3, 'رمز عبور حداقل ۳ کاراکتر است'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    setError('');
    const result = login(data.username, data.password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'خطا در ورود');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 animate-scale-in">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary-700 flex items-center justify-center text-white mb-4 shadow-lg">
              <FileText size={32} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 text-center">
              سامانه یکپارچه مدیریت
            </h1>
            <p className="text-sm text-gray-500 mt-1">جلسات و پیگیری مکاتبات</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-danger-50 text-danger-700 text-sm px-4 py-3 rounded-lg mb-4 animate-fade-in">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">نام کاربری</label>
              <div className="relative">
                <User size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  {...register('username')}
                  className={`input pr-10 ${errors.username ? 'input-error' : ''}`}
                  placeholder="نام کاربری خود را وارد کنید"
                />
              </div>
              {errors.username && (
                <p className="text-danger-600 text-xs mt-1.5">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="label">رمز عبور</label>
              <div className="relative">
                <Lock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className={`input pr-10 pl-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="رمز عبور"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-danger-600 text-xs mt-1.5">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3 text-base"
            >
              ورود به سامانه
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              کاربران نمونه: moaven / modir_pajoohesh (رمز: ۱۲۳۴۵۶)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
