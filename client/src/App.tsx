import { BrowserRouter as Router, Routes, Route } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import ForgotPassword from "./pages/AuthPages/ForgotPassword";
import ResetPassword from "./pages/AuthPages/ResetPassword";
import NotFound from "./pages/OtherPage/NotFound";
import AppLayout from "./layout/AppLayout";
import Home from "./pages/Dashboard/Home";
import Services from "./pages/Dashboard/Services/Services";
import ServiceDetail from "./pages/Dashboard/Services/ServiceDetail";
import Homepage from "./components/Homepage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RedirectIfAuthenticated from "./components/common/RedirectIfAuthenticated";

export default function App() {
    return (
        <>
            <Router>
                <Routes>
                    <Route path="/" element={<Homepage />} />

                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>
                            <Route path="/dashboard" element={<Home />} />
                            <Route path="/services" element={<Services />} />
                            <Route path="/services/:slug" element={<ServiceDetail />} />
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
