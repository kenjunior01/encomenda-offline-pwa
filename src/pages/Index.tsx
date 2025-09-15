import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { VendorDashboard } from '@/pages/VendorDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { SEO } from '@/components/SEO';

const Index = () => {
  const { profile } = useAuth();

  // This component is only rendered when user is authenticated (handled by App.tsx routing)
  return (
    <>
      <SEO 
        title="Sistema de Encomendas PWA" 
        description="Sistema completo de gestão de encomendas com controle por departamentos e armazéns." 
      />
      {profile?.role === 'admin' || profile?.role === 'supervisor' ? (
        <AdminDashboard />
      ) : (
        <VendorDashboard />
      )}
    </>
  );
};

export default Index;
