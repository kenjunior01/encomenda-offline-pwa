import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { DepartmentCard } from '@/components/DepartmentCard';
import { DepartmentType } from '@/utils/departmentThemes';
import { Plus, LogOut, History } from 'lucide-react';

export const VendorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentType | null>(null);

  const departments: DepartmentType[] = ['eletrodomesticos', 'alimentacao', 'cosmeticos'];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl">
                  Olá, {user?.username}! 👋
                </CardTitle>
                <p className="text-muted-foreground">
                  Bem-vindo ao sistema de encomendas
                </p>
              </div>
              <Button variant="outline" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Menu Principal */}
        <div className="grid gap-6">
          <Card>
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
                    onClick={() => setSelectedDepartment(dept)}
                    isSelected={selectedDepartment === dept}
                  />
                ))}
              </div>
              
              {selectedDepartment && (
                <div className="mt-6 flex justify-center">
                  <Button 
                    size="lg"
                    onClick={() => {
                      // Navegar para página de nova encomenda
                      window.location.href = `/nova-encomenda/${selectedDepartment}`;
                    }}
                  >
                    Criar Encomenda - {selectedDepartment}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
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