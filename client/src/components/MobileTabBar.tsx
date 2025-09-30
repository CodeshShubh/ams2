import { Home, Clock, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
}

interface MobileTabBarProps {
  activeTab: string;
  userRole?: "admin" | "staff";
}

export function MobileTabBar({ activeTab, userRole = "staff" }: MobileTabBarProps) {
  const navigate = useNavigate();

  const staffTabs: TabItem[] = [
    {
      id: "home",
      label: "Home",
      icon: Home,
      onClick: () => navigate("/")
    },
    {
      id: "history",
      label: "History",
      icon: Clock,
      onClick: () => navigate("/history")
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      onClick: () => navigate("/profile")
    }
  ];

  const adminTabs: TabItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      onClick: () => navigate("/admin")
    },
    {
      id: "reports",
      label: "Reports",
      icon: Clock,
      onClick: () => navigate("/admin/reports")
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      onClick: () => navigate("/admin/settings")
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      onClick: () => navigate("/profile")
    }
  ];

  const tabs = userRole === "admin" ? adminTabs : staffTabs;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={tab.onClick}
              className={`flex-1 flex-col h-auto py-2 px-1 gap-1 ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
              <span className="text-xs font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}