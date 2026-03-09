import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Scale, History, LogOut, Plus, FileSignature, MessageCircle, Briefcase, User, Calculator, LayoutDashboard, Menu } from "lucide-react";
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
  { path: "/peticao", label: "Petição", icon: FileSignature, primary: true },
  { path: "/chat", label: "Chat", icon: MessageCircle },
  { path: "/calculadoras", label: "Calculadoras", icon: Calculator },
  { path: "/painel-advogado", label: "Painel", icon: LayoutDashboard, lawyerOnly: true },
  { path: "/historico", label: "Histórico", icon: History },
];

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

  return (
    <header className="border-b bg-card sticky top-0 z-50">
      <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
        {/* Logo */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0"
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-primary">
            <Scale className="h-4 w-4 sm:h-5 sm:w-5 text-primary-foreground" />
          </div>
          <span className="text-base sm:text-lg font-bold font-serif text-foreground">JurisAI</span>
        </button>

        {/* Desktop Navigation (lg and up - 1024px+) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {/* Profile Badge */}
          {!loading && (
            <Badge 
              variant={isLawyer ? "default" : "secondary"} 
              className="flex items-center gap-1.5 mr-2"
            >
              {isLawyer ? (
                <>
                  <Briefcase className="h-3 w-3" />
                  <span>Advogado</span>
                </>
              ) : (
                <>
                  <User className="h-3 w-3" />
                  <span>Cidadão</span>
                </>
              )}
            </Badge>
          )}

          {filteredNavItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="mr-1.5 h-4 w-4" />
              {item.label}
            </Button>
          ))}

          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-1.5 h-4 w-4" />
            Sair
          </Button>
        </nav>

        {/* Tablet Navigation (md - 768px to 1023px) - Only primary items */}
        <nav className="hidden md:flex lg:hidden items-center gap-1">
          {/* Profile Badge */}
          {!loading && (
            <Badge 
              variant={isLawyer ? "default" : "secondary"} 
              className="flex items-center gap-1 text-xs mr-1"
            >
              {isLawyer ? <Briefcase className="h-3 w-3" /> : <User className="h-3 w-3" />}
            </Badge>
          )}

          {primaryItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="mr-1.5 h-4 w-4" />
              {item.label}
            </Button>
          ))}

          {/* More menu for secondary items */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-4 w-4 mr-1.5" />
                Mais
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Scale className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-serif">JurisAI</span>
                </SheetTitle>
              </SheetHeader>

              {!loading && (
                <div className="mt-4 flex items-center gap-2 px-1">
                  <Badge 
                    variant={isLawyer ? "default" : "secondary"} 
                    className="flex items-center gap-1.5"
                  >
                    {isLawyer ? (
                      <>
                        <Briefcase className="h-3 w-3" />
                        <span>Advogado</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" />
                        <span>Cidadão</span>
                      </>
                    )}
                  </Badge>
                </div>
              )}

              <nav className="mt-6 flex flex-col gap-1">
                <div className="text-xs font-semibold text-muted-foreground px-2 mb-2">FERRAMENTAS</div>
                {secondaryItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={location.pathname === item.path ? "default" : "ghost"}
                    className="justify-start h-11"
                    onClick={() => handleNavigate(item.path)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                ))}
                
                <Separator className="my-2" />
                
                <Button 
                  variant="ghost" 
                  className="justify-start h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    signOut();
                    setSheetOpen(false);
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sair
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </nav>

        {/* Mobile Navigation - Full Burger Menu (< 768px) */}
        <div className="flex md:hidden items-center gap-2">
          {!loading && (
            <Badge 
              variant={isLawyer ? "default" : "secondary"} 
              className="flex items-center gap-1 text-xs"
            >
              {isLawyer ? <Briefcase className="h-3 w-3" /> : <User className="h-3 w-3" />}
            </Badge>
          )}

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Abrir menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 sm:w-80">
              <SheetHeader className="text-left">
                <SheetTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                    <Scale className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="font-serif">JurisAI</span>
                </SheetTitle>
              </SheetHeader>
              
              {!loading && (
                <div className="mt-4 flex items-center gap-2 px-1">
                  <Badge 
                    variant={isLawyer ? "default" : "secondary"} 
                    className="flex items-center gap-1.5"
                  >
                    {isLawyer ? (
                      <>
                        <Briefcase className="h-3 w-3" />
                        <span>Advogado</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" />
                        <span>Cidadão</span>
                      </>
                    )}
                  </Badge>
                </div>
              )}

              <nav className="mt-6 flex flex-col gap-1">
                <div className="text-xs font-semibold text-muted-foreground px-2 mb-2">PRINCIPAIS</div>
                {primaryItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={location.pathname === item.path ? "default" : "ghost"}
                    className="justify-start h-11"
                    onClick={() => handleNavigate(item.path)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                ))}

                <div className="text-xs font-semibold text-muted-foreground px-2 mb-2 mt-4">FERRAMENTAS</div>
                {secondaryItems.map((item) => (
                  <Button
                    key={item.path}
                    variant={location.pathname === item.path ? "default" : "ghost"}
                    className="justify-start h-11"
                    onClick={() => handleNavigate(item.path)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Button>
                ))}
                
                <Separator className="my-2" />
                
                <Button 
                  variant="ghost" 
                  className="justify-start h-11 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    signOut();
                    setSheetOpen(false);
                  }}
                >
                  <LogOut className="mr-3 h-5 w-5" />
                  Sair
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
