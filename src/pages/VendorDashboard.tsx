import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { DepartmentCard } from '@/components/DepartmentCard';
import { InstallPrompt } from '@/components/InstallPrompt';
import { DepartmentType } from '@/utils/departmentThemes';
import { Plus, LogOut, History, Smartphone } from 'lucide-react';
import { SEO } from '@/components/SEO';

export const VendorDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const departments: DepartmentType[] = ['eletrodomesticos', 'alimentacao', 'cosmeticos'];

  useEffect(() => {
    // Mostrar prompt de instalação apenas uma vez por sessão
    const hasShownPrompt = sessionStorage.getItem('hasShownInstallPrompt');
    if (!hasShownPrompt && 'serviceWorker' in navigator) {
      setShowInstallPrompt(true);
      sessionStorage.setItem('hasShownInstallPrompt', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-background p-4">
      <SEO title="Dashboard do Vendedor | Encomendas PWA" description="Inicie novas encomendas e acesse seu histórico." />
      <div className="max-w-6xl mx-auto">
        {/* Prompt de Instalação Mobile */}
        {showInstallPrompt && (
          <div className="mb-6">
            <InstallPrompt onClose={() => setShowInstallPrompt(false)} />
          </div>
        )}

        {/* Header */}
        <Card className="mb-6 animate-fade-in">
          <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-2xl">
                    Olá, {profile?.name}! 👋
                  </CardTitle>
                  <p className="text-muted-foreground">
                    Bem-vindo ao sistema de encomendas
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowInstallPrompt(true)}
                    className="flex items-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span className="hidden sm:inline">Instalar App</span>
                    <span className="sm:hidden">App Mobile</span>
                  </Button>
                  <Button variant="outline" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
          </CardHeader>
        </Card>

        {/* Menu Principal */}
        <div className="grid gap-6">
          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nova Encomenda
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Selecione o departamento para iniciar uma nova encomenda:
              </p>
              <div className="grid md:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <DepartmentCard
                    key={dept}
                    department={dept}
                    onClick={() => {
                      // Navegar diretamente para nova encomenda
                      window.location.href = `/nova-encomenda/${dept}`;
                    }}
                    isSelected={false}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Minhas Encomendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Visualize o histórico das suas encomendas registradas
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  window.location.href = '/historico';
                }}
              >
                Ver Histórico
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};