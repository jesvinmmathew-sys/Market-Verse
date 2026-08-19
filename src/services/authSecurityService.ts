/**
 * @file authSecurityService.ts
 * @author Jesvin M Mathew
 * @description Centralized security triggers for Supabase Auth workflow templates.
 */
import { supabase } from '../supabaseClient';

export const authSecurityService = {
  // 1. Confirm Sign Up / Resend Verification Email
  async resendConfirmation(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    return { success: true, message: 'Verification link sent to your email.' };
  },

  // 2. Invite User to Platform / Collaborative Terminal
  async inviteUser(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { role: 'collaborator' }
      }
    });
    if (error) throw error;
    return { success: true, message: 'Invitation email successfully dispatched.' };
  },

  // 3. Magic Link or OTP Sign-In
  async sendMagicLinkOrOTP(email: string) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        shouldCreateUser: true
      }
    });
    if (error) throw error;
    return { success: true, message: 'Magic link & OTP code sent to your inbox.' };
  },

  // 4. Change / Update Registered Email Address
  async updateEmailAddress(newEmail: string) {
    const { error } = await supabase.auth.updateUser(
      { email: newEmail },
      { emailRedirectTo: `${window.location.origin}/dashboard` }
    );
    if (error) throw error;
    return { success: true, message: 'Verification links sent to both your old and new email addresses.' };
  },

  // 5. Reset Password Request
  async sendPasswordReset(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) throw error;
    return { success: true, message: 'Password recovery link sent to your email.' };
  },

  // 6. Security Reauthentication (Before High-Risk Actions)
  async triggerReauthentication() {
    const { error } = await supabase.auth.reauthenticate();
    if (error) throw error;
    return { success: true, message: 'Reauthentication security code sent.' };
  },

  // 7. Update User Profile Full Name
  async updateProfileName(name: string) {
    const { error } = await supabase.auth.updateUser({
      data: { full_name: name }
    });
    if (error) throw error;
    return { success: true, message: 'Profile full name updated successfully.' };
  },

  // 8. Update Password Directly (In Session)
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return { success: true, message: 'Account password updated successfully.' };
  },

  // 9. Link Google OAuth identity
  async linkSignInMethod(provider: 'google') {
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    if (error) throw error;
    return { success: true, message: 'Initiated Google account link.' };
  },

  // 10. Unlink Google OAuth identity
  async unlinkSignInMethod(identityId: string) {
    const { data: userIdentities, error: listError } = await supabase.auth.getUser();
    if (listError) throw listError;
    const targetIdentity = userIdentities.user?.identities?.find(i => i.id === identityId);
    if (!targetIdentity) throw new Error("Linked identity not found.");
    
    const { error } = await supabase.auth.unlinkIdentity(targetIdentity);
    if (error) throw error;
    return { success: true, message: 'Linked Google account detached.' };
  }
};
