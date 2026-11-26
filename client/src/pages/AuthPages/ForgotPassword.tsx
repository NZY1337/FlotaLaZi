import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ForgotPasswordForm from "../../components/auth/ForgotPasswordForm";

export default function ForgotPassword() {
    return (
        <>
            <PageMeta
                title="Am uitat parola - FlotaLaZi"
                description="Cere un link pentru resetarea parolei contului FlotaLaZi."
            />
            <AuthLayout>
                <ForgotPasswordForm />
            </AuthLayout>
        </>
    );
}
