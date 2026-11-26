import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";

export default function ResetPassword() {
    return (
        <>
            <PageMeta
                title="Parolă nouă - FlotaLaZi"
                description="Alege o parolă nouă pentru contul FlotaLaZi."
            />
            <AuthLayout>
                <ResetPasswordForm />
            </AuthLayout>
        </>
    );
}
