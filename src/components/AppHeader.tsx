import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { History, LogOut, Plus, FileSignature, MessageCircle, Briefcase, User, Calculator, LayoutDashboard, Menu, Stethoscope, Scale } from "lucide-react";
import logoImg from "@/assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  lawyerOnly?: boolean;
  primary?: boolean;
}

const navItems: NavItem[] = [
  { path: "/", label: "Análise", icon: Plus, primary: true },
  { path: "/diagnostico", label: "Diagnóstico", icon: Stethoscope, primary: true },
  { path: "/peticao", label: "Petição", icon: FileSignature, primary: true },
  { path: "/chat", label: "Chat", icon: MessageCircle },
  { path: "/calculadoras", label: "Calculadoras", icon: Calculator },
  { path: "/painel-advogado", label: "Painel", icon: LayoutDashboard, lawyerOnly: true },
  { path: "/historico", label: "Histórico", icon: History },
];

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-white/10 text-white"
          : "text-white/60 hover:text-white hover:bg-white/5"
      }`}
    >
      <item.icon className="h-4 w-4" />
      {item.label}
    </button>
  );
}

export function AppHeader() {
  const { signOut } = useAuth();
  const { profile, isLawyer, loading } = useUserProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filteredNavItems = navItems.filter(item => !item.lawyerOnly || isLawyer);
  const primaryItems = filteredNavItems.filter(item => item.primary);
  const secondaryItems = filteredNavItems.filter(item => !item.primary);

  const handleNavigate = (path: string) => {
    navigate(path);
    setSheetOpen(false);
  };

  const profileBadge = (variant: "small" | "full" = "full") => {
    if (loading) return null;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isLawyer ? "bg-gold/20 text-gold-light" : "bg-white/10 text-white/70"
      }`}>
        {isLawyer ? <Briefcase className="h-3 w-3" /> : <User className="h-3 w-3" />}
        {variant === "full" && <span>{isLawyer ? "Advogado" : "Cidadão"}</span>}
      </span>
    );
  };

  const sheetNav = (items: NavItem[], label: string) => (
    <>
      <div className="text-xs font-semibold text-white/40 px-2 mb-2 tracking-wider">{label}</div>
      {items.map((item) => (
        <button
          key={item.path}
          onClick={() => handleNavigate(item.path)}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
            location.pathname === item.path
              ? "bg-white/10 text-white"
              : "text-white/60 hover:text-white hover:bg-white/5"
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </button>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 bg-navy border-b border-gold/20">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gold">
            <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-navy" />
          </div>
          <span className="text-base sm:text-lg font-bold font-serif text-white">
            Juris<span className="text-gold">AI</span>
          </span>
        </button>

        {/* Desktop Navigation (lg+) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {profileBadge("full")}
          <div className="w-px h-6 bg-white/10 mx-1" />
          {filteredNavItems.map((item) => (
            <NavButton
              key={item.path}
              item={item}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
          <div className="w-px h-6 bg-white/10 mx-1" />
          <button
            onClick={signOut}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white/40 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </nav>

        {/* Tablet Navigation (md to lg) */}
        <nav className="hidden md:flex lg:hidden items-center gap-1">
          {profileBadge("small")}
          {primaryItems.map((item) => (
            <NavButton
              key={item.path}
              item={item}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
                <Menu className="h-4 w-4" />
                Mais
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 bg-navy border-l border-gold/20 p-6">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2 text-white">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold">
                    <Scale className="h-4 w-4 text-navy" />
                  </div>
                  <span className="font-serif">Juris<span className="text-gold">AI</span></span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4">{profileBadge("full")}</div>
              <nav className="mt-6 flex flex-col gap-1">
                {sheetNav(secondaryItems, "FERRAMENTAS")}
                <div className="h-px bg-white/10 my-3" />
                <button
                  onClick={() => { signOut(); setSheetOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-white/5 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </nav>

        {/* Mobile Navigation (<768px) */}
        <div className="flex md:hidden items-center gap-2">
          {profileBadge("small")}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button className="h-9 w-9 inline-flex items-center justify-center rounded-md text-white/70 hover:text-white hover:bg-white/5 transition-colors">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:w-80 bg-navy border-l border-gold/20 p-6">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2 text-white">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold">
                    <Scale className="h-4 w-4 text-navy" />
                  </div>
                  <span className="font-serif">Juris<span className="text-gold">AI</span></span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4">{profileBadge("full")}</div>
              <nav className="mt-6 flex flex-col gap-1">
                {sheetNav(primaryItems, "PRINCIPAIS")}
                <div className="mt-4" />
                {sheetNav(secondaryItems, "FERRAMENTAS")}
                <div className="h-px bg-white/10 my-3" />
                <button
                  onClick={() => { signOut(); setSheetOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-white/5 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  Sair
                </button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
