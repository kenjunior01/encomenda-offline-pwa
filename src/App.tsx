import React, { useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/LoginForm';
import { VendorDashboard } from '@/pages/VendorDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { NewOrder } from '@/pages/NewOrder';
import { OrderHistory } from '@/pages/OrderHistory';
import { initializeDefaultData } from '@/lib/database';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          user.role === 'admin' ? <AdminDashboard /> : <VendorDashboard />
        } 
      />
      <Route path="/nova-encomenda/:department" element={<NewOrder />} />
      <Route path="/historico" element={<OrderHistory />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  useEffect(() => {
    // Inicializar dados padrão na primeira execução
    initializeDefaultData().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
