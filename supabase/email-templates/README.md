# Supabase Auth email templates (Romanian)

Supabase sends the account emails itself (confirm sign-up, reset password,
change email) through Resend's SMTP (`cont@flotalazi.ro`, set up with Resend's
Supabase integration). These files are the Romanian text for them. They are
**not deployed automatically**: paste each one into Supabase →
**Authentication → Emails → Templates**, with its subject:

| Template in Supabase | File | Subject |
|---|---|---|
| Confirm signup | `confirm-signup.html` | Confirmă-ți contul FlotaLaZi |
| Reset password | `reset-password.html` | Alege o parolă nouă pentru FlotaLaZi |
| Change email address | `change-email.html` | Confirmă noua adresă de email |

`{{ .ConfirmationURL }}`, `{{ .Email }}` and `{{ .NewEmail }}` are filled in by
Supabase. Keep the HTML simple (no images, inline styles): it reads well in
every mail client and looks less like spam. If you change a template in
Supabase, update the file here too.
