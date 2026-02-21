import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Truck,
  DollarSign,
  Users,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navItems = [
  { to: "/obras", label: "Obras", icon: Building2 },
  { to: "/cotacoes", label: "Cotações", icon: FileText },
  { to: "/fornecedores", label: "Fornecedores", icon: Truck },
  { to: "/financeiro", label: "Financeiro", icon: DollarSign },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/controle", label: "Controle", icon: ShieldCheck },
  { to: "/documentos", label: "Documentos", icon: FileText },
  { to: "/gestao", label: "Gestão", icon: Settings },
  { to: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

export default function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="border-b border-white/10 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-8">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-xl tracking-tight">
              LucasBg company
            </span>
            <span className="text-[10px] text-muted-foreground align-top -mt-2">®</span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button className="text-muted-foreground hover:text-white transition-colors">
            <HelpCircle className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="h-8 w-8 bg-primary/20 hover:bg-primary/30 transition-colors cursor-pointer border border-primary/20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-primary font-bold bg-transparent">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-muted-foreground font-normal">{user?.name || "Usuário"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
