import { LoginForm } from '@/components/auth/LoginForm';

export const LoginPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-slide-down">
          <img
            src="/logo.png"
            alt="Dakino Logo"
            className="w-32 h-32 mx-auto mb-4 drop-shadow-2xl"
          />
          <h1 className="text-4xl font-black text-neutral-900 mb-2">
            Dakino
          </h1>
          <p className="text-neutral-600 font-medium">
            Tus compras bajo control
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
          <LoginForm />
        </div>
      </div>
    </div>
  );
};
