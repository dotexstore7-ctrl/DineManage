
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../../hooks/use-toast";

export default function BarmanDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [kotItems, setKotItems] = useState<any[]>([]);
  const [billCustomer, setBillCustomer] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: barMenuItems = [] } = useQuery({
    queryKey: ["/api/menu-items", { category: "bar" }],
  });

  const { data: barKots = [] } = useQuery({
    queryKey: ["/api/kots", { type: "bar" }],
  });

  const { data: myKots = [] } = useQuery({
    queryKey: ["/api/kots/my-orders"],
  });

  const { data: pendingBills = [] } = useQuery({
    queryKey: ["/api/bills", { isPaid: false, type: "bar" }],
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: ingredients = [] } = useQuery({
    queryKey: ["/api/ingredients", { category: "bar" }],
  });

  // Mutations
  const createKotMutation = useMutation({
    mutationFn: async (kotData: any) => {
      const response = await fetch("/api/kots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kotData),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to create K.O.T");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kots"] });
      toast({ title: "Success", description: "Bar K.O.T created successfully" });
      setSelectedCustomer("");
      setKotItems([]);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create K.O.T", variant: "destructive" });
    },
  });

  const updateKotStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/kots/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to update K.O.T status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kots"] });
      toast({ title: "Success", description: "Order status updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update order status", variant: "destructive" });
    },
  });

  const generateBillMutation = useMutation({
    mutationFn: async (kotId: string) => {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kotId }),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to generate bill");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      toast({ title: "Success", description: "Bill generated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate bill", variant: "destructive" });
    },
  });

  const markBillPaidMutation = useMutation({
    mutationFn: async (billId: string) => {
      const response = await fetch(`/api/bills/${billId}/pay`, {
        method: "PATCH",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to mark bill as paid");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      toast({ title: "Success", description: "Bill marked as paid" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to mark bill as paid", variant: "destructive" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
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

  const addItemToKot = (menuItem: any) => {
    const existingItem = kotItems.find(item => item.menuItemId === menuItem.id);
    if (existingItem) {
      setKotItems(kotItems.map(item => 
        item.menuItemId === menuItem.id 
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setKotItems([...kotItems, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        unitPrice: Number(menuItem.price),
        totalPrice: Number(menuItem.price)
      }]);
    }
  };

  const removeItemFromKot = (menuItemId: string) => {
    setKotItems(kotItems.filter(item => item.menuItemId !== menuItemId));
  };

  const updateItemQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromKot(menuItemId);
      return;
    }
    setKotItems(kotItems.map(item => 
      item.menuItemId === menuItemId 
        ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
        : item
    ));
  };

  const getTotalAmount = () => {
    return kotItems.reduce((total, item) => total + item.totalPrice, 0);
  };

  const handleCreateKot = () => {
    if (!selectedCustomer || kotItems.length === 0) {
      toast({ title: "Error", description: "Please select customer and add items", variant: "destructive" });
      return;
    }

    const kotData = {
      customerName: selectedCustomer,
      type: "bar",
      orderTime: new Date().toISOString(),
      expectedTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      items: kotItems.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }))
    };

    createKotMutation.mutate(kotData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Barman Dashboard</h1>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {barKots.length} Total Bar Orders
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700">
            {myKots.length} My Orders
          </Badge>
          <Badge variant="outline" className="bg-orange-50 text-orange-700">
            {pendingBills.length} Pending Bills
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-cocktail text-purple-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Bar Orders</p>
                <p className="text-2xl font-bold text-gray-900">{barKots.filter((kot: any) => new Date(kot.orderTime).toDateString() === new Date().toDateString()).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-clipboard-list text-blue-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">My Active Orders</p>
                <p className="text-2xl font-bold text-gray-900">{myKots.filter((kot: any) => kot.status !== 'completed').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-rupee-sign text-green-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Bar Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(barKots.filter((kot: any) => new Date(kot.orderTime).toDateString() === new Date().toDateString()).reduce((sum: number, kot: any) => sum + Number(kot.totalAmount), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-file-invoice text-orange-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Bills</p>
                <p className="text-2xl font-bold text-gray-900">{pendingBills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create-kot">Create Bar K.O.T</TabsTrigger>
          <TabsTrigger value="my-orders">My Orders</TabsTrigger>
          <TabsTrigger value="customer-bills">Customer Bills</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bar Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-cocktail text-purple-500"></i>
                  <span>Recent Bar Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {barKots.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No bar orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {barKots.slice(0, 5).map((kot: any) => (
                      <div key={kot.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{kot.kotNumber}</p>
                          <p className="text-sm text-gray-600">{kot.customerName}</p>
                          <p className="text-xs text-gray-500">{formatDate(kot.orderTime)}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(kot.status)}>
                            {kot.status}
                          </Badge>
                          <p className="text-sm font-medium mt-1">{formatCurrency(kot.totalAmount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bar Inventory Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-warehouse text-blue-500"></i>
                  <span>Bar Inventory Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {ingredients.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No bar ingredients found</p>
                ) : (
                  <div className="space-y-3">
                    {ingredients.slice(0, 5).map((ingredient: any) => (
                      <div key={ingredient.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{ingredient.name}</p>
                          <p className="text-sm text-gray-600">{ingredient.currentStock} {ingredient.unit}</p>
                        </div>
                        <Badge variant={ingredient.currentStock <= ingredient.minimumLevel ? "destructive" : "secondary"}>
                          {ingredient.currentStock <= ingredient.minimumLevel ? "Low Stock" : "In Stock"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  onClick={() => setActiveTab("create-kot")}
                  className="p-6 h-auto flex flex-col items-center space-y-2 bg-purple-600 hover:bg-purple-700"
                >
                  <i className="fas fa-plus-circle text-2xl"></i>
                  <span>Create New Bar K.O.T</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab("my-orders")}
                  variant="outline"
                  className="p-6 h-auto flex flex-col items-center space-y-2"
                >
                  <i className="fas fa-clipboard-list text-2xl"></i>
                  <span>View My Orders</span>
                </Button>
                
                <Button 
                  onClick={() => setActiveTab("customer-bills")}
                  variant="outline"
                  className="p-6 h-auto flex flex-col items-center space-y-2"
                >
                  <i className="fas fa-file-invoice text-2xl"></i>
                  <span>Manage Bills</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Bar K.O.T Tab */}
        <TabsContent value="create-kot" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer & Menu Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Create Bar K.O.T</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <Input
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                    placeholder="Enter customer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bar Menu Items</label>
                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                    {barMenuItems.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-sm font-medium text-purple-600">{formatCurrency(item.price)}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => addItemToKot(item)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* K.O.T Preview */}
            <Card>
              <CardHeader>
                <CardTitle>K.O.T Preview</CardTitle>
              </CardHeader>
              <CardContent>
                {kotItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No items added yet</p>
                ) : (
                  <div className="space-y-3">
                    {kotItems.map((item) => (
                      <div key={item.menuItemId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.unitPrice)} × {item.quantity} = {formatCurrency(item.totalPrice)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.menuItemId, item.quantity - 1)}
                          >
                            -
                          </Button>
                          <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateItemQuantity(item.menuItemId, item.quantity + 1)}
                          >
                            +
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeItemFromKot(item.menuItemId)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Total Amount:</span>
                        <span className="text-lg font-bold text-purple-600">{formatCurrency(getTotalAmount())}</span>
                      </div>
                    </div>

                    <Button
                      onClick={handleCreateKot}
                      disabled={createKotMutation.isPending || !selectedCustomer}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      {createKotMutation.isPending ? "Creating..." : "Create Bar K.O.T"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* My Orders Tab */}
        <TabsContent value="my-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Bar Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {myKots.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No orders found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">K.O.T Number</th>
                        <th className="text-left p-3">Customer</th>
                        <th className="text-left p-3">Items</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">Time</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myKots.map((kot: any) => (
                        <tr key={kot.id} className="border-b">
                          <td className="p-3 font-medium">{kot.kotNumber}</td>
                          <td className="p-3">{kot.customerName}</td>
                          <td className="p-3">{kot.items?.length || 0} items</td>
                          <td className="p-3">
                            <Badge className={getStatusColor(kot.status)}>
                              {kot.status}
                            </Badge>
                          </td>
                          <td className="p-3">{formatCurrency(kot.totalAmount)}</td>
                          <td className="p-3">{formatDate(kot.orderTime)}</td>
                          <td className="p-3">
                            {kot.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateKotStatusMutation.mutate({ id: kot.id, status: 'processing' })}
                                disabled={updateKotStatusMutation.isPending}
                                className="bg-blue-600 hover:bg-blue-700 text-white mr-2"
                              >
                                Start
                              </Button>
                            )}
                            {kot.status === 'processing' && (
                              <Button
                                size="sm"
                                onClick={() => updateKotStatusMutation.mutate({ id: kot.id, status: 'completed' })}
                                disabled={updateKotStatusMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Complete
                              </Button>
                            )}
                            {kot.status === 'completed' && (
                              <Button
                                size="sm"
                                onClick={() => generateBillMutation.mutate(kot.id)}
                                disabled={generateBillMutation.isPending}
                                variant="outline"
                              >
                                Generate Bill
                              </Button>
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

        {/* Customer Bills Tab */}
        <TabsContent value="customer-bills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Bills Management</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingBills.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No pending bills</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Bill Number</th>
                        <th className="text-left p-3">K.O.T Number</th>
                        <th className="text-left p-3">Customer</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Generated</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingBills.map((bill: any) => (
                        <tr key={bill.id} className="border-b">
                          <td className="p-3 font-medium">{bill.billNumber}</td>
                          <td className="p-3">{bill.kot?.kotNumber}</td>
                          <td className="p-3">{bill.kot?.customerName}</td>
                          <td className="p-3">{formatCurrency(bill.totalAmount)}</td>
                          <td className="p-3">
                            <Badge variant={bill.isPaid ? "default" : "secondary"}>
                              {bill.isPaid ? "Paid" : "Pending"}
                            </Badge>
                          </td>
                          <td className="p-3">{formatDate(bill.createdAt)}</td>
                          <td className="p-3">
                            {!bill.isPaid && (
                              <Button
                                size="sm"
                                onClick={() => markBillPaidMutation.mutate(bill.id)}
                                disabled={markBillPaidMutation.isPending}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Mark Paid
                              </Button>
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
      </Tabs>
    </div>
  );
}
