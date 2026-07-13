import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Brain,
  MessageCircle,
  BookOpen,
  Users,
  Home,
  Menu,
  X,
  LogOut,
  User,
  Calendar,
  MoreHorizontal,
  BarChart3,
  Edit3,
} from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const saved = localStorage.getItem("app_lang");
    if (saved && saved !== i18n.language) {
      i18n.changeLanguage(saved);
    }
  }, [i18n]);

  const handleSignOut = () => {
    navigate("/sign-out");
  };

  const navItems = [
    {
      id: "dashboard",
      label: t("nav.dashboard"),
      icon: Home,
      path: "/dashboard",
    },
    { id: "chat", label: t("nav.chat"), icon: Brain, path: "/chat" },
    { id: "journal", label: t("nav.journal"), icon: Edit3, path: "/journal" },
    {
      id: "assessment",
      label: t("nav.assessment"),
      icon: BarChart3,
      path: "/assessment",
    },
    {
      id: "booking",
      label: t("nav.booking"),
      icon: Calendar,
      path: "/booking",
    },
    {
      id: "resources",
      label: t("nav.resources"),
      icon: BookOpen,
      path: "/resources",
    },
    {
      id: "community",
      label: t("nav.community"),
      icon: Users,
      path: "/community",
    },
    {
      id: "medicine",
      label: t("nav.medicine"),
      icon: MessageCircle,
      path: "/medicine",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-xl p-2">
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => {
                      i18n.changeLanguage("en");
                      localStorage.setItem("app_lang", "en");
                    }}
                  >
                    {t("lang.english")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      i18n.changeLanguage("hi");
                      localStorage.setItem("app_lang", "hi");
                    }}
                  >
                    {t("lang.hindi")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      i18n.changeLanguage("or");
                      localStorage.setItem("app_lang", "or");
                    }}
                  >
                    {t("lang.odia")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      i18n.changeLanguage("ks");
                      localStorage.setItem("app_lang", "ks");
                    }}
                  >
                    {t("lang.kashmiri")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {t("app.name")}
              </span>
            </div>

            <div className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="sm"
                    onClick={() => navigate(item.path)}
                    className="left justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 flex items-center space-x-2 px-4 py-2 rounded-xl"
                  >
                    {item.id === "medicine" ? (
                      <DotLottieReact
                        src="/animation/activity.json"
                        loop
                        autoplay
                        style={{ width: "16px", height: "16px" }}
                      />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl flex items-center space-x-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={user?.fullName || "User"}
                    />
                    <AvatarFallback>
                      {user?.firstName?.charAt(0) ||
                        user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:block">
                    {user?.firstName || "User"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-md border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">
              Manas Svasthya
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-card border-b border-border shadow-lg">
            <div className="p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant={isActive(item.path) ? "default" : "ghost"}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className="left justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 w-full justify-start space-x-2 rounded-xl"
                  >
                    {item.id === "medicine" ? (
                      <DotLottieReact
                        src="/animation/activity.json"
                        loop
                        autoplay
                        style={{ width: "16px", height: "16px" }}
                      />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <span>{item.label}</span>
                  </Button>
                );
              })}
              <div className="pt-2 mt-2 border-t border-border space-y-2">
                <div className="flex items-center space-x-3 p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={user?.fullName || "User"}
                    />
                    <AvatarFallback>
                      {user?.firstName?.charAt(0) ||
                        user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
                        "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user?.fullName || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user?.emailAddresses[0]?.emailAddress}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navigation;
