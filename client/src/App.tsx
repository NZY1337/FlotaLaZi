import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/Dashboard/Home";
import Fleet from "./pages/Fleet/Fleet";
import Documents from "./pages/Documents/Documents";
import Drivers from "./pages/Drivers/Drivers";
import Finance from "./pages/Finance/Finance";
import Settings from "./pages/Settings/Settings";
import Admin from "./pages/Admin/Admin";
import Landing from "./components/Landing";
import Masina from "./components/Landing/Masina";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RedirectIfAuthenticated from "./components/common/RedirectIfAuthenticated";

export default function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<Landing />} />
                    <Route path="/masina" element={<Masina />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/dashboard" element={<Home />} />
                            <Route path="/fleet" element={<Fleet />} />
                            <Route path="/documents" element={<Documents />} />
                            <Route path="/drivers" element={<Drivers />} />
                            <Route path="/finance" element={<Finance />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/admin" element={<Admin />} />
                        </Route>
                    </Route>

                    <Route element={<RedirectIfAuthenticated />}>
                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                    </Route>

                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Router>
        </>
    );
}
