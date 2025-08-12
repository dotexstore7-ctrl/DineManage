
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { useToast } from "../../hooks/use-toast";

export default function AuthorisingOfficerDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: stockAdditions = [] } = useQuery({
    queryKey: ["/api/stock-additions"],
  });

  const { data: pendingStockAdditions = [] } = useQuery({
    queryKey: ["/api/stock-additions", { status: "pending" }],
  });

  const { data: orderReversals = [] } = useQuery({
    queryKey: ["/api/order-reversals"],
  });

  const { data: pendingReversals = [] } = useQuery({
    queryKey: ["/api/order-reversals", { status: "pending" }],
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/ingredients/low-stock"],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentKots = [] } = useQuery({
    queryKey: ["/api/kots", { limit: 10 }],
  });

  // Mutations
  const approveStockMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/stock-additions/${id}/approve`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to approve stock addition");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-additions"] });
      toast({ title: "Success", description: "Stock addition approved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve stock addition", variant: "destructive" });
    },
  });

  const rejectStockMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await fetch(`/api/stock-additions/${id}/reject`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to reject stock addition");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-additions"] });
      toast({ title: "Success", description: "Stock addition rejected" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject stock addition", variant: "destructive" });
    },
  });

  const approveReversalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/order-reversals/${id}/approve`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to approve order reversal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-reversals"] });
      toast({ title: "Success", description: "Order reversal approved successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to approve order reversal", variant: "destructive" });
    },
  });

  const rejectReversalMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/order-reversals/${id}/reject`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to reject order reversal");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/order-reversals"] });
      toast({ title: "Success", description: "Order reversal rejected" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to reject order reversal", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-purple-100 text-purple-800";
      case "reversed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(Number(amount));
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Authorising Officer Dashboard</h1>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
            {pendingStockAdditions.length + pendingReversals.length} Pending Approvals
          </Badge>
          <Badge variant="outline" className={lowStockItems.length > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}>
            {lowStockItems.length} Low Stock Alerts
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-users text-blue-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.totalUsers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-clipboard-list text-green-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardStats?.todayOrders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-rupee-sign text-purple-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardStats?.todayRevenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                <p className="text-2xl font-bold text-gray-900">{pendingStockAdditions.length + pendingReversals.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="stock-approvals">Stock Approvals</TabsTrigger>
          <TabsTrigger value="order-reversals">Order Reversals</TabsTrigger>
          <TabsTrigger value="stock-monitor">Stock Monitor</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Stock Additions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-plus-circle text-yellow-500"></i>
                  <span>Pending Stock Additions</span>
                  <Badge variant="secondary">{pendingStockAdditions.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingStockAdditions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No pending stock additions</p>
                ) : (
                  <div className="space-y-3">
                    {pendingStockAdditions.slice(0, 3).map((addition: any) => (
                      <div key={addition.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{addition.ingredient.name}</p>
                          <p className="text-sm text-gray-600">+{addition.quantity} {addition.ingredient.unit}</p>
                          <p className="text-xs text-gray-500">{formatDate(addition.createdAt)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveStockMutation.mutate(addition.id)}
                            disabled={approveStockMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectStockMutation.mutate({ id: addition.id, reason: "Declined by officer" })}
                            disabled={rejectStockMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    {pendingStockAdditions.length > 3 && (
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab("stock-approvals")}>
                        View All ({pendingStockAdditions.length - 3} more)
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Order Reversals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-undo text-red-500"></i>
                  <span>Pending Order Reversals</span>
                  <Badge variant="secondary">{pendingReversals.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingReversals.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No pending order reversals</p>
                ) : (
                  <div className="space-y-3">
                    {pendingReversals.slice(0, 3).map((reversal: any) => (
                      <div key={reversal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{reversal.kot.kotNumber}</p>
                          <p className="text-sm text-gray-600">{reversal.reason}</p>
                          <p className="text-xs text-gray-500">{formatDate(reversal.createdAt)}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => approveReversalMutation.mutate(reversal.id)}
                            disabled={approveReversalMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => rejectReversalMutation.mutate(reversal.id)}
                            disabled={rejectReversalMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                    {pendingReversals.length > 3 && (
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab("order-reversals")}>
                        View All ({pendingReversals.length - 3} more)
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-receipt text-blue-500"></i>
                <span>Recent Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentKots.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent orders</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">K.O.T Number</th>
                        <th className="text-left p-2">Customer</th>
                        <th className="text-left p-2">Type</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Amount</th>
                        <th className="text-left p-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentKots.slice(0, 5).map((kot: any) => (
                        <tr key={kot.id} className="border-b">
                          <td className="p-2 font-medium">{kot.kotNumber}</td>
                          <td className="p-2">{kot.customerName}</td>
                          <td className="p-2">
                            <Badge variant="outline" className={kot.type === 'restaurant' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}>
                              {kot.type}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge className={getStatusColor(kot.status)}>
                              {kot.status}
                            </Badge>
                          </td>
                          <td className="p-2">{formatCurrency(kot.totalAmount)}</td>
                          <td className="p-2">{formatDate(kot.orderTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Approvals Tab */}
        <TabsContent value="stock-approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Addition Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {stockAdditions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No stock additions found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Ingredient</th>
                        <th className="text-left p-3">Quantity</th>
                        <th className="text-left p-3">Cost</th>
                        <th className="text-left p-3">Added By</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockAdditions.map((addition: any) => (
                        <tr key={addition.id} className="border-b">
                          <td className="p-3 font-medium">{addition.ingredient.name}</td>
                          <td className="p-3">{addition.quantity} {addition.ingredient.unit}</td>
                          <td className="p-3">{formatCurrency(addition.cost)}</td>
                          <td className="p-3">{addition.addedBy.firstName} {addition.addedBy.lastName}</td>
                          <td className="p-3">
                            <Badge className={getStatusColor(addition.status)}>
                              {addition.status}
                            </Badge>
                          </td>
                          <td className="p-3">{formatDate(addition.createdAt)}</td>
                          <td className="p-3">
                            {addition.status === 'pending' ? (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => approveStockMutation.mutate(addition.id)}
                                  disabled={approveStockMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectStockMutation.mutate({ id: addition.id, reason: "Declined by officer" })}
                                  disabled={rejectStockMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order Reversals Tab */}
        <TabsContent value="order-reversals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Reversal Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              {orderReversals.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No order reversals found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">K.O.T Number</th>
                        <th className="text-left p-3">Customer</th>
                        <th className="text-left p-3">Reason</th>
                        <th className="text-left p-3">Requested By</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderReversals.map((reversal: any) => (
                        <tr key={reversal.id} className="border-b">
                          <td className="p-3 font-medium">{reversal.kot.kotNumber}</td>
                          <td className="p-3">{reversal.kot.customerName}</td>
                          <td className="p-3">{reversal.reason}</td>
                          <td className="p-3">{reversal.requestedBy.firstName} {reversal.requestedBy.lastName}</td>
                          <td className="p-3">
                            <Badge className={getStatusColor(reversal.status)}>
                              {reversal.status}
                            </Badge>
                          </td>
                          <td className="p-3">{formatDate(reversal.createdAt)}</td>
                          <td className="p-3">
                            {reversal.status === 'pending' ? (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => approveReversalMutation.mutate(reversal.id)}
                                  disabled={approveReversalMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => rejectReversalMutation.mutate(reversal.id)}
                                  disabled={rejectReversalMutation.isPending}
                                >
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stock Monitor Tab */}
        <TabsContent value="stock-monitor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-eye text-blue-500"></i>
                <span>Stock Monitor</span>
                <Badge variant={lowStockItems.length > 0 ? "destructive" : "secondary"}>
                  {lowStockItems.length} Low Stock Items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length === 0 ? (
                <div className="text-center py-8">
                  <i className="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
                  <p className="text-gray-500">All stock levels are adequate</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Ingredient</th>
                        <th className="text-left p-3">Current Stock</th>
                        <th className="text-left p-3">Minimum Level</th>
                        <th className="text-left p-3">Unit</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockItems.map((item: any) => (
                        <tr key={item.id} className="border-b">
                          <td className="p-3 font-medium">{item.name}</td>
                          <td className="p-3">
                            <span className="text-red-600 font-medium">{item.currentStock}</span>
                          </td>
                          <td className="p-3">{item.minimumLevel}</td>
                          <td className="p-3">{item.unit}</td>
                          <td className="p-3">
                            <Badge variant="destructive">
                              Low Stock
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <i className="fas fa-chart-line text-blue-500 text-3xl mb-3"></i>
                <h3 className="font-semibold text-gray-900 mb-2">Sales Reports</h3>
                <p className="text-sm text-gray-600">Daily, weekly, and monthly sales analysis</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <i className="fas fa-warehouse text-green-500 text-3xl mb-3"></i>
                <h3 className="font-semibold text-gray-900 mb-2">Stock Reports</h3>
                <p className="text-sm text-gray-600">Inventory levels and stock movement</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <i className="fas fa-users text-purple-500 text-3xl mb-3"></i>
                <h3 className="font-semibold text-gray-900 mb-2">Staff Reports</h3>
                <p className="text-sm text-gray-600">Employee performance and activities</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <i className="fas fa-receipt text-orange-500 text-3xl mb-3"></i>
                <h3 className="font-semibold text-gray-900 mb-2">K.O.T Reports</h3>
                <p className="text-sm text-gray-600">Order tracking and fulfillment analysis</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <i className="fas fa-chart-pie text-red-500 text-3xl mb-3"></i>
                <h3 className="font-semibold text-gray-900 mb-2">Financial Reports</h3>
                <p className="text-sm text-gray-600">Revenue, expenses, and profit analysis</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <i className="fas fa-clipboard-check text-teal-500 text-3xl mb-3"></i>
                <h3 className="font-semibold text-gray-900 mb-2">Audit Reports</h3>
                <p className="text-sm text-gray-600">System activities and compliance tracking</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-check-circle text-green-500"></i>
                    <span className="text-sm">Stock additions approved today</span>
                  </div>
                  <Badge variant="secondary">{stockAdditions.filter((a: any) => a.status === 'approved' && new Date(a.updatedAt).toDateString() === new Date().toDateString()).length}</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-undo text-blue-500"></i>
                    <span className="text-sm">Order reversals processed today</span>
                  </div>
                  <Badge variant="secondary">{orderReversals.filter((r: any) => r.status !== 'pending' && new Date(r.updatedAt).toDateString() === new Date().toDateString()).length}</Badge>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <i className="fas fa-exclamation-triangle text-yellow-500"></i>
                    <span className="text-sm">Items requiring immediate attention</span>
                  </div>
                  <Badge variant="secondary">{lowStockItems.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
