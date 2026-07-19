'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCurrentProfile } from '@/lib/auth/current-profile'

// Profile UUID of the super admin (NOT the Clerk id: p_triggered_by and
// processed_by are UUID columns referencing profiles — a Clerk `user_…` id
// fails the uuid cast).
async function getAdminProfileId(): Promise<string | null> {
  const { userId, profile } = await getCurrentProfile()
  if (!userId || !profile?.is_super_admin) return null
  return profile.id
}

export async function approveUpgradeRequest(
  requestId: string,
  orgId: string,
  targetPlan: string,
  paymentMethod: string | null,
  paymentReference: string | null,
  adminNotes: string | null,
): Promise<{ success: boolean; error?: string }> {
  const adminUserId = await getAdminProfileId()
  if (!adminUserId) return { success: false, error: 'Non autorisé' }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  // Call RPC to upgrade the org
  const { data: upgradeResult, error: upgradeErr } = await admin.rpc(
    'upgrade_organization_plan',
    {
      p_org_id: orgId,
      p_new_plan: targetPlan,
      p_triggered_by: adminUserId,
      p_payment_reference: paymentReference,
      p_payment_provider: paymentMethod,
    }
  )

  if (upgradeErr || !upgradeResult?.success) {
    return {
      success: false,
      error: upgradeErr?.message || upgradeResult?.reason || "Erreur lors de l'upgrade.",
    }
  }

  // Mark request as completed
  const { error: updateErr } = await admin
    .from('upgrade_requests')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
      processed_by: adminUserId,
      admin_notes: adminNotes,
    })
    .eq('id', requestId)

  if (updateErr) {
    return { success: false, error: updateErr.message }
  }

  return { success: true }
}

export async function rejectUpgradeRequest(
  requestId: string,
  adminNotes: string | null,
): Promise<{ success: boolean; error?: string }> {
  const adminUserId = await getAdminProfileId()
  if (!adminUserId) return { success: false, error: 'Non autorisé' }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )

  const { error } = await admin
    .from('upgrade_requests')
    .update({
      status: 'rejected',
      processed_at: new Date().toISOString(),
      processed_by: adminUserId,
      admin_notes: adminNotes,
    })
    .eq('id', requestId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
