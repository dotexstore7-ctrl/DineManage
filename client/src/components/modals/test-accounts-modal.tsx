import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TestAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestAccountsModal({ isOpen, onClose }: TestAccountsModalProps) {
  const testAccounts = [
    {
      role: "admin",
      title: "Administrator",
      icon: "fas fa-crown",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
      email: "admin@restaurant.com",
      password: "admin123",
      access: "Full system access, user management, menu management",
    },
    {
      role: "restaurant_cashier",
      title: "Restaurant Cashier",
      icon: "fas fa-cash-register",
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      buttonColor: "bg-green-600 hover:bg-green-700",
      email: "cashier@restaurant.com",
      password: "cashier123",
      access: "Create restaurant K.O.Ts, generate bills, reverse orders",
    },
    {
      role: "store_keeper",
      title: "Store Keeper",
      icon: "fas fa-warehouse",
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      buttonColor: "bg-purple-600 hover:bg-purple-700",
      email: "storekeeper@restaurant.com",
      password: "store123",
      access: "Manage stock, process K.O.Ts, approve ingredient requests",
    },
    {
      role: "authorising_officer",
      title: "Authorising Officer",
      icon: "fas fa-clipboard-check",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600",
      buttonColor: "bg-yellow-600 hover:bg-yellow-700",
      email: "officer@restaurant.com",
      password: "officer123",
      access: "Monitor stock & sales, approve reversals, generate reports",
    },
    {
      role: "barman",
      title: "Barman",
      icon: "fas fa-cocktail",
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      buttonColor: "bg-red-600 hover:bg-red-700",
      email: "barman@restaurant.com",
      password: "bar123",
      access: "Create bar K.O.Ts, generate bills, customer-wise billing",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Accounts</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {testAccounts.map((account) => (
            <div key={account.role} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <div className={`w-8 h-8 ${account.bgColor} rounded-full flex items-center justify-center mr-3`}>
                  <i className={`${account.icon} ${account.iconColor}`}></i>
                </div>
                <h4 className="font-semibold text-gray-900">{account.title}</h4>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1 mb-3">
                <p><strong>Username:</strong> {account.email}</p>
                <p><strong>Password:</strong> {account.password}</p>
                <p><strong>Access:</strong> {account.access}</p>
              </div>
              
              <Button 
                className={`w-full text-white text-sm ${account.buttonColor}`}
                onClick={() => {
                  // For demo purposes, we'll just show a message
                  // In a real app, you might want to auto-fill login forms
                  alert(`Login credentials:\nEmail: ${account.email}\nPassword: ${account.password}`);
                }}
              >
                View Login Info
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-3"></i>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Testing Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Use the role selector in the sidebar to switch between different user views</li>
                <li>Each role has different navigation options and permissions</li>
                <li>K.O.T numbers are automatically generated (REST-XXX for restaurant, BAR-XXX for bar)</li>
                <li>Stock levels automatically update when orders are processed</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
