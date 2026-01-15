import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ROUTES } from '@/router/routes';
import { Mail, Lock } from 'lucide-react';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signIn(email, password);
      success('Sesión iniciada correctamente');
      navigate(ROUTES.APP.DASHBOARD);
    } catch (err: any) {
      error(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent mb-2">
          Dakino
        </h1>
        <p className="text-neutral-600">Inicia sesión en tu cuenta</p>
      </div>

      <Input
        type="email"
        label="Correo electrónico"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        icon={<Mail size={20} />}
        required
      />

      <Input
        type="password"
        label="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        icon={<Lock size={20} />}
        required
      />

      <Button type="submit" fullWidth loading={loading}>
        Iniciar Sesión
      </Button>

      <div className="text-center space-y-2">
        <button
          type="button"
          onClick={() => navigate(ROUTES.AUTH.FORGOT_PASSWORD)}
          className="text-sm text-neutral-600 hover:text-primary-500 transition-colors"
        >
          ¿Olvidaste tu contraseña?
        </button>
        <div className="text-sm text-neutral-600">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => navigate(ROUTES.AUTH.SIGNUP)}
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Regístrate
          </button>
        </div>
      </div>
    </form>
  );
};
