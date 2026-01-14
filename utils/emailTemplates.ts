const emailWrapper = (content: string, title: string) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 20px; }
  .container { background-color: #ffffff; max-width: 600px; margin: auto; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .header { color: #8B5CF6; font-size: 24px; font-weight: bold; text-align: center; margin-bottom: 20px; }
  p { color: #333; line-height: 1.6; }
  .button { display: inline-block; background-color: #8B5CF6; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; text-align: center; }
  .footer { margin-top: 20px; text-align: center; font-size: 12px; color: #777; }
</style>
</head>
<body>
  <div class="container">
    <div class="header">ARRIIVAL Inventory System</div>
    <h2>${title}</h2>
    ${content}
    <p>If you did not request this, please ignore this email.</p>
    <div class="footer">
      This is an automated message. Please do not reply.
    </div>
  </div>
</body>
</html>
`;

export const getInvitationEmailHtml = (invitationLink: string, orgName: string): string => {
    const title = `You're Invited to Join ${orgName}`;
    const content = `
        <p>You have been invited to join <strong>${orgName}</strong> on the ARRIIVAL Inventory System.</p>
        <p>Please click the button below to set up your account and get started.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="${invitationLink}" class="button">Set Up Account</a>
        </p>
        <p>If you're having trouble with the button, you can copy and paste this link into your browser:</p>
        <p><a href="${invitationLink}">${invitationLink}</a></p>
    `;
    return emailWrapper(content, title);
};


export const getPasswordResetEmailHtml = (resetLink: string): string => {
    const title = 'Reset Your Password';
    const content = `
        <p>We received a request to reset your password for your ARRIIVAL account.</p>
        <p>Please click the button below to choose a new password. This link is valid for 1 hour.</p>
        <p style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" class="button">Reset Password</a>
        </p>
        <p>If you're having trouble with the button, you can copy and paste this link into your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
    `;
    return emailWrapper(content, title);
};
