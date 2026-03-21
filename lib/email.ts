import { Resend } from 'resend';
import type { NotificationType } from '@/app/actions/notifications';

// Lazy-initialize to avoid "Missing API key" error during Next.js static build phase
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? 're_placeholder');
  }
  return _resend;
}

const FROM = 'notifications@oc.rjmediastudios.com';
const APP_URL = 'https://agency-pm-tool.vercel.app';

// Map notification type to a CTA button label
function ctaLabel(type: NotificationType): string {
  if (type.startsWith('task') || type === 'approval_requested' || type === 'approval_decision' || type === 'dependency_unblocked' || type === 'recurring_task_created' || type === 'milestone_reached' || type === 'adhoc_request') {
    return 'View Task';
  }
  if (type.startsWith('document') || type === 'asset_uploaded') {
    return 'View Document';
  }
  if (type.startsWith('initiative') || type === 'kpi_target_hit' || type === 'strategy_published' || type === 'new_task_on_client') {
    return 'View Initiative';
  }
  if (type === 'team_member_added') {
    return 'View Team';
  }
  return 'Open App';
}

function buildHtml(options: {
  logoUrl: string;
  agencyName: string;
  title: string;
  message: string;
  ctaText: string;
  ctaHref: string;
}): string {
  const { logoUrl, agencyName, title, message, ctaText, ctaHref } = options;

  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${agencyName}" style="max-height:48px;max-width:200px;object-fit:contain;" />`
    : `<span style="font-size:22px;font-weight:700;color:#111827;">${agencyName}</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F3F4F6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background-color:#ffffff;border-radius:12px 12px 0 0;padding:28px 40px;border-bottom:1px solid #E5E7EB;">
              ${logoBlock}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:36px 40px;">
              <h1 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">${title}</h1>
              <p style="margin:0 0 28px 0;font-size:15px;color:#374151;line-height:1.6;">${message}</p>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="border-radius:8px;background-color:#4F46E5;">
                    <a href="${ctaHref}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.01em;">${ctaText}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#F9FAFB;border-radius:0 0 12px 12px;padding:20px 40px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;font-size:12px;color:#9CA3AF;line-height:1.5;">
                You received this because you&apos;re a team member at ${agencyName}.
                <a href="${APP_URL}/settings" style="color:#6B7280;text-decoration:underline;">Manage notification preferences</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendNotificationEmail(
  to: string,
  subject: string,
  type: NotificationType,
  title: string,
  message: string,
  link: string | null,
  logoUrl?: string,
  agencyName?: string
): Promise<void> {
  try {
    const resolvedLogo = logoUrl ?? '';
    const resolvedAgency = agencyName ?? 'RJ Media';
    const href = link ? `${APP_URL}${link}` : APP_URL;
    const cta = ctaLabel(type);

    const html = buildHtml({
      logoUrl: resolvedLogo,
      agencyName: resolvedAgency,
      title,
      message,
      ctaText: cta,
      ctaHref: href,
    });

    await getResend().emails.send({
      from: FROM,
      to,
      cc: 'joe@rjmediastudios.com', // TEST: CC Joe on all notifications during testing phase
      subject,
      html,
    });
  } catch (err) {
    // Best-effort: never let email errors break the notification flow
    console.error('[email] sendNotificationEmail error:', err);
  }
}
