
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";
import { CreateKOTModal } from "../modals/create-kot-modal";

export default function CashierDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedKot, setSelectedKot] = useState<any>(null);
  const [isKOTModalOpen, setIsKOTModalOpen] = useState(false);
  const [billData, setBillData] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState({ name: "", phone: "", address: "" });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: myKots = [] } = useQuery({
    queryKey: ["/api/kots", { createdBy: "me" }],
  });

  const { data: todayOrders = [] } = useQuery({
    queryKey: ["/api/kots", { date: new Date().toISOString().split('T')[0] }],
  });

  const { data: menuItems = [] } = useQuery({
    queryKey: ["/api/menu-items"],
  });

  const { data: bills = [] } = useQuery({
    queryKey: ["/api/bills", { createdBy: "me" }],
  });

  // Mutations
  const generateBillMutation = useMutation({
    mutationFn: async (kotId: string) => {
      const response = await fetch(`/api/bills`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kotId, customerDetails }),
      });
      if (!response.ok) throw new Error("Failed to generate bill");
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "Success", description: "Bill generated successfully" });
      setBillData(data);
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      queryClient.invalidateQueries({ queryKey: ["/api/kots"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate bill", variant: "destructive" });
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
      toast({ title: "Success", description: "KOT status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/kots"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update KOT status", variant: "destructive" });
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
    totalOrders: todayOrders.length,
    totalRevenue: todayOrders.reduce((sum: number, kot: any) => sum + parseFloat(kot.totalAmount || 0), 0),
    pendingOrders: todayOrders.filter((kot: any) => kot.status === "pending").length,
    completedOrders: todayOrders.filter((kot: any) => kot.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Restaurant Cashier Dashboard</h1>
        <Button onClick={() => setIsKOTModalOpen(true)} className="bg-green-600 hover:bg-green-700">
          <i className="fas fa-plus mr-2"></i>
          Create New K.O.T
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-receipt text-blue-500 text-xl"></i>
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
              <i className="fas fa-check-circle text-green-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.completedOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "overview", label: "Overview", icon: "fas fa-chart-bar" },
          { id: "create-kot", label: "Create K.O.T", icon: "fas fa-plus" },
          { id: "my-orders", label: "My Orders", icon: "fas fa-clipboard-list" },
          { id: "billing", label: "Generate Bills", icon: "fas fa-file-invoice" },
          { id: "menu", label: "Menu Items", icon: "fas fa-utensils" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
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
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-history text-blue-500"></i>
                <span>Recent Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {myKots.slice(0, 5).map((kot: any) => (
                  <div key={kot.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{kot.kotNumber}</p>
                      <p className="text-sm text-gray-600">
                        Table {kot.tableNumber} | {kot.items?.length} items
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

          {/* Today's Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-chart-line text-green-500"></i>
                <span>Today's Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Orders Created</span>
                  <span className="font-semibold">{todayStats.totalOrders}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Revenue Generated</span>
                  <span className="font-semibold">Rs. {todayStats.totalRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-semibold">
                    {todayStats.totalOrders > 0 
                      ? `${Math.round((todayStats.completedOrders / todayStats.totalOrders) * 100)}%`
                      : "0%"
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Order Value</span>
                  <span className="font-semibold">
                    Rs. {todayStats.totalOrders > 0 
                      ? (todayStats.totalRevenue / todayStats.totalOrders).toLocaleString('en-LK', { minimumFractionDigits: 2 })
                      : "0.00"
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "create-kot" && (
        <Card>
          <CardHeader>
            <CardTitle>Create New K.O.T</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <i className="fas fa-receipt text-6xl text-gray-300 mb-4"></i>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Create Restaurant K.O.T</h3>
              <p className="text-gray-500 mb-6">Start a new order for restaurant customers</p>
              <Button 
                onClick={() => setIsKOTModalOpen(true)}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <i className="fas fa-plus mr-2"></i>
                Create K.O.T
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "my-orders" && (
        <Card>
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {myKots.map((kot: any) => (
                <div key={kot.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{kot.kotNumber}</h4>
                      <p className="text-sm text-gray-600">
                        Table: {kot.tableNumber} | {kot.type === "restaurant" ? "Restaurant" : "Bar"}
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
                    <h5 className="font-medium mb-2">Items:</h5>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateKotStatusMutation.mutate({ kotId: kot.id, status: "cancelled" })}
                        disabled={updateKotStatusMutation.isPending}
                      >
                        Cancel Order
                      </Button>
                    )}
                    {kot.status === "completed" && !kot.billGenerated && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedKot(kot);
                          setActiveTab("billing");
                        }}
                      >
                        Generate Bill
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "billing" && (
        <Card>
          <CardHeader>
            <CardTitle>Generate Bills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Customer Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <Input
                    value={customerDetails.name}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <Input
                    value={customerDetails.phone}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <Input
                    value={customerDetails.address}
                    onChange={(e) => setCustomerDetails(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter address"
                  />
                </div>
              </div>

              {/* Completed Orders Ready for Billing */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Completed Orders Ready for Billing</h3>
                <div className="space-y-3">
                  {myKots
                    .filter((kot: any) => kot.status === "completed" && !kot.billGenerated)
                    .map((kot: any) => (
                      <div key={kot.id} className="border rounded-lg p-4 bg-green-50">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{kot.kotNumber}</h4>
                            <p className="text-sm text-gray-600">Table: {kot.tableNumber}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">Rs. {parseFloat(kot.totalAmount || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</p>
                            <Button
                              size="sm"
                              onClick={() => generateBillMutation.mutate(kot.id)}
                              disabled={generateBillMutation.isPending}
                              className="mt-2"
                            >
                              Generate Bill
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {kot.items?.map((item: any, index: number) => (
                            <span key={index}>
                              {item.menuItem?.name} x{item.quantity}
                              {index < kot.items.length - 1 && ", "}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Bills */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Recent Bills</h3>
                <div className="space-y-3">
                  {bills.slice(0, 5).map((bill: any) => (
                    <div key={bill.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">Bill #{bill.billNumber}</h4>
                          <p className="text-sm text-gray-600">Customer: {bill.customerName || "Walk-in"}</p>
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

      {activeTab === "menu" && (
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Menu Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems
                .filter((item: any) => item.category === "restaurant")
                .map((item: any) => (
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
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create KOT Modal */}
      <CreateKOTModal
        isOpen={isKOTModalOpen}
        onClose={() => setIsKOTModalOpen(false)}
        userRole="restaurant_cashier"
      />
    </div>
  );
}
