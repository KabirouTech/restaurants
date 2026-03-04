'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) return null
  return user
}

export async function approveUpgradeRequest(
  requestId: string,
  orgId: string,
  targetPlan: string,
  paymentMethod: string | null,
  paymentReference: string | null,
  adminNotes: string | null,
): Promise<{ success: boolean; error?: string }> {
  const user = await getAdminUser()
  if (!user) return { success: false, error: 'Non autorisé' }

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
      p_triggered_by: user.id,
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
      processed_by: user.id,
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
  const user = await getAdminUser()
  if (!user) return { success: false, error: 'Non autorisé' }

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
      processed_by: user.id,
      admin_notes: adminNotes,
    })
    .eq('id', requestId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
