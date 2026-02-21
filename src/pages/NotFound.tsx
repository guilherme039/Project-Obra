import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-destructive/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 text-center space-y-6 max-w-lg animate-in fade-in zoom-in-95 duration-500">

        <div className="flex justify-center mb-8 relative">
          <h1 className="text-[12rem] font-black text-white/5 leading-none select-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            404
          </h1>
          <div className="relative z-10 bg-white/5 p-6 rounded-full border border-white/10 backdrop-blur-sm shadow-2xl">
            <AlertCircle className="h-12 w-12 text-white/80" />
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <h2 className="text-3xl font-bold text-white">Página não encontrada</h2>
          <p className="text-muted-foreground text-lg">
            Desculpe, não conseguimos encontrar a página que você está procurando.
          </p>
        </div>

        <div className="pt-4 relative z-10">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Início
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
