import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAppSelector, useAppDispatch } from "@/store";
import { selectUser, logout } from "@/store/slices/authSlice";
import { selectTheme, toggleTheme } from "@/store/slices/uiSlice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CloudinaryUpload } from "@/components/CloudinaryUpload";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Shield, Calendar, Settings, Moon, Sun, LogOut, Camera, Bell, Lock } from "lucide-react";
import { format } from "date-fns";

export function EmployeeProfile() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const theme = useAppSelector(selectTheme);
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    avatar: user?.avatar || ''
  });

  const handleSave = () => {
    // TODO: Implement profile update
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = (url: string) => {
    setFormData(prev => ({ ...prev, avatar: url }));
    toast({
      title: "Avatar updated",
      description: "Your profile picture has been updated successfully",
    });
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="employee-profile">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>
            Update your profile details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <CloudinaryUpload
              currentAvatar={formData.avatar}
              onUploadSuccess={handleAvatarUpload}
              userInitials={user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{user.name}</h3>
              <Badge variant="outline" className="gap-1">
                <Shield className="h-3 w-3" />
                {user.role.toUpperCase()}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
              </p>
            </div>
          </div>

          <Separator />

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={!isEditing}
                data-testid="input-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                disabled={!isEditing}
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled={!isEditing}
                data-testid="input-email"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={handleSave} data-testid="button-save">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={handleCancel} data-testid="button-cancel">
                  Cancel
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} data-testid="button-edit">
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            View your account details and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <span className="text-sm">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Role:</span>
                <Badge variant="outline">{user.role.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Member since:</span>
                <span className="text-sm">{format(new Date(user.createdAt), 'MMMM yyyy')}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Account Status:</span>
                <Badge variant={user.isActive ? "default" : "destructive"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">User ID:</span>
                <span className="text-sm font-mono">{user.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Last Updated:</span>
                <span className="text-sm">{format(new Date(user.updatedAt), 'PPp')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your app experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="font-medium">Theme</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground capitalize">{theme}</span>
              <Button variant="outline" size="sm" onClick={handleThemeToggle} data-testid="button-toggle-theme">
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span className="font-medium">Notifications</span>
            </div>
            <Button variant="outline" size="sm" data-testid="button-notification-settings">
              Configure
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span className="font-medium">Change Password</span>
            </div>
            <Button variant="outline" size="sm" data-testid="button-change-password">
              Update
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Actions that affect your account access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="destructive" 
            onClick={handleLogout}
            className="gap-2"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}