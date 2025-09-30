import { Header } from '../Header';
import { ThemeProvider } from '../ThemeProvider';

export default function HeaderExample() {
  const mockUser = {
    name: "John Doe",
    email: "john.doe@company.com",
    role: "staff" as const,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background">
        <Header 
          user={mockUser}
          onLogout={() => console.log("Logout clicked")}
          onSettings={() => console.log("Settings clicked")}
        />
        <div className="p-4">
          <p className="text-muted-foreground">Header component with user menu and theme toggle</p>
        </div>
      </div>
    </ThemeProvider>
  );
}