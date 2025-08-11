import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { SEO } from '@/components/SEO';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <SEO title="Página não encontrada | Encomendas PWA" description="A página solicitada não foi encontrada." />
      <div className="text-center animate-fade-in">
        <h1 className="text-5xl font-bold mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-6">Oops! Página não encontrada</p>
        <Button asChild>
          <a href="/">Voltar para o início</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
