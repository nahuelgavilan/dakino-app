import { supabase } from './supabase';
import type {
  Household,
  HouseholdMember,
  HouseholdUpdate,
  JoinHouseholdResult,
  LeaveHouseholdResult,
} from '@/types/models';

export const householdService = {
  /**
   * Obtener el hogar del usuario actual con sus miembros
   */
  async getMyHousehold(userId: string): Promise<Household | null> {
    // Primero obtener el household_id del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.household_id) {
      return null;
    }

    // Obtener el hogar
    const { data: household, error: householdError } = await supabase
      .from('households')
      .select('*')
      .eq('id', profile.household_id)
      .single();

    if (householdError || !household) {
      return null;
    }

    // Obtener los miembros del hogar
    const { data: members, error: membersError } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .eq('household_id', profile.household_id);

    if (membersError) {
      console.error('Error fetching household members:', membersError);
    }

    return {
      ...household,
      members: members as HouseholdMember[] || [],
    };
  },

  /**
   * Crear un nuevo hogar para el usuario
   */
  async createHousehold(userId: string, name: string = 'Mi Hogar'): Promise<Household> {
    const { error } = await supabase.rpc('create_household_for_user', {
      p_user_id: userId,
      p_name: name,
    });

    if (error) {
      throw new Error(error.message);
    }

    // Obtener el hogar recién creado
    const household = await this.getMyHousehold(userId);
    if (!household) {
      throw new Error('Error al obtener el hogar creado');
    }

    return household;
  },

  /**
   * Unirse a un hogar existente con código de invitación
   */
  async joinHousehold(userId: string, inviteCode: string): Promise<JoinHouseholdResult> {
    const { data, error } = await supabase.rpc('join_household_with_code', {
      p_user_id: userId,
      p_invite_code: inviteCode.toUpperCase().trim(),
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as JoinHouseholdResult;
  },

  /**
   * Abandonar el hogar actual y crear uno nuevo personal
   */
  async leaveHousehold(userId: string): Promise<LeaveHouseholdResult> {
    const { data, error } = await supabase.rpc('leave_household', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as LeaveHouseholdResult;
  },

  /**
   * Actualizar datos del hogar (nombre)
   */
  async updateHousehold(householdId: string, updates: HouseholdUpdate): Promise<Household> {
    const { data, error } = await supabase
      .from('households')
      .update(updates)
      .eq('id', householdId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },

  /**
   * Regenerar código de invitación
   */
  async regenerateInviteCode(householdId: string): Promise<string> {
    const { data, error } = await supabase.rpc('regenerate_invite_code', {
      p_household_id: householdId,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data as string;
  },

  /**
   * Obtener el household_id del usuario actual
   * Útil para queries de otros servicios
   */
  async getHouseholdId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('household_id')
      .eq('id', userId)
      .single();

    if (error || !data?.household_id) {
      return null;
    }

    return data.household_id;
  },

  /**
   * Verificar si un código de invitación es válido
   */
  async validateInviteCode(inviteCode: string): Promise<{ valid: boolean; householdName?: string }> {
    const { data, error } = await supabase
      .from('households')
      .select('name')
      .eq('invite_code', inviteCode.toUpperCase().trim())
      .single();

    if (error || !data) {
      return { valid: false };
    }

    return { valid: true, householdName: data.name };
  },
};
