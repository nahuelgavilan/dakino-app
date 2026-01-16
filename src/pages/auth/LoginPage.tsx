import { LoginForm } from '@/components/auth/LoginForm';

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-down">
          <img
            src="/logo.png"
            alt="Dakino"
            className="w-40 h-40 mx-auto drop-shadow-2xl"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
