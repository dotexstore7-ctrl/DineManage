import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface ViewReportsModalProps {
  onClose: () => void;
}

export function ViewReportsModal({ onClose }: ViewReportsModalProps) {
  const [activeTab, setActiveTab] = useState("sales");

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/ingredients/low-stock"],
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            System Reports
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <i className="fas fa-times"></i>
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          {/* Tab Navigation */}
          <div className="flex space-x-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab("sales")}
              className={`pb-2 px-1 font-medium text-sm ${
                activeTab === "sales"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sales Overview
            </button>
            <button
              onClick={() => setActiveTab("stock")}
              className={`pb-2 px-1 font-medium text-sm ${
                activeTab === "stock"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Stock Report
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`pb-2 px-1 font-medium text-sm ${
                activeTab === "users"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              User Activity
            </button>
          </div>

          {/* Sales Overview Tab */}
          {activeTab === "sales" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800">Today's Revenue</h4>
                  <p className="text-2xl font-bold text-blue-600">
                    Rs {parseFloat((dashboardStats as any)?.todayRevenue || "0").toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800">Total Orders</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {(dashboardStats as any)?.todayOrders || "0"}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800">Active Users</h4>
                  <p className="text-2xl font-bold text-purple-600">
                    {(dashboardStats as any)?.totalUsers || "0"}
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Sales Summary</h4>
                <p className="text-sm text-gray-600">
                  Restaurant management system is tracking all sales activities.
                  Use the detailed reports section for comprehensive analysis.
                </p>
              </div>
            </div>
          )}

          {/* Stock Report Tab */}
          {activeTab === "stock" && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">Low Stock Alert</h4>
              {lowStockItems.length > 0 ? (
                <div className="space-y-2">
                  {lowStockItems.map((item: any) => (
                    <div key={item.id} className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-red-800">{item.name}</span>
                        <span className="text-red-600">
                          {item.currentStock} {item.unit} (Min: {item.minimumStock})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                  <p className="text-green-800">All stock levels are above minimum thresholds.</p>
                </div>
              )}
            </div>
          )}

          {/* User Activity Tab */}
          {activeTab === "users" && (
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-800">System Users</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">
                  Total registered users: {(dashboardStats as any)?.totalUsers || "0"}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  This includes all system users across different roles:
                  Admin, Cashiers, Store Keepers, Authorising Officers, and Barmen.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}