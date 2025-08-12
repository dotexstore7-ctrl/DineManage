
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";

export default function AuthorisingOfficerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: pendingStockAdditions = [] } = useQuery({
    queryKey: ["/api/stock-additions", { status: "pending" }],
  });

  const { data: pendingReversals = [] } = useQuery({
    queryKey: ["/api/reversals", { status: "pending" }],
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/ingredients/low-stock"],
  });

  const { data: allKots = [] } = useQuery({
    queryKey: ["/api/kots", { limit: 50 }],
  });

  const { data: salesReports = [] } = useQuery({
    queryKey: ["/api/reports/sales", { period: "today" }],
  });

  const { data: stockReports = [] } = useQuery({
    queryKey: ["/api/reports/stock"],
  });

  const { data: userActivity = [] } = useQuery({
    queryKey: ["/api/reports/user-activity"],
  });

  const { data: recentBills = [] } = useQuery({
    queryKey: ["/api/bills", { limit: 20 }],
  });

  // Mutations
  const approveStockAdditionMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string }) => {
      const response = await fetch(`/api/stock-additions/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (!response.ok) throw new Error(`Failed to ${action} stock addition`);
      return response.json();
    },
    onSuccess: (_, { action }) => {
      toast({ 
        title: "Success", 
        description: `Stock addition ${action === "approve" ? "approved" : "rejected"} successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-additions"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to process approval", variant: "destructive" });
    },
  });

  const approveReversalMutation = useMutation({
    mutationFn: async ({ id, action, reason }: { id: string; action: "approve" | "reject"; reason?: string }) => {
      const response = await fetch(`/api/reversals/${id}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      if (!response.ok) throw new Error(`Failed to ${action} reversal`);
      return response.json();
    },
    onSuccess: (_, { action }) => {
      toast({ 
        title: "Success", 
        description: `Reversal ${action === "approve" ? "approved" : "rejected"} successfully` 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reversals"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to process reversal", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate stats
  const todayStats = {
    totalSales: recentBills.reduce((sum: number, bill: any) => sum + parseFloat(bill.totalAmount || 0), 0),
    totalOrders: allKots.filter((kot: any) => 
      new Date(kot.createdAt).toDateString() === new Date().toDateString()
    ).length,
    pendingApprovals: pendingStockAdditions.length + pendingReversals.length,
    lowStockAlerts: lowStockItems.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Authorising Officer Dashboard</h1>
        <div className="flex space-x-2">
          <Badge variant="outline" className={pendingStockAdditions.length > 0 ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"}>
            {pendingStockAdditions.length} Pending Stock
          </Badge>
          <Badge variant="outline" className={pendingReversals.length > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}>
            {pendingReversals.length} Pending Reversals
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-dollar-sign text-green-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Sales</p>
                <p className="text-2xl font-bold text-green-600">Rs. {todayStats.totalSales.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-receipt text-blue-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-blue-600">{todayStats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-clock text-yellow-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600">{todayStats.pendingApprovals}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-red-600">{todayStats.lowStockAlerts}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "overview", label: "Overview", icon: "fas fa-chart-bar" },
          { id: "approvals", label: "Pending Approvals", icon: "fas fa-check-circle" },
          { id: "reports", label: "Reports", icon: "fas fa-chart-line" },
          { id: "stock-monitor", label: "Stock Monitor", icon: "fas fa-eye" },
          { id: "user-activity", label: "User Activity", icon: "fas fa-users" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? "bg-white text-yellow-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className={tab.icon}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Urgent Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-exclamation-circle text-red-500"></i>
                <span>Urgent Approvals Required</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingStockAdditions.slice(0, 3).map((addition: any) => (
                  <div key={addition.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Stock Addition</p>
                        <p className="text-sm text-gray-600">{addition.ingredient?.name}</p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Quantity: {addition.quantity} {addition.ingredient?.unit} | 
                      Cost: Rs. {parseFloat(addition.totalCost).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
                
                {pendingReversals.slice(0, 2).map((reversal: any) => (
                  <div key={reversal.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">Order Reversal</p>
                        <p className="text-sm text-gray-600">{reversal.kotNumber}</p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                    </div>
                    <p className="text-sm text-gray-600">
                      Amount: Rs. {parseFloat(reversal.amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })} | 
                      Reason: {reversal.reason}
                    </p>
                  </div>
                ))}
                
                {pendingStockAdditions.length === 0 && pendingReversals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
                    <p>No pending approvals</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* System Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-chart-pie text-blue-500"></i>
                <span>System Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800">Total Sales Today</p>
                    <p className="text-sm text-green-600">{recentBills.filter((bill: any) => 
                      new Date(bill.createdAt).toDateString() === new Date().toDateString()
                    ).length} transactions</p>
                  </div>
                  <span className="text-xl font-bold text-green-800">
                    Rs. {todayStats.totalSales.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-800">Active Orders</p>
                    <p className="text-sm text-blue-600">Restaurant & Bar combined</p>
                  </div>
                  <span className="text-xl font-bold text-blue-800">
                    {allKots.filter((kot: any) => kot.status === "pending" || kot.status === "approved").length}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <div>
                    <p className="font-medium text-red-800">Stock Alerts</p>
                    <p className="text-sm text-red-600">Items below minimum threshold</p>
                  </div>
                  <span className="text-xl font-bold text-red-800">{lowStockItems.length}</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium text-purple-800">System Efficiency</p>
                    <p className="text-sm text-purple-600">Based on order completion</p>
                  </div>
                  <span className="text-xl font-bold text-purple-800">
                    {allKots.length > 0 
                      ? `${Math.round((allKots.filter((kot: any) => kot.status === "completed").length / allKots.length) * 100)}%`
                      : "0%"
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="space-y-6">
          {/* Stock Addition Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-warehouse text-blue-500"></i>
                <span>Stock Addition Approvals</span>
                <Badge className="bg-yellow-100 text-yellow-800">{pendingStockAdditions.length} Pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingStockAdditions.map((addition: any) => (
                  <div key={addition.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-lg">{addition.ingredient?.name}</h4>
                        <p className="text-sm text-gray-600">
                          Requested by: {addition.addedBy?.firstName} {addition.addedBy?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(addition.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge className={getStatusColor(addition.status)}>
                        {addition.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-600">Quantity</p>
                        <p className="font-medium">{addition.quantity} {addition.ingredient?.unit}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Cost/Unit</p>
                        <p className="font-medium">Rs. {parseFloat(addition.costPerUnit).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Total Cost</p>
                        <p className="font-medium">Rs. {parseFloat(addition.totalCost).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Current Stock</p>
                        <p className="font-medium">{addition.ingredient?.currentStock} {addition.ingredient?.unit}</p>
                      </div>
                    </div>
                    
                    {addition.notes && (
                      <div className="mb-4 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-700"><strong>Notes:</strong> {addition.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveStockAdditionMutation.mutate({ id: addition.id, action: "approve" })}
                        disabled={approveStockAdditionMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = prompt("Please provide a reason for rejection:");
                          if (reason) {
                            approveStockAdditionMutation.mutate({ id: addition.id, action: "reject", reason });
                          }
                        }}
                        disabled={approveStockAdditionMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                
                {pendingStockAdditions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
                    <p>No pending stock additions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reversal Approvals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-undo text-red-500"></i>
                <span>Reversal Approvals</span>
                <Badge className="bg-red-100 text-red-800">{pendingReversals.length} Pending</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingReversals.map((reversal: any) => (
                  <div key={reversal.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-lg">Order Reversal - {reversal.kotNumber}</h4>
                        <p className="text-sm text-gray-600">
                          Requested by: {reversal.requestedBy?.firstName} {reversal.requestedBy?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(reversal.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                    </div>
                    
                    <div className="mb-4 p-3 bg-red-50 rounded">
                      <p className="text-sm"><strong>Reason:</strong> {reversal.reason}</p>
                      <p className="text-sm mt-1"><strong>Amount:</strong> Rs. {parseFloat(reversal.amount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveReversalMutation.mutate({ id: reversal.id, action: "approve" })}
                        disabled={approveReversalMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve Reversal
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const reason = prompt("Please provide a reason for rejection:");
                          if (reason) {
                            approveReversalMutation.mutate({ id: reversal.id, action: "reject", reason });
                          }
                        }}
                        disabled={approveReversalMutation.isPending}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
                
                {pendingReversals.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <i className="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
                    <p>No pending reversals</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "reports" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sales Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-chart-line text-green-500"></i>
                <span>Sales Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Today's Sales</span>
                    <span className="text-lg font-semibold text-green-600">
                      Rs. {todayStats.totalSales.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Restaurant: Rs. {recentBills
                      .filter((bill: any) => bill.type === "restaurant")
                      .reduce((sum: number, bill: any) => sum + parseFloat(bill.totalAmount || 0), 0)
                      .toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                    <p>Bar: Rs. {recentBills
                      .filter((bill: any) => bill.type === "bar")
                      .reduce((sum: number, bill: any) => sum + parseFloat(bill.totalAmount || 0), 0)
                      .toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Orders Completed</span>
                    <span className="text-lg font-semibold text-blue-600">
                      {allKots.filter((kot: any) => kot.status === "completed").length}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Success Rate: {allKots.length > 0 
                      ? `${Math.round((allKots.filter((kot: any) => kot.status === "completed").length / allKots.length) * 100)}%`
                      : "0%"}</p>
                  </div>
                </div>

                <div className="p-3 border rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Average Order Value</span>
                    <span className="text-lg font-semibold text-purple-600">
                      Rs. {recentBills.length > 0 
                        ? (recentBills.reduce((sum: number, bill: any) => sum + parseFloat(bill.totalAmount || 0), 0) / recentBills.length)
                          .toLocaleString('en-LK', { minimumFractionDigits: 2 })
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-warehouse text-blue-500"></i>
                <span>Stock Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-red-800">Low Stock Items</span>
                    <span className="text-lg font-semibold text-red-800">{lowStockItems.length}</span>
                  </div>
                  {lowStockItems.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      <p>Most Critical:</p>
                      <ul className="list-disc list-inside">
                        {lowStockItems.slice(0, 3).map((item: any) => (
                          <li key={item.id}>{item.name} - {item.currentStock} {item.unit}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-yellow-800">Pending Stock Requests</span>
                    <span className="text-lg font-semibold text-yellow-800">{pendingStockAdditions.length}</span>
                  </div>
                  <div className="mt-1 text-sm text-yellow-600">
                    Total Value: Rs. {pendingStockAdditions
                      .reduce((sum: number, addition: any) => sum + parseFloat(addition.totalCost || 0), 0)
                      .toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-800">Stock Additions Approved</span>
                    <span className="text-lg font-semibold text-green-800">
                      {/* This would need to be calculated from approved stock additions */}
                      0
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-green-600">
                    This Month: Rs. 0.00
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "stock-monitor" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-eye text-purple-500"></i>
              <span>Stock Monitor</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Critical Stock Items */}
              {lowStockItems.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-red-600">Critical Stock Levels</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowStockItems.map((item: any) => (
                      <div key={item.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-800">{item.name}</h4>
                        <div className="mt-2 space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-red-600">Current:</span>
                            <span className="font-medium text-red-800">{item.currentStock} {item.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">Minimum:</span>
                            <span className="font-medium">{item.minimumThreshold} {item.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-red-600">Shortage:</span>
                            <span className="font-medium text-red-800">
                              {parseFloat(item.minimumThreshold) - parseFloat(item.currentStock)} {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All Stock Items Overview */}
              <div>
                <h3 className="text-lg font-semibold mb-3">All Stock Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium text-gray-700">Item</th>
                        <th className="text-left p-3 font-medium text-gray-700">Current Stock</th>
                        <th className="text-left p-3 font-medium text-gray-700">Min Threshold</th>
                        <th className="text-left p-3 font-medium text-gray-700">Value</th>
                        <th className="text-left p-3 font-medium text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* This would be populated with all ingredients data */}
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-gray-500">
                          Stock monitoring data will be displayed here
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "user-activity" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <i className="fas fa-users text-blue-500"></i>
              <span>User Activity Monitor</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Recent User Actions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent User Actions</h3>
                <div className="space-y-3">
                  {recentBills.slice(0, 10).map((bill: any) => (
                    <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <i className="fas fa-file-invoice text-green-500"></i>
                        <div>
                          <p className="font-medium">Bill Generated</p>
                          <p className="text-sm text-gray-600">
                            By {bill.createdBy?.firstName} {bill.createdBy?.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">Rs. {parseFloat(bill.totalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                        <p className="text-sm text-gray-500">{new Date(bill.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* User Statistics */}
              <div>
                <h3 className="text-lg font-semibold mb-4">User Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">Most Active Users</h4>
                    <div className="space-y-2">
                      {/* This would be calculated from user activity data */}
                      <div className="flex justify-between items-center">
                        <span className="text-sm">User activity data</span>
                        <span className="text-sm font-medium">will be shown here</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-3">System Usage Stats</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Orders Today</span>
                        <span className="text-sm font-medium">{todayStats.totalOrders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Active Sessions</span>
                        <span className="text-sm font-medium">-</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
