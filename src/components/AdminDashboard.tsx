import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfigurationPanel } from "./admin/ConfigurationPanel";
import { AnalyticsDashboard } from "./admin/AnalyticsDashboard";
import { BillingPanel } from "./admin/BillingPanel";
import { supabase } from "@/integrations/supabase/client";

export const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("config");
  const [quickStats, setQuickStats] = useState({
    cartOpens: 0,
    conversions: 0,
    aovIncrease: 0
  });

  useEffect(() => {
    loadQuickStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(loadQuickStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadQuickStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('analytics', {
        method: 'GET'
      });

      if (error) throw error;

      if (data?.success) {
        setQuickStats({
          cartOpens: data.metrics.cartOpens || 0,
          conversions: data.metrics.conversions || 0,
          aovIncrease: data.metrics.avgOrderValue > 0 ? 
            Math.round(((data.metrics.avgOrderValue - 50) / 50) * 100) : 0 // Assuming baseline AOV of $50
        });
      }
    } catch (error) {
      console.error('Failed to load quick stats:', error);
    }
  };

  const navigationItems = [
    { id: "config", label: "Configuration", icon: "⚙️", badge: null },
    { id: "analytics", label: "Analytics", icon: "📊", badge: "New" },
    { id: "billing", label: "Billing", icon: "💳", badge: "Pro" },
  ];

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Sidebar Navigation */}
      <div className="lg:col-span-1">
        <Card className="card-gradient">
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
            <CardDescription>Manage your cart drawer configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all hover-lift ${
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground shadow-custom-md"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <Badge 
                    variant={item.badge === "Pro" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card className="mt-6 card-gradient">
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Cart Opens</span>
              <span className="font-semibold">{quickStats.cartOpens.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Conversions</span>
              <span className="font-semibold text-success">{quickStats.conversions.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">AOV Increase</span>
              <span className={`font-semibold ${quickStats.aovIncrease > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                {quickStats.aovIncrease > 0 ? '+' : ''}{quickStats.aovIncrease}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="lg:col-span-3">
        {activeSection === "config" && <ConfigurationPanel />}
        {activeSection === "analytics" && <AnalyticsDashboard />}
        {activeSection === "billing" && <BillingPanel />}
      </div>
    </div>
  );
};