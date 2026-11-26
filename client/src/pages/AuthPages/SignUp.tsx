import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../components/auth/SignUpForm";
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { rememberPersonalSignup } from "../../hooks/useSettings";

export default function SignUp() {
  // /masina links here with ?tip=personal: the dashboard applies it after sign-up.
  const [params] = useSearchParams();
  useEffect(() => {
    if (params.get("tip") === "personal") rememberPersonalSignup();
  }, [params]);

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
