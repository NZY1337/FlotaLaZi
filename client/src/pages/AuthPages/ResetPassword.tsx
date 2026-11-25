import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

export default function ResetPassword() {
    return (
        <>
            <PageMeta
                title="Reset Password | FlotaLaZi"
                description="Set a new password for your FlotaLaZi account"
            />
            <AuthLayout>
                <ResetPasswordForm />
            </AuthLayout>
        </>
    );
}
