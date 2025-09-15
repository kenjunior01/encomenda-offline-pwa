import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { VendorDashboard } from '@/pages/VendorDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { SEO } from '@/components/SEO';

const Index = () => {
  const { profile, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !profile) {
      navigate('/auth');
    }
  }, [profile, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      <SEO 
        title="Sistema de Encomendas PWA" 
        description="Sistema completo de gestão de encomendas com controle por departamentos e armazéns." 
      />
      {profile.role === 'admin' || profile.role === 'supervisor' ? (
        <AdminDashboard />
      ) : (
        <VendorDashboard />
      )}
    </>
  );
};

export default Index;
