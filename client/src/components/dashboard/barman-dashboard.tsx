
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";
import { CreateKOTModal } from "../modals/create-kot-modal";

export default function BarmanDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isKOTModalOpen, setIsKOTModalOpen] = useState(false);
  const [customerBills, setCustomerBills] = useState<any>({});
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: myKots = [] } = useQuery({
    queryKey: ["/api/kots", { createdBy: "me", type: "bar" }],
  });

  const { data: todayBarOrders = [] } = useQuery({
    queryKey: ["/api/kots", { type: "bar", date: new Date().toISOString().split('T')[0] }],
  });

  const { data: barMenuItems = [] } = useQuery({
    queryKey: ["/api/menu-items", { category: "bar" }],
  });

  const { data: customerBillsData = [] } = useQuery({
    queryKey: ["/api/bills", { type: "bar", createdBy: "me" }],
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["/api/ingredients", { type: "bar" }],
  });

  // Mutations
  const createCustomerBillMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/bills/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create customer bill");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Customer bill created successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      setSelectedCustomer("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create customer bill", variant: "destructive" });
    },
  });

  const updateKotStatusMutation = useMutation({
    mutationFn: async ({ kotId, status }: { kotId: string; status: string }) => {
      const response = await fetch(`/api/kots/${kotId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update KOT status");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Order status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/kots"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "completed": return "bg-blue-100 text-blue-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const todayStats = {
    totalOrders: todayBarOrders.length,
    totalRevenue: todayBarOrders.reduce((sum: number, kot: any) => sum + parseFloat(kot.totalAmount || 0), 0),
    pendingOrders: todayBarOrders.filter((kot: any) => kot.status === "pending").length,
    completedOrders: todayBarOrders.filter((kot: any) => kot.status === "completed").length,
  };

  // Group orders by customer for customer billing
  const customerOrders = myKots.reduce((acc: any, kot: any) => {
    const customer = kot.customerName || `Table ${kot.tableNumber}`;
    if (!acc[customer]) {
      acc[customer] = [];
    }
    acc[customer].push(kot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Barman Dashboard</h1>
        <Button onClick={() => setIsKOTModalOpen(true)} className="bg-red-600 hover:bg-red-700">
          <i className="fas fa-cocktail mr-2"></i>
          Create Bar K.O.T
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-cocktail text-red-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-dollar-sign text-green-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-green-600">Rs. {todayStats.totalRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-clock text-yellow-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-600">{todayStats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-users text-purple-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-purple-600">{Object.keys(customerOrders).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "overview", label: "Overview", icon: "fas fa-chart-bar" },
          { id: "create-kot", label: "Create Bar K.O.T", icon: "fas fa-cocktail" },
          { id: "my-orders", label: "My Orders", icon: "fas fa-clipboard-list" },
          { id: "customer-bills", label: "Customer Bills", icon: "fas fa-user-tie" },
          { id: "bar-menu", label: "Bar Menu", icon: "fas fa-wine-glass" },
          { id: "ingredients", label: "Bar Ingredients", icon: "fas fa-bottles" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors text-sm ${
              activeTab === tab.id
                ? "bg-white text-red-600 shadow-sm"
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
          {/* Recent Bar Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-history text-red-500"></i>
                <span>Recent Bar Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myKots.slice(0, 5).map((kot: any) => (
                  <div key={kot.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{kot.kotNumber}</p>
                      <p className="text-sm text-gray-600">
                        {kot.customerName ? `Customer: ${kot.customerName}` : `Table ${kot.tableNumber}`} | {kot.items?.length} drinks
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(kot.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(kot.status)}>
                        {kot.status}
                      </Badge>
                      <p className="text-sm font-medium mt-1">
                        Rs. {parseFloat(kot.totalAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Popular Drinks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-star text-yellow-500"></i>
                <span>Popular Drinks Today</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {barMenuItems.slice(0, 5).map((item: any) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        Rs. {parseFloat(item.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {item.available ? "Available" : "Out of Stock"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "create-kot" && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Bar K.O.T</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <i className="fas fa-cocktail text-6xl text-red-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Create Bar K.O.T</h3>
              <p className="text-gray-500 mb-6">Start a new order for bar customers</p>
              <Button 
                onClick={() => setIsKOTModalOpen(true)}
                className="bg-red-600 hover:bg-red-700"
                size="lg"
              >
                <i className="fas fa-cocktail mr-2"></i>
                Create Bar K.O.T
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "my-orders" && (
        <Card>
          <CardHeader>
            <CardTitle>My Bar Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myKots.map((kot: any) => (
                <div key={kot.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{kot.kotNumber}</h4>
                      <p className="text-sm text-gray-600">
                        {kot.customerName ? `Customer: ${kot.customerName}` : `Table: ${kot.tableNumber}`} | Bar Order
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(kot.status)}>
                        {kot.status}
                      </Badge>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(kot.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <h5 className="font-medium mb-2">Drinks:</h5>
                    <div className="space-y-1">
                      {kot.items?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span>{item.menuItem?.name} x{item.quantity}</span>
                          <span>Rs. {parseFloat(item.totalPrice).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total Amount:</span>
                        <span>Rs. {parseFloat(kot.totalAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {kot.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateKotStatusMutation.mutate({ kotId: kot.id, status: "completed" })}
                          disabled={updateKotStatusMutation.isPending}
                        >
                          Mark Completed
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateKotStatusMutation.mutate({ kotId: kot.id, status: "cancelled" })}
                          disabled={updateKotStatusMutation.isPending}
                        >
                          Cancel Order
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "customer-bills" && (
        <Card>
          <CardHeader>
            <CardTitle>Customer-wise Billing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Customer Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Customer for Billing
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select a customer...</option>
                  {Object.keys(customerOrders).map((customer) => (
                    <option key={customer} value={customer}>
                      {customer} ({customerOrders[customer].length} orders)
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Customer Orders */}
              {selectedCustomer && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium mb-3">Orders for {selectedCustomer}</h4>
                  <div className="space-y-2 mb-4">
                    {customerOrders[selectedCustomer]
                      .filter((kot: any) => kot.status === "completed")
                      .map((kot: any) => (
                        <div key={kot.id} className="flex justify-between items-center p-2 bg-white rounded border">
                          <div>
                            <span className="font-medium">{kot.kotNumber}</span>
                            <span className="text-sm text-gray-600 ml-2">
                              {kot.items?.length} items
                            </span>
                          </div>
                          <span className="font-medium">
                            Rs. {parseFloat(kot.totalAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="font-semibold">Total Amount:</span>
                    <span className="font-semibold text-lg">
                      Rs. {customerOrders[selectedCustomer]
                        .filter((kot: any) => kot.status === "completed")
                        .reduce((sum: number, kot: any) => sum + parseFloat(kot.totalAmount || 0), 0)
                        .toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={() => createCustomerBillMutation.mutate({
                      customerName: selectedCustomer,
                      kotIds: customerOrders[selectedCustomer]
                        .filter((kot: any) => kot.status === "completed")
                        .map((kot: any) => kot.id)
                    })}
                    disabled={createCustomerBillMutation.isPending}
                  >
                    Generate Customer Bill
                  </Button>
                </div>
              )}

              {/* Recent Customer Bills */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Customer Bills</h3>
                <div className="space-y-3">
                  {customerBillsData.slice(0, 5).map((bill: any) => (
                    <div key={bill.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Bill #{bill.billNumber}</h4>
                          <p className="text-sm text-gray-600">Customer: {bill.customerName}</p>
                          <p className="text-sm text-gray-500">{new Date(bill.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">Rs. {parseFloat(bill.totalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                          <Badge className="bg-green-100 text-green-800 mt-1">Paid</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "bar-menu" && (
        <Card>
          <CardHeader>
            <CardTitle>Bar Menu Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {barMenuItems.map((item: any) => (
                <div key={item.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{item.name}</h4>
                    <Badge className={item.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {item.available ? "Available" : "Out of Stock"}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-lg">
                      Rs. {parseFloat(item.price).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.ingredients?.length || 0} ingredients
                    </span>
                  </div>
                  {item.alcoholContent && (
                    <div className="mt-2 text-xs text-red-600">
                      <i className="fas fa-wine-glass mr-1"></i>
                      {item.alcoholContent}% ABV
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "ingredients" && (
        <Card>
          <CardHeader>
            <CardTitle>Bar Ingredients & Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ingredients.map((ingredient: any) => {
                const isLowStock = parseFloat(ingredient.currentStock) <= parseFloat(ingredient.minimumThreshold);
                return (
                  <div key={ingredient.id} className={`border rounded-lg p-4 ${isLowStock ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{ingredient.name}</h4>
                      <Badge className={isLowStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                        {isLowStock ? "Low Stock" : "Good"}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>Current: {ingredient.currentStock} {ingredient.unit}</p>
                      <p>Minimum: {ingredient.minimumThreshold} {ingredient.unit}</p>
                      <p>Cost/Unit: Rs. {parseFloat(ingredient.costPerUnit).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                    </div>
                    {isLowStock && (
                      <div className="mt-2 text-xs text-red-600">
                        <i className="fas fa-exclamation-triangle mr-1"></i>
                        Stock running low!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create KOT Modal */}
      <CreateKOTModal
        isOpen={isKOTModalOpen}
        onClose={() => setIsKOTModalOpen(false)}
        userRole="barman"
      />
    </div>
  );
}
