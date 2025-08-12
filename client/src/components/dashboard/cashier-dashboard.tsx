
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { CreateKOTModal } from "../modals/create-kot-modal";

interface KOTWithDetails {
  id: string;
  kotNumber: string;
  customerName: string;
  type: "restaurant" | "bar";
  status: "pending" | "processing" | "completed" | "reversed";
  orderTime: Date;
  expectedTime: Date;
  totalAmount: string;
  creator: {
    id: string;
    firstName?: string;
    lastName?: string;
  };
  items: {
    id: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    menuItem: {
      id: string;
      name: string;
    };
  }[];
}

interface Bill {
  id: string;
  billNumber: string;
  kotId: string;
  totalAmount: string;
  isPaid: boolean;
  createdAt: Date;
  kot: {
    kotNumber: string;
    customerName: string;
  };
}

export default function CashierDashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedKOT, setSelectedKOT] = useState<string | null>(null);

  // Fetch cashier's KOTs
  const { data: kots = [], refetch: refetchKOTs } = useQuery({
    queryKey: ["cashier-kots"],
    queryFn: async (): Promise<KOTWithDetails[]> => {
      const response = await fetch("/api/kots/my-orders");
      if (!response.ok) throw new Error("Failed to fetch KOTs");
      return response.json();
    },
  });

  // Fetch bills
  const { data: bills = [], refetch: refetchBills } = useQuery({
    queryKey: ["cashier-bills"],
    queryFn: async (): Promise<Bill[]> => {
      const response = await fetch("/api/bills");
      if (!response.ok) throw new Error("Failed to fetch bills");
      return response.json();
    },
  });

  // Generate bill for a KOT
  const handleGenerateBill = async (kotId: string) => {
    try {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kotId }),
      });
      
      if (response.ok) {
        refetchBills();
        alert("Bill generated successfully!");
      } else {
        throw new Error("Failed to generate bill");
      }
    } catch (error) {
      console.error("Error generating bill:", error);
      alert("Failed to generate bill");
    }
  };

  // Mark bill as paid
  const handleMarkPaid = async (billId: string) => {
    try {
      const response = await fetch(`/api/bills/${billId}/pay`, {
        method: "PATCH",
      });
      
      if (response.ok) {
        refetchBills();
        alert("Bill marked as paid!");
      } else {
        throw new Error("Failed to mark bill as paid");
      }
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      alert("Failed to mark bill as paid");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "default",
      processing: "secondary", 
      completed: "default",
      reversed: "destructive",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const todayStats = {
    totalOrders: kots.length,
    completedOrders: kots.filter(k => k.status === 'completed').length,
    pendingOrders: kots.filter(k => k.status === 'pending').length,
    totalRevenue: kots.reduce((sum, kot) => sum + parseFloat(kot.totalAmount), 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <i className="fas fa-receipt text-blue-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Today's orders</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <i className="fas fa-check-circle text-green-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.completedOrders}</div>
            <p className="text-xs text-muted-foreground">Orders completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <i className="fas fa-clock text-yellow-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">Orders pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <i className="fas fa-dollar-sign text-green-500"></i>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rs. {todayStats.totalRevenue.toLocaleString('en-LK', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground">Today's revenue</p>
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
              onClick={() => setActiveModal('createKOT')}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <i className="fas fa-plus-circle text-xl"></i>
              <span>Create New K.O.T</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => refetchKOTs()}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <i className="fas fa-sync-alt text-xl"></i>
              <span>Refresh Orders</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => refetchBills()}
              className="h-20 flex flex-col items-center justify-center space-y-2"
            >
              <i className="fas fa-file-invoice text-xl"></i>
              <span>Refresh Bills</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>My Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {kots.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No orders found</p>
              ) : (
                kots.slice(0, 10).map((kot) => (
                  <div key={kot.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{kot.kotNumber}</h4>
                        <p className="text-sm text-muted-foreground">{kot.customerName}</p>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(kot.status)}
                        <p className="text-sm font-medium mt-1">
                          Rs. {parseFloat(kot.totalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{new Date(kot.orderTime).toLocaleTimeString()}</span>
                      <span className="capitalize">{kot.type}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Items:</p>
                      {kot.items.map((item, index) => (
                        <div key={index} className="text-sm text-muted-foreground flex justify-between">
                          <span>{item.menuItem.name} × {item.quantity}</span>
                          <span>Rs. {parseFloat(item.totalPrice).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                    {kot.status === 'completed' && (
                      <Button 
                        size="sm" 
                        onClick={() => handleGenerateBill(kot.id)}
                        className="w-full mt-2"
                      >
                        Generate Bill
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bills Management */}
        <Card>
          <CardHeader>
            <CardTitle>Bills Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {bills.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No bills found</p>
              ) : (
                bills.slice(0, 10).map((bill) => (
                  <div key={bill.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{bill.billNumber}</h4>
                        <p className="text-sm text-muted-foreground">
                          K.O.T: {bill.kot.kotNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Customer: {bill.kot.customerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={bill.isPaid ? "default" : "secondary"}>
                          {bill.isPaid ? "Paid" : "Unpaid"}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          Rs. {parseFloat(bill.totalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{new Date(bill.createdAt).toLocaleString()}</span>
                    </div>
                    {!bill.isPaid && (
                      <Button 
                        size="sm" 
                        onClick={() => handleMarkPaid(bill.id)}
                        className="w-full mt-2"
                        variant="outline"
                      >
                        Mark as Paid
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {activeModal === 'createKOT' && (
        <CreateKOTModal 
          onClose={() => setActiveModal(null)}
          onSuccess={() => {
            setActiveModal(null);
            refetchKOTs();
          }}
        />
      )}
    </div>
  );
}
