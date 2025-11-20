import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Conexão restaurada! 🌐', {
        description: 'Você está online novamente',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Modo Offline 📡', {
        description: 'Você está trabalhando offline. Dados serão sincronizados quando voltar online.',
        duration: 5000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <Badge variant="outline" className="bg-background border-2 border-warning py-2 px-4 shadow-lg">
        <WifiOff className="h-4 w-4 mr-2 text-warning" />
        <span className="font-medium">Modo Offline</span>
      </Badge>
    </div>
  );
};
