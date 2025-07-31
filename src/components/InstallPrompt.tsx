import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Download, Share, Plus, X } from 'lucide-react';

interface InstallPromptProps {
  onClose: () => void;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detectar iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listener para evento de instalação PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onClose();
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Instalar no Celular</CardTitle>
            <Badge variant="secondary" className="text-xs">PWA</Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Use como um app nativo! 100% offline, rápido e prático.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Android/Chrome */}
        {deferredPrompt && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Download className="h-4 w-4" />
              Instalação Automática
            </h4>
            <Button onClick={handleInstallClick} className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Instalar App
            </Button>
          </div>
        )}

        {/* iOS Safari */}
        {isIOS && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Share className="h-4 w-4" />
              Para iPhone/iPad
            </h4>
            <div className="space-y-2 text-sm bg-muted p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">1</span>
                <span>Toque no botão <Share className="h-3 w-3 inline mx-1" /> "Compartilhar" do Safari</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">2</span>
                <span>Selecione <Plus className="h-3 w-3 inline mx-1" /> "Adicionar à Tela de Início"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">3</span>
                <span>Confirme tocando em "Adicionar"</span>
              </div>
            </div>
          </div>
        )}

        {/* Android/Chrome manual */}
        {!deferredPrompt && !isIOS && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Para Android
            </h4>
            <div className="space-y-2 text-sm bg-muted p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">1</span>
                <span>Abra o menu do Chrome (⋮)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">2</span>
                <span>Toque em "Instalar app" ou "Adicionar à tela inicial"</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-primary text-primary-foreground rounded px-1.5 py-0.5 text-xs">3</span>
                <span>Confirme a instalação</span>
              </div>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <h5 className="font-medium text-sm mb-2">🚀 Vantagens do App:</h5>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Funciona sem internet (100% offline)</li>
            <li>• Ícone na tela inicial</li>
            <li>• Carregamento ultrarrápido</li>
            <li>• Interface otimizada para touch</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};