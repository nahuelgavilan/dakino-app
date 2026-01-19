import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { householdService } from '@/services/household.service';
import { useToast } from '@/hooks/useToast';
import {
  Home,
  Copy,
  RefreshCw,
  LogOut,
  UserPlus,
  Check,
  X,
  Loader2,
  ChevronRight,
} from 'lucide-react';

export const HouseholdSection = () => {
  const { user, household, refreshHousehold } = useAuth();
  const { success, error: showError } = useToast();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  if (!user) return null;

  const copyInviteCode = async () => {
    if (!household?.invite_code) return;
    try {
      await navigator.clipboard.writeText(household.invite_code);
      setCopied(true);
      success('Código copiado');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showError('No se pudo copiar el código');
    }
  };

  const handleRegenerateCode = async () => {
    if (!household) return;
    try {
      setRegenerating(true);
      await householdService.regenerateInviteCode(household.id);
      await refreshHousehold();
      success('Código regenerado');
    } catch (err: any) {
      showError(err.message || 'Error al regenerar código');
    } finally {
      setRegenerating(false);
    }
  };

  const handleJoinHousehold = async () => {
    if (!inviteCode.trim()) {
      showError('Ingresa un código de invitación');
      return;
    }

    try {
      setLoading(true);
      const result = await householdService.joinHousehold(user.id, inviteCode);

      if (result.success) {
        await refreshHousehold();
        success(`Te has unido a "${result.household_name}"`);
        setShowJoinModal(false);
        setInviteCode('');
      } else {
        showError(result.error || 'Código inválido');
      }
    } catch (err: any) {
      showError(err.message || 'Error al unirse');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveHousehold = async () => {
    try {
      setLoading(true);
      const result = await householdService.leaveHousehold(user.id);

      if (result.success) {
        await refreshHousehold();
        success('Has abandonado el hogar');
        setShowLeaveModal(false);
      } else {
        showError(result.error || 'Error al abandonar');
      }
    } catch (err: any) {
      showError(err.message || 'Error al abandonar el hogar');
    } finally {
      setLoading(false);
    }
  };

  const memberCount = household?.members?.length || 1;
  const isShared = memberCount > 1;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Home size={18} className="text-neutral-600" />
          <h3 className="text-sm font-black text-neutral-700 uppercase tracking-wide">
            Mi Hogar
          </h3>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100">
          {/* Household Name */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Home size={24} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-neutral-900">
                  {household?.name || 'Mi Hogar'}
                </p>
                <p className="text-sm text-neutral-500">
                  {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                </p>
              </div>
            </div>
            {isShared && (
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                Compartido
              </span>
            )}
          </div>

          {/* Members */}
          {isShared && household?.members && (
            <div className="mb-4">
              <p className="text-xs font-bold text-neutral-500 mb-2">MIEMBROS</p>
              <div className="flex -space-x-2">
                {household.members.map((member) => (
                  <div
                    key={member.id}
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-white flex items-center justify-center text-white text-sm font-bold"
                    title={member.full_name || member.email}
                  >
                    {member.full_name?.[0]?.toUpperCase() || member.email[0].toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Invite Code */}
          <div className="bg-white/60 rounded-xl p-3 mb-4">
            <p className="text-xs font-bold text-neutral-500 mb-2">CÓDIGO DE INVITACIÓN</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-2xl font-mono font-bold text-indigo-600 tracking-wider">
                {household?.invite_code || '------'}
              </code>
              <button
                onClick={copyInviteCode}
                className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                disabled={!household?.invite_code}
              >
                {copied ? (
                  <Check size={20} className="text-green-600" />
                ) : (
                  <Copy size={20} className="text-indigo-600" />
                )}
              </button>
              <button
                onClick={handleRegenerateCode}
                disabled={regenerating}
                className="p-2 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
              >
                <RefreshCw
                  size={20}
                  className={`text-indigo-600 ${regenerating ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Comparte este código para que otros se unan a tu hogar
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="w-full flex items-center justify-between p-3 bg-white/60 hover:bg-white/80 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <UserPlus size={18} className="text-green-600" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-neutral-900 text-sm">Unirse a otro hogar</p>
                  <p className="text-xs text-neutral-500">Tengo un código de invitación</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-neutral-400" />
            </button>

            {isShared && (
              <button
                onClick={() => setShowLeaveModal(true)}
                className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <LogOut size={18} className="text-red-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-red-700 text-sm">Abandonar hogar</p>
                    <p className="text-xs text-red-500">Crear mi propio hogar</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-red-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Join Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neutral-900">Unirse a un hogar</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-full"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            <p className="text-neutral-600 mb-4">
              Ingresa el código de invitación que te compartieron. Tus datos se fusionarán con los del hogar.
            </p>

            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123"
              maxLength={6}
              className="w-full px-4 py-4 text-center text-2xl font-mono font-bold tracking-widest bg-neutral-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
              autoFocus
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-3 font-bold text-neutral-600 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleJoinHousehold}
                disabled={loading || inviteCode.length < 6}
                className="flex-1 py-3 font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={20} />
                    Unirse
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-neutral-900">Abandonar hogar</h3>
              <button
                onClick={() => setShowLeaveModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-full"
              >
                <X size={20} className="text-neutral-500" />
              </button>
            </div>

            <p className="text-neutral-600 mb-2">
              ¿Estás seguro de que quieres abandonar este hogar?
            </p>
            <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-xl mb-4">
              Tus datos (productos, compras, inventario) se moverán a un nuevo hogar personal.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 py-3 font-bold text-neutral-600 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLeaveHousehold}
                disabled={loading}
                className="flex-1 py-3 font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <LogOut size={20} />
                    Abandonar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
