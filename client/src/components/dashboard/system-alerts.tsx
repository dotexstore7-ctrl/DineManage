import { useQuery } from "@tanstack/react-query";

export default function SystemAlerts() {
  const { data: lowStockIngredients } = useQuery({
    queryKey: ["/api/ingredients/low-stock"],
  });

  const { data: pendingStockAdditions } = useQuery({
    queryKey: ["/api/stock-additions", { status: "pending" }],
  });

  const alerts = [];

  // Add low stock alerts
  if ((lowStockIngredients as any)?.length > 0) {
    (lowStockIngredients as any).forEach((ingredient: any) => {
      alerts.push({
        type: "warning",
        icon: "fas fa-exclamation-triangle",
        title: "Low Stock Alert",
        message: `${ingredient.name} stock is below ${ingredient.minimumThreshold}${ingredient.unit} threshold`,
        bgColor: "bg-red-50",
        iconColor: "text-red-500",
        textColor: "text-red-800",
        subtextColor: "text-red-600",
      });
    });
  }

  // Add pending approvals alert
  if ((pendingStockAdditions as any)?.length > 0) {
    alerts.push({
      type: "info",
      icon: "fas fa-clock",
      title: "Pending Approval",
      message: `${(pendingStockAdditions as any).length} stock additions awaiting approval`,
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-500",
      textColor: "text-yellow-800",
      subtextColor: "text-yellow-600",
    });
  }

  // Default alert if no issues
  if (alerts.length === 0) {
    alerts.push({
      type: "success",
      icon: "fas fa-check-circle",
      title: "All Systems Normal",
      message: "No alerts at this time",
      bgColor: "bg-green-50",
      iconColor: "text-green-500",
      textColor: "text-green-800",
      subtextColor: "text-green-600",
    });
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
      </div>
      <div className="p-6 space-y-4">
        {alerts.slice(0, 5).map((alert, index) => (
          <div key={index} className={`flex items-start space-x-3 p-3 ${alert.bgColor} rounded-lg`}>
            <i className={`${alert.icon} ${alert.iconColor} mt-0.5`}></i>
            <div>
              <p className={`text-sm font-medium ${alert.textColor}`}>{alert.title}</p>
              <p className={`text-xs ${alert.subtextColor} mt-1`}>{alert.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
