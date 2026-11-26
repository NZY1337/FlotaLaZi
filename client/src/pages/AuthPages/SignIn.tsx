import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
    return (
        <>
            <PageMeta
                title="Intră în cont - FlotaLaZi"
                description="Intră în contul tău FlotaLaZi: acte, alerte și profit pentru flota ta."
            />
            <AuthLayout>
                <SignInForm />
            </AuthLayout>
        </>
    );
}
