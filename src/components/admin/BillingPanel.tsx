import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const BillingPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [billingData, setBillingData] = useState({
    subscription: {
      status: 'trial',
      plan: 'starter',
      trialEndsAt: null,
      price: 9,
      limits: { orders: 100, features: [] },
      usage: { orders: 0, ordersLimit: 100, usagePercentage: 0 }
    },
    plans: {},
    billingHistory: []
  });

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('billing', {
        method: 'GET',
        headers: {
          'x-shop-domain': 'demo-shop.myshopify.com'
        }
      });

      if (data?.success) {
        setBillingData(data);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planId: string) => {
    try {
      setUpgrading(true);
      const { data, error } = await supabase.functions.invoke('billing', {
        method: 'POST',
        headers: {
          'x-shop-domain': 'demo-shop.myshopify.com'
        },
        body: {
          action: 'change_plan',
          plan: planId
        }
      });

      if (data?.success) {
        toast({
          title: "Plan Updated",
          description: data.message,
        });
        await loadBillingData(); // Reload data
      } else {
        throw new Error(data?.error || 'Failed to update plan');
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      toast({
        title: "Error",
        description: "Failed to update plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: "$9",
      period: "month",
      orders: "0-100 orders",
      features: [
        "Cart Drawer",
        "Sticky Button", 
        "Basic Analytics",
        "Email Support",
      ],
      current: billingData.subscription.plan === 'starter',
    },
    {
      id: "growth",
      name: "Growth",
      price: "$29",
      period: "month",
      orders: "101-1000 orders",
      features: [
        "Everything in Starter",
        "Product Upsells",
        "Add-On Products",
        "Advanced Analytics",
        "Priority Support",
      ],
      current: billingData.subscription.plan === 'growth',
    },
    {
      id: "pro",
      name: "Pro",
      price: "$79",
      period: "month", 
      orders: "1001-10000 orders",
      features: [
        "Everything in Growth",
        "Discount Promotions",
        "Custom Styling",
        "A/B Testing",
        "White-label Support",
      ],
      current: billingData.subscription.plan === 'pro',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>You're currently on the Starter plan</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{billingData.subscription.plan.charAt(0).toUpperCase() + billingData.subscription.plan.slice(1)} Plan</h3>
              <p className="text-muted-foreground">
                ${billingData.subscription.price}/month • {billingData.subscription.usage.orders} orders this month
              </p>
            </div>
            <Badge variant="default" className={`${
              billingData.subscription.status === 'active' ? 'bg-success text-success-foreground' : 
              billingData.subscription.status === 'trial' ? 'bg-warning text-warning-foreground' : 'bg-secondary'
            }`}>
              {billingData.subscription.status === 'trial' ? 'Trial' : 'Active'}
            </Badge>
          </div>
          
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span>Orders used</span>
              <span>{billingData.subscription.usage.orders} / {billingData.subscription.usage.ordersLimit}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${billingData.subscription.usage.usagePercentage}%` }}></div>
            </div>
            {billingData.subscription.status === 'trial' && billingData.subscription.trialEndsAt && (
              <p className="text-sm text-muted-foreground mt-2">
                Trial ends: {new Date(billingData.subscription.trialEndsAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <Card key={index} className={`card-gradient hover-lift ${plan.current ? "ring-2 ring-primary" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {plan.current && (
                  <Badge variant="default">Current</Badge>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.period}</span>
                </div>
                <CardDescription>{plan.orders}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center space-x-2 text-sm">
                    <span className="text-success">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={plan.current ? "secondary" : "default"}
                className={`w-full ${!plan.current ? "gradient-primary text-white" : ""}`}
                disabled={plan.current || upgrading}
                onClick={() => !plan.current && handlePlanChange(plan.id)}
              >
                {plan.current ? "Current Plan" : upgrading ? "Upgrading..." : "Upgrade"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Billing History */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your recent charges and invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {billingData.billingHistory.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{new Date(item.date).toLocaleDateString()}</div>
                    <div className="text-sm text-muted-foreground">{item.plan} Plan</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-semibold">${item.amount}</span>
                  <Badge 
                    variant={item.status === 'paid' ? "default" : "secondary"}
                    className={item.status === 'paid' ? "bg-success text-success-foreground" : ""}
                  >
                    {item.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};