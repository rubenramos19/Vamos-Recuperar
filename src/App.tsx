
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { IssueProvider } from "@/contexts/IssueContext";
import Index from "./pages/Index";
import Map from "./pages/Map";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Report from "./pages/Report";
import EditIssue from "./pages/EditIssue";
import IssuePage from "./pages/IssuePage";
import MyReports from "./pages/MyReports";
import Admin from "./pages/Admin";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Profile from "./pages/Profile";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PedirAjuda from "./pages/PedirAjuda";
import QueroAjudar from "./pages/QueroAjudar";



const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <IssueProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                 <Routes>
  <Route path="/" element={<Index />} />
  <Route path="/map" element={<Map />} />

  <Route path="/login" element={<Login />} />
  <Route path="/signup" element={<Signup />} />

  {/* Rotas privadas (precisa login) */}
  <Route
    path="/report"
    element={
      <ProtectedRoute>
        <Report />
      </ProtectedRoute>
    }
  />
  <Route
    path="/edit-issue/:id"
    element={
      <ProtectedRoute>
        <EditIssue />
      </ProtectedRoute>
    }
  />
  <Route
    path="/my-reports"
    element={
      <ProtectedRoute>
        <MyReports />
      </ProtectedRoute>
    }
  />
  <Route
    path="/admin"
    element={
      <ProtectedRoute>
        <Admin />
      </ProtectedRoute>
    }
  />
  <Route
    path="/profile"
    element={
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    }
  />
<Route
  path="/pedir-ajuda"
  element={
    <ProtectedRoute>
      <PedirAjuda />
    </ProtectedRoute>
  }
/>

<Route
  path="/quero-ajudar"
  element={
    <ProtectedRoute>
      <QueroAjudar />
    </ProtectedRoute>
  }
/>

  {/* Pública (se quiseres, podes deixar pública) */}
  <Route path="/issue/:id" element={<IssuePage />} />

  <Route path="/about" element={<About />} />
  <Route path="/privacy" element={<Privacy />} />
  <Route path="/terms" element={<Terms />} />
  <Route path="*" element={<NotFound />} />
</Routes>

                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </IssueProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
