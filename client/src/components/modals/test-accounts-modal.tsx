import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface TestAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestAccountsModal({ isOpen, onClose }: TestAccountsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testAccounts, isLoading } = useQuery({
    queryKey: ["/api/test-accounts"],
    enabled: isOpen,
  });

  const switchAccountMutation = useMutation({
    mutationFn: async (testAccountId: string) => {
      await apiRequest("POST", "/api/auth/switch-test-account", { testAccountId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Switched to test account successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      onClose();
      window.location.reload(); // Refresh to update all components
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
        description: "Failed to switch test account",
        variant: "destructive",
      });
    },
  });

  const getRoleDisplay = (role: string) => {
    const roleConfig: Record<string, any> = {
      admin: {
        title: "Administrator",
        icon: "fas fa-crown",
        bgColor: "bg-blue-100",
        iconColor: "text-blue-600",
        buttonColor: "bg-blue-600 hover:bg-blue-700",
        access: "Full system access, user management, menu management",
      },
      restaurant_cashier: {
        title: "Restaurant Cashier",
        icon: "fas fa-cash-register",
        bgColor: "bg-green-100",
        iconColor: "text-green-600",
        buttonColor: "bg-green-600 hover:bg-green-700",
        access: "Create restaurant K.O.Ts, generate bills, reverse orders",
      },
      store_keeper: {
        title: "Store Keeper",
        icon: "fas fa-warehouse",
        bgColor: "bg-purple-100",
        iconColor: "text-purple-600",
        buttonColor: "bg-purple-600 hover:bg-purple-700",
        access: "Manage stock, process K.O.Ts, approve ingredient requests",
      },
      authorising_officer: {
        title: "Authorising Officer",
        icon: "fas fa-clipboard-check",
        bgColor: "bg-yellow-100",
        iconColor: "text-yellow-600",
        buttonColor: "bg-yellow-600 hover:bg-yellow-700",
        access: "Monitor stock & sales, approve reversals, generate reports",
      },
      barman: {
        title: "Barman",
        icon: "fas fa-cocktail",
        bgColor: "bg-red-100",
        iconColor: "text-red-600",
        buttonColor: "bg-red-600 hover:bg-red-700",
        access: "Create bar K.O.Ts, generate bills, customer-wise billing",
      },
    };
    return roleConfig[role] || {};
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Accounts</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gray-200 rounded-full mr-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {(testAccounts as any)?.map((account: any) => {
              const roleDisplay = getRoleDisplay(account.role);
              return (
                <div key={account.role} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className={`w-8 h-8 ${roleDisplay.bgColor} rounded-full flex items-center justify-center mr-3`}>
                      <i className={`${roleDisplay.icon} ${roleDisplay.iconColor}`}></i>
                    </div>
                    <h4 className="font-semibold text-gray-900">{roleDisplay.title}</h4>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1 mb-3">
                    <p><strong>Name:</strong> {account.firstName} {account.lastName}</p>
                    <p><strong>Email:</strong> {account.email}</p>
                    <p><strong>Username:</strong> {account.role === 'admin' ? 'admin' : account.role === 'restaurant_cashier' ? 'cashier' : account.role === 'store_keeper' ? 'storekeeper' : account.role === 'authorising_officer' ? 'officer' : 'barman'}</p>
                    <p><strong>Password:</strong> {account.role === 'admin' ? 'admin123' : account.role === 'restaurant_cashier' ? 'cashier123' : account.role === 'store_keeper' ? 'store123' : account.role === 'authorising_officer' ? 'officer123' : 'bar123'}</p>
                    <p><strong>Access:</strong> {roleDisplay.access}</p>
                  </div>
                  
                  <Button 
                    className={`w-full text-white text-sm ${roleDisplay.buttonColor}`}
                    onClick={() => switchAccountMutation.mutate(account.id)}
                    disabled={switchAccountMutation.isPending}
                  >
                    {switchAccountMutation.isPending ? "Switching..." : "Switch to This Account"}
                  </Button>
                </div>
              );
            }) || (
              <div className="col-span-2 text-center text-gray-500 py-8">
                No test accounts available
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-3"></i>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Testing Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Click "Switch to This Account" to test different user roles</li>
                <li>Each role has different navigation options and permissions</li>
                <li>K.O.T numbers are automatically generated (REST-XXX for restaurant, BAR-XXX for bar)</li>
                <li>Stock levels automatically update when orders are processed</li>
                <li>Use the role selector in sidebar to simulate different views</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
