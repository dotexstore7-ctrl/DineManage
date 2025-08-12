
import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useToast } from "../../hooks/use-toast";
import { CreateKOTModal } from "../modals/create-kot-modal";

export default function CashierDashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedKOT, setSelectedKOT] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch data
  const { data: dashboardStats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: pendingKOTs = [] } = useQuery({
    queryKey: ["/api/kots", { status: "pending" }],
  });

  const { data: processingKOTs = [] } = useQuery({
    queryKey: ["/api/kots", { status: "processing" }],
  });

  const { data: completedKOTs = [] } = useQuery({
    queryKey: ["/api/kots", { status: "completed" }],
  });

  const { data: unpaidBills = [] } = useQuery({
    queryKey: ["/api/bills", { isPaid: false }],
  });

  const { data: todayBills = [] } = useQuery({
    queryKey: ["/api/bills", { date: new Date().toISOString().split('T')[0] }],
  });

  // Mutations
  const updateKOTStatusMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["/api/kots"] });
      toast({ title: "Success", description: "KOT status updated successfully" });
    },
  });

  const createBillMutation = useMutation({
    mutationFn: async (billData: any) => {
      const response = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billData),
      });
      if (!response.ok) throw new Error("Failed to create bill");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      toast({ title: "Success", description: "Bill created successfully" });
    },
  });

  const processPaymentMutation = useMutation({
    mutationFn: async ({ billId, paymentData }: { billId: string; paymentData: any }) => {
      const response = await fetch(`/api/bills/${billId}/pay`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) throw new Error("Failed to process payment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bills"] });
      setSelectedKOT(null);
      setPaymentAmount("");
      toast({ title: "Success", description: "Payment processed successfully" });
    },
  });

  const handleCreateBill = (kot: any) => {
    const billData = {
      kotId: kot.id,
      subtotal: kot.totalAmount,
      serviceCharge: (parseFloat(kot.totalAmount) * 0.1).toString(),
      tax: (parseFloat(kot.totalAmount) * 0.05).toString(),
      finalAmount: (parseFloat(kot.totalAmount) * 1.15).toString(),
    };
    createBillMutation.mutate(billData);
  };

  const handleProcessPayment = (bill: any) => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount < parseFloat(bill.finalAmount)) {
      toast({ 
        title: "Error", 
        description: "Please enter a valid payment amount",
        variant: "destructive" 
      });
      return;
    }

    const paymentData = {
      isPaid: true,
      paymentMethod,
      paidAmount: paymentAmount,
      changeAmount: (amount - parseFloat(bill.finalAmount)).toString(),
    };

    processPaymentMutation.mutate({ billId: bill.id, paymentData });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "reversed": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Cashier Dashboard</h1>
        <Button onClick={() => setActiveModal('createKOT')} className="bg-blue-600 hover:bg-blue-700">
          <i className="fas fa-plus mr-2"></i>
          Create New K.O.T
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-receipt text-blue-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Pending K.O.Ts</p>
                <p className="text-2xl font-bold text-gray-900">{pendingKOTs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-clock text-orange-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Processing</p>
                <p className="text-2xl font-bold text-gray-900">{processingKOTs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-money-bill text-green-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Unpaid Bills</p>
                <p className="text-2xl font-bold text-gray-900">{unpaidBills.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <i className="fas fa-chart-line text-purple-500 text-xl"></i>
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  Rs. {dashboardStats?.todayRevenue ? 
                    parseFloat(dashboardStats.todayRevenue).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                    : '0.00'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Order Management</TabsTrigger>
          <TabsTrigger value="billing">Billing & Payment</TabsTrigger>
          <TabsTrigger value="history">Today's Sales</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-clock text-yellow-500"></i>
                  <span>Pending Orders ({pendingKOTs.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {pendingKOTs.map((kot: any) => (
                  <div key={kot.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{kot.kotNumber}</p>
                        <p className="text-sm text-gray-600">{kot.customerName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(kot.orderTime).toLocaleTimeString()}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          Rs. {parseFloat(kot.totalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Badge className={getStatusColor(kot.status)}>
                          {kot.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => updateKOTStatusMutation.mutate({ kotId: kot.id, status: "processing" })}
                          className="w-full"
                        >
                          Start Processing
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {pendingKOTs.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No pending orders</p>
                )}
              </CardContent>
            </Card>

            {/* Completed Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-check-circle text-green-500"></i>
                  <span>Completed Orders ({completedKOTs.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {completedKOTs.map((kot: any) => (
                  <div key={kot.id} className="p-3 border border-gray-200 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{kot.kotNumber}</p>
                        <p className="text-sm text-gray-600">{kot.customerName}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(kot.orderTime).toLocaleTimeString()}
                        </p>
                        <p className="text-sm font-medium text-green-600">
                          Rs. {parseFloat(kot.totalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <Badge className={getStatusColor(kot.status)}>
                          {kot.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          onClick={() => handleCreateBill(kot)}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Create Bill
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {completedKOTs.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No completed orders</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-money-bill text-green-500"></i>
                <span>Unpaid Bills ({unpaidBills.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {unpaidBills.map((bill: any) => (
                  <div key={bill.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="font-medium">Bill #{bill.id.slice(-6)}</span>
                        <Badge className="bg-red-100 text-red-800">Unpaid</Badge>
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>Rs. {parseFloat(bill.subtotal).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Charge (10%):</span>
                          <span>Rs. {parseFloat(bill.serviceCharge).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax (5%):</span>
                          <span>Rs. {parseFloat(bill.tax).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between font-bold border-t pt-1">
                          <span>Total:</span>
                          <span>Rs. {parseFloat(bill.finalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {selectedKOT?.id === bill.id ? (
                        <div className="space-y-3 pt-3 border-t">
                          <div>
                            <label className="block text-sm font-medium mb-1">Payment Method</label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                                <SelectItem value="digital">Digital Payment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Amount Received</label>
                            <Input
                              type="number"
                              value={paymentAmount}
                              onChange={(e) => setPaymentAmount(e.target.value)}
                              placeholder="Enter amount received"
                              step="0.01"
                            />
                          </div>

                          {paymentAmount && parseFloat(paymentAmount) >= parseFloat(bill.finalAmount) && (
                            <div className="text-sm font-medium text-green-600">
                              Change: Rs. {(parseFloat(paymentAmount) - parseFloat(bill.finalAmount)).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}

                          <div className="flex space-x-2">
                            <Button 
                              onClick={() => handleProcessPayment(bill)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              Process Payment
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setSelectedKOT(null)}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          onClick={() => setSelectedKOT(bill)}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          Process Payment
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {unpaidBills.length === 0 && (
                  <div className="col-span-2 text-center text-gray-500 py-8">
                    No unpaid bills
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className="fas fa-history text-purple-500"></i>
                <span>Today's Sales History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todayBills.map((bill: any) => (
                  <div key={bill.id} className="p-3 border border-gray-200 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium">Bill #{bill.id.slice(-6)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(bill.createdAt).toLocaleTimeString()} - {bill.paymentMethod}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        Rs. {parseFloat(bill.finalAmount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <Badge className={bill.isPaid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {bill.isPaid ? "Paid" : "Unpaid"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {todayBills.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No sales today</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create KOT Modal */}
      {activeModal === 'createKOT' && (
        <CreateKOTModal 
          isOpen={true}
          onClose={() => setActiveModal(null)} 
          userRole="restaurant_cashier"
        />
      )}
    </div>
  );
}
