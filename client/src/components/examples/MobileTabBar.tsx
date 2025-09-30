import { MobileTabBar } from '../MobileTabBar';
import { useState } from 'react';

export default function MobileTabBarExample() {
  const [activeTab, setActiveTab] = useState("home");

  return (
    <div className="relative min-h-screen bg-background pb-16">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">Mobile Tab Bar Examples</h2>
        <p className="text-sm text-muted-foreground mb-4">
          View on mobile/tablet size to see the tab bar at the bottom
        </p>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Staff User Tabs</h3>
            <p className="text-sm text-muted-foreground">Active tab: {activeTab}</p>
          </div>
        </div>
      </div>
      
      <MobileTabBar activeTab={activeTab} userRole="staff" />
    </div>
  );
}