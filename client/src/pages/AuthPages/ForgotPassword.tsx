import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

export default function ForgotPassword() {
    return (
        <>
            <PageMeta
                title="Forgot Password | FlotaLaZi"
                description="Request a password reset link for your FlotaLaZi account"
            />
            <AuthLayout>
                <ForgotPasswordForm />
            </AuthLayout>
        </>
    );
}
