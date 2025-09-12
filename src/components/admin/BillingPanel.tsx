import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const BillingPanel = () => {
  const plans = [
    {
      name: "Starter",
      price: "$29.99",
      period: "month",
      orders: "0-200 orders",
      features: [
        "Cart Drawer",
        "Sticky Button", 
        "Basic Analytics",
        "Email Support",
      ],
      current: true,
    },
    {
      name: "Growth",
      price: "$34.99",
      period: "month",
      orders: "201-500 orders",
      features: [
        "Everything in Starter",
        "Product Upsells",
        "Add-On Products",
        "Advanced Analytics",
        "Priority Support",
      ],
      current: false,
    },
    {
      name: "Pro",
      price: "$54.99",
      period: "month", 
      orders: "501-1000 orders",
      features: [
        "Everything in Growth",
        "Discount Promotions",
        "Custom Styling",
        "A/B Testing",
        "White-label Support",
      ],
      current: false,
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
              <h3 className="text-lg font-semibold">Starter Plan</h3>
              <p className="text-muted-foreground">$29.99/month • 127 orders this month</p>
            </div>
            <Badge variant="default" className="bg-success text-success-foreground">
              Active
            </Badge>
          </div>
          
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="flex justify-between text-sm mb-2">
              <span>Orders used</span>
              <span>127 / 200</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "63.5%" }}></div>
            </div>
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
                disabled={plan.current}
              >
                {plan.current ? "Current Plan" : "Upgrade"}
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
            {[
              { date: "Dec 1, 2024", amount: "$29.99", status: "Paid", invoice: "INV-001" },
              { date: "Nov 1, 2024", amount: "$29.99", status: "Paid", invoice: "INV-002" },
              { date: "Oct 1, 2024", amount: "$0.00", status: "Trial", invoice: "TRIAL" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-medium">{item.date}</div>
                    <div className="text-sm text-muted-foreground">{item.invoice}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-semibold">{item.amount}</span>
                  <Badge 
                    variant={item.status === "Paid" ? "default" : "secondary"}
                    className={item.status === "Paid" ? "bg-success text-success-foreground" : ""}
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