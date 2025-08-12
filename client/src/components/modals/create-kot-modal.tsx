import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CreateKOTModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole: string;
}

const kotSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  type: z.enum(["restaurant", "bar"]),
  orderTime: z.string().min(1, "Order time is required"),
  expectedTime: z.string().min(1, "Expected time is required"),
  items: z.array(z.object({
    menuItemId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
  })).min(1, "At least one item is required"),
});

type KOTFormData = z.infer<typeof kotSchema>;

export default function CreateKOTModal({ isOpen, onClose, userRole }: CreateKOTModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({});

  const kotType = userRole === "barman" ? "bar" : "restaurant";

  const form = useForm<KOTFormData>({
    resolver: zodResolver(kotSchema),
    defaultValues: {
      customerName: "",
      type: kotType,
      orderTime: "",
      expectedTime: "",
      items: [],
    },
  });

  const { data: menuItems } = useQuery({
    queryKey: ["/api/menu-items", kotType],
    queryFn: () => apiRequest("GET", `/api/menu-items?category=${kotType}`),
  });

  const createKOTMutation = useMutation({
    mutationFn: async (data: KOTFormData) => {
      await apiRequest("POST", "/api/kots", {
        kot: {
          customerName: data.customerName,
          type: data.type,
          orderTime: new Date(data.orderTime),
          expectedTime: new Date(data.expectedTime),
          totalAmount: data.items.reduce((sum, item) => sum + item.totalPrice, 0),
        },
        items: data.items,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "K.O.T created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kots"] });
      onClose();
      form.reset();
      setSelectedItems(new Set());
      setItemQuantities({});
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create K.O.T",
        variant: "destructive",
      });
    },
  });

  const handleItemToggle = (itemId: string, price: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
      const newQuantities = { ...itemQuantities };
      delete newQuantities[itemId];
      setItemQuantities(newQuantities);
    } else {
      newSelected.add(itemId);
      setItemQuantities(prev => ({ ...prev, [itemId]: 1 }));
    }
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (itemId: string, quantity: number) => {
    setItemQuantities(prev => ({ ...prev, [itemId]: Math.max(1, quantity) }));
  };

  const onSubmit = (data: KOTFormData) => {
    const items = Array.from(selectedItems).map(itemId => {
      const menuItem = (menuItems as any)?.find((item: any) => item.id === itemId);
      const quantity = itemQuantities[itemId] || 1;
      const unitPrice = parseFloat(menuItem?.price || "0");
      return {
        menuItemId: itemId,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
      };
    });

    createKOTMutation.mutate({ ...data, items });
  };

  const totalAmount = Array.from(selectedItems).reduce((sum, itemId) => {
    const menuItem = (menuItems as any)?.find((item: any) => item.id === itemId);
    const quantity = itemQuantities[itemId] || 1;
    const unitPrice = parseFloat(menuItem?.price || "0");
    return sum + (unitPrice * quantity);
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create K.O.T</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>K.O.T Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="bar">Bar</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="orderTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expectedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Time</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Menu Items Selection */}
            <div>
              <FormLabel>Menu Items</FormLabel>
              <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto mt-2">
                {(menuItems as any)?.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={selectedItems.has(item.id)}
                        onCheckedChange={() => handleItemToggle(item.id, parseFloat(item.price))}
                      />
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        {item.ingredients?.length > 0 && (
                          <p className="text-sm text-gray-500">
                            {item.ingredients.map((ing: any) => 
                              `${ing.ingredient.name} (${ing.quantity}${ing.ingredient.unit})`
                            ).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedItems.has(item.id) && (
                        <Input
                          type="number"
                          min="1"
                          value={itemQuantities[item.id] || 1}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1)}
                          className="w-16 text-center"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        Rs. {parseFloat(item.price).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">No menu items available</p>
                )}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>Rs. {totalAmount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={createKOTMutation.isPending}
              >
                {createKOTMutation.isPending ? "Creating..." : "Create K.O.T"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
