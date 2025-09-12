import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const AnalyticsDashboard = () => {
  const metrics = [
    {
      title: "Cart Opens",
      value: "1,247",
      change: "+12%",
      trend: "up",
      description: "Times cart drawer was opened",
    },
    {
      title: "Conversions",
      value: "342",
      change: "+8%",
      trend: "up",
      description: "Purchases completed via cart drawer",
    },
    {
      title: "Average Order Value",
      value: "$127.45",
      change: "+23%",
      trend: "up",
      description: "Average order value with cart drawer",
    },
    {
      title: "Abandonment Rate",
      value: "34.2%",
      change: "-15%",
      trend: "down",
      description: "Cart abandonment reduction",
    },
  ];

  const featurePerformance = [
    { feature: "Product Upsells", conversions: 89, revenue: "$2,340" },
    { feature: "Free Shipping Bar", conversions: 156, revenue: "$4,680" },
    { feature: "Add-On Products", conversions: 67, revenue: "$1,205" },
    { feature: "Discount Promotions", conversions: 34, revenue: "$890" },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="card-gradient hover-lift">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold">{metric.value}</span>
                <Badge 
                  variant={metric.trend === "up" ? "default" : "secondary"}
                  className={`text-xs ${
                    metric.trend === "up" ? "bg-success text-success-foreground" : ""
                  }`}
                >
                  {metric.change}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature Performance */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Feature Performance</CardTitle>
          <CardDescription>How each cart drawer feature is performing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featurePerformance.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <h4 className="font-medium">{item.feature}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.conversions} conversions this month
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-success">{item.revenue}</div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analytics Integration */}
      <Card className="card-gradient">
        <CardHeader>
          <CardTitle>Analytics Integration</CardTitle>
          <CardDescription>Connected tracking services</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-semibold">FB</span>
              </div>
              <div>
                <div className="font-medium">Facebook Pixel</div>
                <div className="text-sm text-muted-foreground">Tracking cart events</div>
              </div>
            </div>
            <Badge variant="default" className="bg-success text-success-foreground">
              Connected
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-semibold">GA</span>
              </div>
              <div>
                <div className="font-medium">Google Analytics</div>
                <div className="text-sm text-muted-foreground">E-commerce tracking</div>
              </div>
            </div>
            <Badge variant="secondary">Not Connected</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};