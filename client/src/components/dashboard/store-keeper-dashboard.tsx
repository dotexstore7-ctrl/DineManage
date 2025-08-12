
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { useToast } from "../../hooks/use-toast";

export default function StoreKeeperDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedIngredient, setSelectedIngredient] = useState("");
  const [addQuantity, setAddQuantity] = useState("");
  const [addCost, setAddCost] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: ingredients = [] } = useQuery({
    queryKey: ["/api/ingredients"],
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ["/api/ingredients/low-stock"],
  });

  const { data: stockAdditions = [] } = useQuery({
    queryKey: ["/api/stock-additions"],
  });

  const { data: pendingAdditions = [] } = useQuery({
    queryKey: ["/api/stock-additions", { status: "pending" }],
  });

  const { data: kots = [] } = useQuery({
    queryKey: ["/api/kots", { status: "approved", limit: 10 }],
  });

  // Mutations
  const addStockMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/stock-additions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add stock");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Stock addition request submitted" });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-additions"] });
      setSelectedIngredient("");
      setAddQuantity("");
      setAddCost("");
      setAddNotes("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add stock", variant: "destructive" });
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

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIngredient || !addQuantity || !addCost) return;

    const ingredient = ingredients.find((ing: any) => ing.id === selectedIngredient);
    if (!ingredient) return;

    const quantity = parseFloat(addQuantity);
    const costPerUnit = parseFloat(addCost);
    const totalCost = quantity * costPerUnit;

    addStockMutation.mutate({
      ingredientId: selectedIngredient,
      quantity: quantity.toFixed(3),
      costPerUnit: costPerUnit.toFixed(2),
      totalCost: totalCost.toFixed(2),
      notes: addNotes,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "completed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Store Keeper Dashboard</h1>
        <div className="flex space-x-2">
          <Badge variant="outline" className="bg-blue-50 text-blue-700">
            {ingredients.length} Total Items
          </Badge>
          <Badge variant="outline" className={lowStockItems.length > 0 ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}>
            {lowStockItems.length} Low Stock
          </Badge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-warehouse text-blue-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Ingredients</p>
                <p className="text-2xl font-bold text-gray-900">{ingredients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600">{lowStockItems.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-clock text-yellow-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Additions</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingAdditions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-check-circle text-green-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Approved KOTs</p>
                <p className="text-2xl font-bold text-green-600">{kots.filter((kot: any) => kot.status === "approved").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "overview", label: "Overview", icon: "fas fa-chart-bar" },
          { id: "inventory", label: "Inventory", icon: "fas fa-boxes" },
          { id: "add-stock", label: "Add Stock", icon: "fas fa-plus" },
          { id: "stock-requests", label: "Stock Requests", icon: "fas fa-list" },
          { id: "kots", label: "KOT Management", icon: "fas fa-receipt" }
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
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-exclamation-triangle text-red-500"></i>
                <span>Low Stock Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockItems.length > 0 ? (
                <div className="space-y-3">
                  {lowStockItems.slice(0, 5).map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <p className="font-medium text-red-800">{item.name}</p>
                        <p className="text-sm text-red-600">
                          Current: {item.currentStock} {item.unit} | Min: {item.minimumThreshold} {item.unit}
                        </p>
                      </div>
                      <Badge className="bg-red-100 text-red-800">Urgent</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <i className="fas fa-check-circle text-green-500 text-3xl mb-2"></i>
                  <p>All stock levels are adequate</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Stock Additions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-history text-blue-500"></i>
                <span>Recent Stock Additions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockAdditions.slice(0, 5).map((addition: any) => (
                  <div key={addition.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{addition.ingredient?.name}</p>
                      <p className="text-sm text-gray-600">
                        +{addition.quantity} {addition.ingredient?.unit} | Rs. {parseFloat(addition.totalCost).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(addition.status)}>
                      {addition.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "inventory" && (
        <Card>
          <CardHeader>
            <CardTitle>Current Inventory</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-gray-700">Ingredient</th>
                    <th className="text-left p-3 font-medium text-gray-700">Current Stock</th>
                    <th className="text-left p-3 font-medium text-gray-700">Minimum Threshold</th>
                    <th className="text-left p-3 font-medium text-gray-700">Cost/Unit</th>
                    <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((ingredient: any) => {
                    const isLowStock = parseFloat(ingredient.currentStock) <= parseFloat(ingredient.minimumThreshold);
                    return (
                      <tr key={ingredient.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{ingredient.name}</td>
                        <td className="p-3">{ingredient.currentStock} {ingredient.unit}</td>
                        <td className="p-3">{ingredient.minimumThreshold} {ingredient.unit}</td>
                        <td className="p-3">Rs. {parseFloat(ingredient.costPerUnit).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3">
                          <Badge className={isLowStock ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                            {isLowStock ? "Low Stock" : "Good"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "add-stock" && (
        <Card>
          <CardHeader>
            <CardTitle>Add Stock Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddStock} className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Ingredient *
                </label>
                <select
                  value={selectedIngredient}
                  onChange={(e) => setSelectedIngredient(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose an ingredient...</option>
                  {ingredients.map((ingredient: any) => (
                    <option key={ingredient.id} value={ingredient.id}>
                      {ingredient.name} (Current: {ingredient.currentStock} {ingredient.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity to Add *
                </label>
                <Input
                  type="number"
                  step="0.001"
                  value={addQuantity}
                  onChange={(e) => setAddQuantity(e.target.value)}
                  placeholder="0.000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost per Unit (Rs.) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={addCost}
                  onChange={(e) => setAddCost(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              {addQuantity && addCost && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Total Cost: Rs. {(parseFloat(addQuantity) * parseFloat(addCost)).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  placeholder="Add any notes about this stock addition"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <Button 
                type="submit" 
                disabled={addStockMutation.isPending}
                className="w-full"
              >
                {addStockMutation.isPending ? "Submitting..." : "Submit Stock Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "stock-requests" && (
        <Card>
          <CardHeader>
            <CardTitle>Stock Addition Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stockAdditions.map((addition: any) => (
                <div key={addition.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{addition.ingredient?.name}</h4>
                      <p className="text-sm text-gray-600">
                        Requested by: {addition.addedBy?.firstName} {addition.addedBy?.lastName}
                      </p>
                    </div>
                    <Badge className={getStatusColor(addition.status)}>
                      {addition.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
                      <p className="text-gray-600">Date</p>
                      <p className="font-medium">{new Date(addition.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {addition.notes && (
                    <div className="mt-3 p-2 bg-gray-50 rounded">
                      <p className="text-sm text-gray-700">{addition.notes}</p>
                    </div>
                  )}
                  
                  {addition.reason && (
                    <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-700">Rejection Reason: {addition.reason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "kots" && (
        <Card>
          <CardHeader>
            <CardTitle>KOT Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {kots.map((kot: any) => (
                <div key={kot.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-lg">{kot.kotNumber}</h4>
                      <p className="text-sm text-gray-600">
                        {kot.type === "restaurant" ? "Restaurant" : "Bar"} | Table: {kot.tableNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        Created by: {kot.creator?.firstName} {kot.creator?.lastName}
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
                  </div>
                  
                  {kot.status === "approved" && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => updateKotStatusMutation.mutate({ kotId: kot.id, status: "completed" })}
                        disabled={updateKotStatusMutation.isPending}
                      >
                        Mark Completed
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
