"use server";

import { Resend } from "resend";
import { createClient as createServerClient } from "@/utils/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js"; // Import Admin Client

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderEmailAction(orderId: string, email: string, message?: string) {
    if (!orderId || !email) {
        return { error: "ID de commande et email requis" };
    }

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Non authentifié" };
    }

    try {
        // Use Admin Client to Bypass RLS for Order Fetching
        const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        // Fetch Order Details for Email Content
        const { data: order, error } = await supabaseAdmin
            .from("orders")
            .select(`
                *,
                customers (full_name, email),
                order_items (
                    quantity,
                    unit_price_cents,
                    products (name)
                ),
                 organizations (name, settings)

            `)
            .eq("id", orderId)
            .single();

        if (error || !order) {
            console.error("Order fetch error:", error); // Log error for debugging
            return { error: "Commande introuvable ou erreur serveur" };
        }

        // Calculate Totals
        const total = (order.total_amount_cents || 0) / 100;
        const orgName = order.organizations?.name || "Restaurant";
        // TODO: Get brand color from organization settings if available
        const brandColor = "#d97706"; // Default Amber-600

        // Construct Email HTML (Basic for now, can be a React Email template later)
        // Construct Email HTML with better styling
        const itemsHtml = order.order_items.map((item: any) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 12px; color: #111827;">${item.products?.name}</td>
                <td style="padding: 12px; text-align: center; color: #6b7280;">${item.quantity}</td>
                <td style="padding: 12px; text-align: right; color: #111827; font-family: monospace;">${(item.unit_price_cents / 100).toFixed(2)} €</td>
            </tr>
        `).join("");

        const customMessageHtml = message
            ? `<div style="background-color: #fffbeb; border-left: 4px solid ${brandColor}; padding: 16px; margin-bottom: 24px; color: #4b5563; font-style: italic;">"${message.replace(/\n/g, '<br/>')}"</div>`
            : '';

        const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Votre commande chez ${orgName}</title>
            </head>
            <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <div style="background-color: ${brandColor}; padding: 24px; text-align: center;">
                         <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: bold;">${orgName}</h1>
                    </div>

                    <!-- Content -->
                    <div style="padding: 32px;">
                        <h2 style="color: #111827; margin-top: 0; font-size: 20px;">Bonjour ${order.customers?.full_name || "cher client"},</h2>
                        
                        ${customMessageHtml}

                        <p style="color: #4b5563; line-height: 1.5;">Voici le détail de votre commande <strong>#${order.id.slice(0, 8).toUpperCase()}</strong>.</p>
                        
                        <div style="margin-top: 24px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                                        <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6b7280;">Article</th>
                                        <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6b7280;">Qté</th>
                                        <th style="padding: 12px; text-align: right; font-size: 12px; font-weight: 600; text-transform: uppercase; color: #6b7280;">Prix</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                </tbody>
                                <tfoot>
                                    <tr style="background-color: #fffbeb;">
                                        <td colspan="2" style="padding: 16px; text-align: right; font-weight: bold; color: ${brandColor};">Total</td>
                                        <td style="padding: 16px; text-align: right; font-weight: bold; color: ${brandColor}; font-size: 18px;">${total.toFixed(2)} €</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <p style="margin-top: 32px; color: #6b7280; font-size: 14px; text-align: center;">
                            Merci de votre confiance !<br/>
                            L'équipe ${orgName}
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f9fafb; padding: 16px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb;">
                        <p style="margin: 0;">Cet email a été envoyé automatiquement via Restaurant OS.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send Email
        const { data, error: resendError } = await resend.emails.send({
            from: "Restaurant OS <orders@resend.dev>", // TODO: Update with user's domain eventually
            to: [email],
            subject: `Votre commande #${order.id.slice(0, 8)} - ${orgName}`,
            html: emailHtml,
        });

        if (resendError) {
            console.error("Resend Error:", resendError);
            return { error: "Erreur lors de l'envoi de l'email" };
        }

        return { success: true };

    } catch (err: any) {
        console.error("Send Email Logic Error:", err);
        return { error: err.message };
    }
}
