import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  History, LogOut, Plus, FileSignature, MessageCircle, Briefcase, User, Calculator,
  LayoutDashboard, Menu, Stethoscope, Scale, Crown, FileText, ChevronDown, Wrench,
} from "lucide-react";
import Logo from "@/components/Logo";
import { UsageSummaryCompact } from "@/components/UsageSummary";
import { TrialBanner } from "@/components/TrialBanner";

import { useNavigate, useLocation } from "react-router-dom";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  lawyerOnly?: boolean;
}

const primaryNav: NavItem[] = [
  { path: "/", label: "Análise", icon: Plus },
  { path: "/diagnostico", label: "Diagnóstico", icon: Stethoscope },
  { path: "/peticao", label: "Petição", icon: FileSignature },
  { path: "/jurisprudencia", label: "Jurisprudência", icon: Scale },
];

const toolsNav: NavItem[] = [
  { path: "/chat", label: "Chat Jurídico", icon: MessageCircle },
  { path: "/calculadoras", label: "Calculadoras", icon: Calculator },
  { path: "/modelos-de-minutas", label: "Modelos de Minutas", icon: FileText },
  { path: "/painel-advogado", label: "Painel do Advogado", icon: LayoutDashboard, lawyerOnly: true },
];

const accountNav: NavItem[] = [
  { path: "/conta", label: "Minha Conta", icon: User },
  { path: "/historico", label: "Histórico", icon: History },
  { path: "/planos", label: "Planos", icon: Crown },
];

function NavButton({ item, active, onClick, compact }: { item: NavItem; active: boolean; onClick: () => void; compact?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={compact ? item.label : undefined}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
      }`}
    >
      <item.icon className="h-4 w-4" />
      {!compact && item.label}
    </button>
  );
}

export function AppHeader() {
  const { signOut, user } = useAuth();
  const { isLawyer, loading } = useUserProfile();

  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const visible = (items: NavItem[]) => items.filter((i) => !i.lawyerOnly || isLawyer);
  const tools = visible(toolsNav);
  const isActive = (path: string) => location.pathname === path;
  const groupActive = (items: NavItem[]) => items.some((i) => isActive(i.path));

  const handleNavigate = (path: string) => {
    navigate(path);
    setSheetOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setSheetOpen(false);
    navigate("/auth");
  };

  const profileBadge = (variant: "small" | "full" = "full") => {
    if (loading || !user) return null;

    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isLawyer ? "bg-gold/20 text-gold-light" : "bg-white/10 text-white/70"
      }`}>
        {isLawyer ? <Briefcase className="h-3 w-3" /> : <User className="h-3 w-3" />}
        {variant === "full" && <span>{isLawyer ? "Advogado" : "Cidadão"}</span>}
      </span>
    );
  };

  const dropdownContent = "w-56 bg-navy border border-gold/20 text-white/80";
  const dropdownItem = "gap-2 text-white/70 focus:bg-white/10 focus:text-white cursor-pointer";

  const toolsMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            groupActive(tools) ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <Wrench className="h-4 w-4" />
          Ferramentas
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={dropdownContent}>
        {tools.map((item) => (
          <DropdownMenuItem key={item.path} className={dropdownItem} onClick={() => navigate(item.path)}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const accountMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`inline-flex items-center gap-1.5 h-9 px-2 rounded-md transition-colors ${
            groupActive(accountNav) ? "bg-white/10" : "hover:bg-white/5"
          }`}
          aria-label="Menu da conta"
        >
          <span className={`h-7 w-7 inline-flex items-center justify-center rounded-full ${
            isLawyer ? "bg-gold/20 text-gold-light" : "bg-white/10 text-white/70"
          }`}>
            {isLawyer ? <Briefcase className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-white/50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={dropdownContent}>
        <div className="px-2 py-2">{profileBadge("full")}</div>
        <DropdownMenuSeparator className="bg-white/10" />
        <UsageSummaryCompact />
        <DropdownMenuSeparator className="bg-white/10" />
        {accountNav.map((item) => (

          <DropdownMenuItem key={item.path} className={dropdownItem} onClick={() => navigate(item.path)}>
            <item.icon className="h-4 w-4" />
            {item.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem className="gap-2 text-red-400/90 focus:bg-white/10 focus:text-red-400 cursor-pointer" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const guestActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigate("/auth")}
        className="px-3 py-1.5 rounded-md text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-colors"
      >
        Entrar
      </button>
      <button
        onClick={() => navigate("/auth?mode=signup")}
        className="px-3 py-1.5 rounded-md text-sm font-semibold bg-gold text-navy hover:bg-gold-light transition-colors"
      >
        Criar conta grátis
      </button>
    </div>


  const sheetSection = (items: NavItem[], label: string) => (
    <>
      <div className="text-xs font-semibold text-white/40 px-2 mb-2 tracking-wider">{label}</div>
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            isActive(item.path) ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </button>
      ))}
    </>
  );

  return (
    <>
    <header className="sticky top-0 z-50 bg-navy border-b border-gold/20">

      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        <button onClick={() => navigate("/")} className="flex items-center flex-shrink-0">
          <Logo className="h-8 sm:h-9" />
        </button>

        {/* Desktop (lg+) */}
        <nav className="hidden lg:flex items-center gap-1">
          {primaryNav.map((item) => (
            <NavButton key={item.path} item={item} active={isActive(item.path)} onClick={() => navigate(item.path)} />
          ))}
          {toolsMenu}
          <div className="w-px h-6 bg-white/10 mx-1" />
          {accountMenu}
        </nav>

        {/* Tablet (md–lg): ícones sem rótulo */}
        <nav className="hidden md:flex lg:hidden items-center gap-1">
          {primaryNav.map((item) => (
            <NavButton key={item.path} item={item} active={isActive(item.path)} onClick={() => navigate(item.path)} compact />
          ))}
          {toolsMenu}
          <div className="w-px h-6 bg-white/10 mx-1" />
          {accountMenu}
        </nav>

        {/* Mobile (<768px) */}
        <div className="flex md:hidden items-center gap-2">
          {profileBadge("small")}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="h-9 w-9 inline-flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:w-80 bg-navy border-l border-gold/20 p-6 overflow-y-auto">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center text-white">
                  <Logo className="h-8" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4">{profileBadge("full")}</div>
              <div className="mt-3 rounded-md bg-white/5">
                <UsageSummaryCompact onNavigate={() => setSheetOpen(false)} />
              </div>

              <nav className="mt-6 flex flex-col gap-1">
                {sheetSection(primaryNav, "PRINCIPAIS")}
                <div className="mt-4" />
                {sheetSection(tools, "FERRAMENTAS")}
                <div className="mt-4" />
                {sheetSection(accountNav, "CONTA")}
                <div className="h-px bg-white/10 my-3" />
                <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-white/5 transition-colors">
                  <LogOut className="h-5 w-5" />
                  Sair
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
    <TrialBanner />
    </>
  );

}
