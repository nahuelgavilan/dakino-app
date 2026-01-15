import { SignupForm } from '@/components/auth/SignupForm';

export const SignupPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 animate-slide-up">
          <SignupForm />
        </div>
      </div>
    </div>
  );
};
