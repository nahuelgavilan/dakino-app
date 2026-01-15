import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { ROUTES } from '@/router/routes';
import { Mail, Lock, User } from 'lucide-react';

export const SignupForm = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { error, success } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      error('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, fullName);
      success('Cuenta creada correctamente. Revisa tu email para confirmar.');
      navigate(ROUTES.APP.DASHBOARD);
    } catch (err: any) {
      error(err.message || 'Error al crear la cuenta');
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
        <p className="text-neutral-600">Crea tu cuenta</p>
      </div>

      <Input
        type="text"
        label="Nombre completo"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Juan Pérez"
        icon={<User size={20} />}
        required
      />

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
        helperText="Mínimo 6 caracteres"
        required
      />

      <Input
        type="password"
        label="Confirmar contraseña"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="••••••••"
        icon={<Lock size={20} />}
        required
      />

      <Button type="submit" fullWidth loading={loading}>
        Crear Cuenta
      </Button>

      <div className="text-center text-sm text-neutral-600">
        ¿Ya tienes cuenta?{' '}
        <button
          type="button"
          onClick={() => navigate(ROUTES.AUTH.LOGIN)}
          className="text-primary-500 hover:text-primary-600 font-medium"
        >
          Inicia sesión
        </button>
      </div>
    </form>
  );
};
