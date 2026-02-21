"use client";

import { useState, useEffect } from "react";
import {
  Phone,
  Instagram,
  Mail,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  connectChannelAction,
  disconnectChannelAction,
  testWhatsAppConnectionAction,
  fetchChannelsAction,
} from "@/actions/channels";

interface Channel {
  id: string;
  platform: string;
  name: string;
  provider_id: string;
  is_active: boolean;
}

export function ChannelSettings({ orgId }: { orgId: string }) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  // WhatsApp form
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waAccessToken, setWaAccessToken] = useState("");
  const [waSaving, setWaSaving] = useState(false);
  const [waTesting, setWaTesting] = useState(false);
  const [waTestResult, setWaTestResult] = useState<string | null>(null);

  // Email form
  const [emailForm, setEmailForm] = useState({
    imap_host: "",
    imap_port: "993",
    imap_user: "",
    imap_pass: "",
    smtp_host: "",
    smtp_port: "587",
    smtp_user: "",
    smtp_pass: "",
    from_name: "",
    from_email: "",
  });
  const [emailSaving, setEmailSaving] = useState(false);

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    const result = await fetchChannelsAction();
    if (result.channels) setChannels(result.channels);
    setLoading(false);
  };

  const waChannel = channels.find(
    (c) => c.platform === "whatsapp" && c.is_active
  );
  const igChannel = channels.find(
    (c) => c.platform === "instagram" && c.is_active
  );
  const emailChannel = channels.find(
    (c) => c.platform === "email" && c.is_active
  );

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/whatsapp`
      : "/api/webhooks/whatsapp";

  const handleConnectWhatsApp = async () => {
    if (!waPhoneNumberId.trim() || !waAccessToken.trim()) return;
    setWaSaving(true);
    const result = await connectChannelAction(
      "whatsapp",
      "WhatsApp Business",
      waPhoneNumberId.trim(),
      {
        phone_number_id: waPhoneNumberId.trim(),
        access_token: waAccessToken.trim(),
      }
    );
    if (result.channelId) {
      await loadChannels();
      setWaPhoneNumberId("");
      setWaAccessToken("");
    }
    setWaSaving(false);
  };

  const handleTestWhatsApp = async () => {
    if (!waChannel) return;
    setWaTesting(true);
    setWaTestResult(null);
    const result = await testWhatsAppConnectionAction(waChannel.id);
    setWaTestResult(
      result.success
        ? `Connecté: ${result.phoneNumber}`
        : `Erreur: ${result.error}`
    );
    setWaTesting(false);
  };

  const handleDisconnect = async (channelId: string) => {
    await disconnectChannelAction(channelId);
    await loadChannels();
  };

  const handleConnectEmail = async () => {
    if (!emailForm.imap_host || !emailForm.imap_user || !emailForm.smtp_host)
      return;
    setEmailSaving(true);
    const result = await connectChannelAction(
      "email",
      `Email (${emailForm.from_email || emailForm.imap_user})`,
      emailForm.from_email || emailForm.imap_user,
      {
        imap_host: emailForm.imap_host,
        imap_port: parseInt(emailForm.imap_port),
        imap_user: emailForm.imap_user,
        imap_pass: emailForm.imap_pass,
        imap_tls: true,
        smtp_host: emailForm.smtp_host,
        smtp_port: parseInt(emailForm.smtp_port),
        smtp_user: emailForm.smtp_user || emailForm.imap_user,
        smtp_pass: emailForm.smtp_pass || emailForm.imap_pass,
        smtp_tls: false,
        from_name: emailForm.from_name,
        from_email: emailForm.from_email || emailForm.imap_user,
      }
    );
    if (result.channelId) {
      await loadChannels();
      setEmailForm({
        imap_host: "",
        imap_port: "993",
        imap_user: "",
        imap_pass: "",
        smtp_host: "",
        smtp_port: "587",
        smtp_user: "",
        smtp_pass: "",
        from_name: "",
        from_email: "",
      });
    }
    setEmailSaving(false);
  };

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* ── WhatsApp ────────────────────────────── */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-base">WhatsApp</CardTitle>
            </div>
            {waChannel ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3.5 w-3.5" /> Connecté
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <XCircle className="h-3.5 w-3.5" /> Non connecté
              </span>
            )}
          </div>
          <CardDescription className="text-xs">
            Cloud API officielle Meta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {waChannel ? (
            <>
              <div className="text-sm text-muted-foreground">
                Phone Number ID:{" "}
                <span className="font-mono text-xs">
                  {waChannel.provider_id}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTestWhatsApp}
                  disabled={waTesting}
                >
                  {waTesting ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : null}
                  Tester
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDisconnect(waChannel.id)}
                >
                  Déconnecter
                </Button>
              </div>
              {waTestResult && (
                <p
                  className={cn(
                    "text-xs",
                    waTestResult.startsWith("Connecté")
                      ? "text-green-600"
                      : "text-destructive"
                  )}
                >
                  {waTestResult}
                </p>
              )}
              <div className="pt-2 border-t border-border">
                <Label className="text-xs text-muted-foreground">
                  URL Webhook (à copier dans Meta Dashboard)
                </Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="text-xs font-mono h-8"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={copyWebhookUrl}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                {copied && (
                  <p className="text-xs text-green-600 mt-1">Copié !</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-xs">Phone Number ID</Label>
                <Input
                  value={waPhoneNumberId}
                  onChange={(e) => setWaPhoneNumberId(e.target.value)}
                  placeholder="Ex: 123456789012345"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Access Token (permanent)</Label>
                <Input
                  type="password"
                  value={waAccessToken}
                  onChange={(e) => setWaAccessToken(e.target.value)}
                  placeholder="Token d'accès Meta..."
                  className="h-8 text-sm"
                />
              </div>
              <Button
                size="sm"
                onClick={handleConnectWhatsApp}
                disabled={waSaving || !waPhoneNumberId || !waAccessToken}
              >
                {waSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Connecter
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Instagram ───────────────────────────── */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <Instagram className="h-4 w-4 text-pink-600 dark:text-pink-400" />
              </div>
              <CardTitle className="text-base">Instagram</CardTitle>
            </div>
            {igChannel ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3.5 w-3.5" /> Connecté
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <XCircle className="h-3.5 w-3.5" /> Non connecté
              </span>
            )}
          </div>
          <CardDescription className="text-xs">
            Messages directs via Meta Graph API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {igChannel ? (
            <>
              <div className="text-sm text-muted-foreground">
                Compte:{" "}
                <span className="font-medium">{igChannel.name}</span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDisconnect(igChannel.id)}
              >
                Déconnecter
              </Button>
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                Connectez votre compte Instagram Business via Meta pour recevoir
                et répondre aux DMs.
              </p>
              <Button size="sm" asChild>
                <a href={`/api/auth/instagram?orgId=${orgId}`}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Connecter avec Meta
                </a>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Email ────────────────────────────────── */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-base">Email</CardTitle>
            </div>
            {emailChannel ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3.5 w-3.5" /> Connecté
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <XCircle className="h-3.5 w-3.5" /> Non connecté
              </span>
            )}
          </div>
          <CardDescription className="text-xs">
            IMAP/SMTP pour recevoir et envoyer des emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {emailChannel ? (
            <>
              <div className="text-sm text-muted-foreground">
                Adresse:{" "}
                <span className="font-medium">{emailChannel.provider_id}</span>
              </div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleDisconnect(emailChannel.id)}
              >
                Déconnecter
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Serveur IMAP (réception)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    className="col-span-2 h-8 text-sm"
                    placeholder="imap.gmail.com"
                    value={emailForm.imap_host}
                    onChange={(e) =>
                      setEmailForm((prev) => ({
                        ...prev,
                        imap_host: e.target.value,
                      }))
                    }
                  />
                  <Input
                    className="h-8 text-sm"
                    placeholder="993"
                    value={emailForm.imap_port}
                    onChange={(e) =>
                      setEmailForm((prev) => ({
                        ...prev,
                        imap_port: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Utilisateur</Label>
                  <Input
                    className="h-8 text-sm"
                    placeholder="user@domain.com"
                    value={emailForm.imap_user}
                    onChange={(e) =>
                      setEmailForm((prev) => ({
                        ...prev,
                        imap_user: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mot de passe</Label>
                  <Input
                    type="password"
                    className="h-8 text-sm"
                    value={emailForm.imap_pass}
                    onChange={(e) =>
                      setEmailForm((prev) => ({
                        ...prev,
                        imap_pass: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Serveur SMTP (envoi)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    className="col-span-2 h-8 text-sm"
                    placeholder="smtp.gmail.com"
                    value={emailForm.smtp_host}
                    onChange={(e) =>
                      setEmailForm((prev) => ({
                        ...prev,
                        smtp_host: e.target.value,
                      }))
                    }
                  />
                  <Input
                    className="h-8 text-sm"
                    placeholder="587"
                    value={emailForm.smtp_port}
                    onChange={(e) =>
                      setEmailForm((prev) => ({
                        ...prev,
                        smtp_port: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium">Expéditeur</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    className="h-8 text-sm"
                    placeholder="Nom affiché"
                    value={emailForm.from_name}
                    onChange={(e) =>
                      setEmailForm((prev) => ({
                        ...prev,
                        from_name: e.target.value,
                      }))
                    }
                  />
                  <Input
                    className="h-8 text-sm"
                    placeholder="email@domain.com"
                    value={emailForm.from_email}
                    onChange={(e) =>
                      setEmailForm((prev) => ({
                        ...prev,
                        from_email: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleConnectEmail}
                disabled={
                  emailSaving || !emailForm.imap_host || !emailForm.imap_user
                }
              >
                {emailSaving ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : null}
                Connecter
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
