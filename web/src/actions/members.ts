"use server";

import { createClient } from "@/utils/supabase/server";
import { getRequiredOrganizationContext } from "@/lib/auth/organization-context";
import { sendMail } from "@/lib/mailer";
import { revalidatePath } from "next/cache";

type MemberRole = "superadmin" | "admin" | "member";

const ROLE_LABEL: Record<MemberRole, string> = {
  superadmin: "Super Admin",
  admin: "Administrateur",
  member: "Membre",
};

// ─────────────────────────────────────────────────────────────
// Invitation Email HTML
// ─────────────────────────────────────────────────────────────

function buildInvitationEmailHtml({
  orgName,
  role,
  inviteUrl,
  expiresAt,
}: {
  orgName: string;
  role: MemberRole;
  inviteUrl: string;
  expiresAt: string;
}) {
  const roleLabel = ROLE_LABEL[role];
  const expiryDate = new Date(expiresAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation - ${orgName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f3f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="max-width:600px;margin:40px auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);">

    <!-- Header with gradient -->
    <div style="background:linear-gradient(135deg,#d97706 0%,#ea580c 100%);padding:48px 40px;text-align:center;">
      <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 16px;margin-bottom:20px;">
        <span style="font-size:28px;line-height:1;">&#127860;</span>
      </div>
      <h1 style="color:#ffffff;margin:0 0 8px;font-size:26px;font-weight:700;letter-spacing:-0.02em;">
        Vous êtes invité !
      </h1>
      <p style="color:rgba(255,255,255,0.85);margin:0;font-size:15px;font-weight:400;">
        Rejoignez l'équipe sur RestaurantOS
      </p>
    </div>

    <!-- Body -->
    <div style="padding:40px;">

      <p style="color:#1f2937;font-size:16px;line-height:1.6;margin:0 0 24px;">
        Bonjour,
      </p>

      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 28px;">
        L'équipe de <strong style="color:#d97706;">${orgName}</strong> vous invite à rejoindre
        leur espace sur RestaurantOS en tant que <strong>${roleLabel}</strong>.
      </p>

      <!-- Role info card -->
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:12px;padding:20px 24px;margin-bottom:32px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="vertical-align:top;padding-right:16px;">
              <div style="width:40px;height:40px;background:#d97706;border-radius:10px;text-align:center;line-height:40px;">
                <span style="color:#ffffff;font-size:18px;">&#128100;</span>
              </div>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0 0 4px;font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                Votre rôle
              </p>
              <p style="margin:0;font-size:16px;color:#78350f;font-weight:700;">
                ${roleLabel}
              </p>
            </td>
            <td style="vertical-align:top;text-align:right;">
              <p style="margin:0 0 4px;font-size:13px;color:#92400e;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                Organisation
              </p>
              <p style="margin:0;font-size:16px;color:#78350f;font-weight:700;">
                ${orgName}
              </p>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-bottom:32px;">
        <a href="${inviteUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#d97706 0%,#ea580c 100%);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 48px;border-radius:12px;box-shadow:0 4px 14px rgba(217,119,6,0.4);letter-spacing:0.01em;">
          Accepter l'invitation
        </a>
      </div>

      <p style="color:#6b7280;font-size:13px;text-align:center;margin:0 0 24px;line-height:1.6;">
        Ce lien est valable jusqu'au <strong>${expiryDate}</strong>.<br>
        Si vous n'attendiez pas cette invitation, ignorez cet email.
      </p>

      <!-- Divider -->
      <div style="border-top:1px solid #e5e7eb;margin:24px 0;"></div>

      <!-- What is RestaurantOS -->
      <div style="text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0 0 12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
          C'est quoi RestaurantOS ?
        </p>
        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;max-width:420px;display:inline-block;">
          La plateforme tout-en-un pour gérer votre restaurant : commandes, menu,
          clients, messagerie, livraisons et plus encore.
        </p>
      </div>

    </div>

    <!-- Footer -->
    <div style="background:#fafaf9;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="margin:0 0 4px;font-size:13px;color:#d97706;font-weight:700;letter-spacing:-0.01em;">
        &#127860; RestaurantOS
      </p>
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        Simplifiez la gestion de votre restaurant.
      </p>
    </div>

  </div>

  <!-- Muted link fallback -->
  <div style="max-width:600px;margin:0 auto;padding:16px 40px;text-align:center;">
    <p style="font-size:11px;color:#9ca3af;margin:0;line-height:1.6;">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
      <a href="${inviteUrl}" style="color:#d97706;word-break:break-all;text-decoration:underline;">${inviteUrl}</a>
    </p>
  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────
// Send invitation email
// ─────────────────────────────────────────────────────────────

async function sendInvitationEmail({
  email,
  token,
  orgName,
  role,
  expiresAt,
}: {
  email: string;
  token: string;
  orgName: string;
  role: MemberRole;
  expiresAt: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000";

  const inviteUrl = `${baseUrl}/invite?token=${token}`;

  const html = buildInvitationEmailHtml({ orgName, role, inviteUrl, expiresAt });

  await sendMail({
    to: email,
    subject: `${orgName} vous invite à rejoindre leur équipe sur RestaurantOS`,
    html,
  });
}

// ─────────────────────────────────────────────────────────────
// Invite a member
// ─────────────────────────────────────────────────────────────

export async function inviteMemberAction(
  email: string,
  role: MemberRole
) {
  const orgContext = await getRequiredOrganizationContext();
  if (!orgContext.ok) return { success: false, error: orgContext.error };
  const { organizationId, profileId } = orgContext.context;

  const supabase = await createClient();

  // 1. Check plan limit
  const { data: limitData, error: limitErr } = await supabase.rpc("check_plan_limit", {
    p_org_id: organizationId,
    p_resource: "members",
  });

  if (!limitErr && limitData && !limitData.allowed) {
    return {
      success: false,
      error: `Limite de membres atteinte (${limitData.current}/${limitData.limit}). Passez au plan supérieur.`,
      upgradeRequired: true,
    };
  }

  // 2. Get org name for the email
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .single();

  const orgName = org?.name || "Votre restaurant";

  // 3. Create invitation
  const { data, error } = await supabase
    .from("organization_invitations")
    .upsert(
      {
        organization_id: organizationId,
        invited_by: profileId,
        email: email.toLowerCase().trim(),
        role,
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        onConflict: "organization_id,email",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Une invitation est déjà en cours pour cet email." };
    }
    console.error("[inviteMemberAction] error:", error);
    return { success: false, error: "Erreur lors de la création de l'invitation." };
  }

  // 4. Send invitation email
  try {
    await sendInvitationEmail({
      email: data.email,
      token: data.token,
      orgName,
      role,
      expiresAt: data.expires_at,
    });
  } catch (err) {
    console.warn("[inviteMemberAction] Email send failed (non-blocking):", err);
  }

  revalidatePath("/dashboard/settings");
  return { success: true, invitation: data };
}

// ─────────────────────────────────────────────────────────────
// List members
// ─────────────────────────────────────────────────────────────

export async function listMembersAction() {
  const orgContext = await getRequiredOrganizationContext();
  if (!orgContext.ok) return [];
  const { organizationId } = orgContext.context;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["active", "suspended", "pending"])
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[listMembersAction] error:", error);
    return [];
  }

  return data || [];
}

// ─────────────────────────────────────────────────────────────
// List invitations
// ─────────────────────────────────────────────────────────────

export async function listInvitationsAction() {
  const orgContext = await getRequiredOrganizationContext();
  if (!orgContext.ok) return [];
  const { organizationId } = orgContext.context;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", organizationId)
    .in("status", ["pending"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listInvitationsAction] error:", error);
    return [];
  }

  return data || [];
}

// ─────────────────────────────────────────────────────────────
// Cancel invitation
// ─────────────────────────────────────────────────────────────

export async function cancelInvitationAction(invitationId: string) {
  const orgContext = await getRequiredOrganizationContext();
  if (!orgContext.ok) return { success: false, error: orgContext.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("organization_invitations")
    .update({ status: "cancelled" })
    .eq("id", invitationId)
    .eq("status", "pending");

  if (error) {
    return { success: false, error: "Impossible d'annuler l'invitation." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Resend invitation
// ─────────────────────────────────────────────────────────────

export async function resendInvitationAction(invitationId: string) {
  const orgContext = await getRequiredOrganizationContext();
  if (!orgContext.ok) return { success: false, error: orgContext.error };

  const supabase = await createClient();

  // Update expiry and get invitation details
  const { data, error } = await supabase
    .from("organization_invitations")
    .update({
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: "pending",
    })
    .eq("id", invitationId)
    .select("email, token, organization_id, role, expires_at")
    .single();

  if (error || !data) {
    return { success: false, error: "Impossible de renvoyer l'invitation." };
  }

  // Get org name
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", data.organization_id)
    .single();

  try {
    await sendInvitationEmail({
      email: data.email,
      token: data.token,
      orgName: org?.name || "Votre restaurant",
      role: data.role as MemberRole,
      expiresAt: data.expires_at,
    });
  } catch (err) {
    console.warn("[resendInvitationAction] Email send failed (non-blocking):", err);
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Change member role
// ─────────────────────────────────────────────────────────────

export async function changeMemberRoleAction(profileId: string, newRole: MemberRole) {
  const orgContext = await getRequiredOrganizationContext();
  if (!orgContext.ok) return { success: false, error: orgContext.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Impossible de changer le rôle." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Suspend member
// ─────────────────────────────────────────────────────────────

export async function suspendMemberAction(profileId: string) {
  const orgContext = await getRequiredOrganizationContext();
  if (!orgContext.ok) return { success: false, error: orgContext.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ status: "suspended" })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Impossible de suspendre ce membre." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Reactivate member
// ─────────────────────────────────────────────────────────────

export async function reactivateMemberAction(profileId: string) {
  const orgContext = await getRequiredOrganizationContext();
  if (!orgContext.ok) return { success: false, error: orgContext.error };

  const supabase = await createClient();

  // Check plan limit before reactivating
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", profileId)
    .single();

  if (profile) {
    const { data: limitData } = await supabase.rpc("check_plan_limit", {
      p_org_id: profile.organization_id,
      p_resource: "members",
    });

    if (limitData && !limitData.allowed) {
      return {
        success: false,
        error: "Limite de membres atteinte. Passez au plan supérieur pour réactiver ce membre.",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Impossible de réactiver ce membre." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Remove member
// ─────────────────────────────────────────────────────────────

export async function removeMemberAction(profileId: string) {
  const orgContext = await getRequiredOrganizationContext();
  if (!orgContext.ok) return { success: false, error: orgContext.error };

  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      organization_id: null,
      role: null,
      status: "pending",
    })
    .eq("id", profileId);

  if (error) {
    return { success: false, error: "Impossible de retirer ce membre." };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
