import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";

export default function SignUp() {
  return (
    <>
      <PageMeta
        title="Creează cont gratuit - FlotaLaZi"
        description="Cont gratuit FlotaLaZi: alerte pentru ITP, RCA, rovinietă, tahograf și actele șoferilor."
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
