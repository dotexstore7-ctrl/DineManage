import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const testCredentials = [
  {
    role: "Administrator",
    username: "admin",
    password: "admin123",
    description: "Full system access, user management, menu management",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    icon: "fas fa-crown"
  },
  {
    role: "Restaurant Cashier", 
    username: "cashier",
    password: "cashier123",
    description: "Create restaurant K.O.Ts, generate bills, reverse orders",
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    icon: "fas fa-cash-register"
  },
  {
    role: "Store Keeper",
    username: "storekeeper", 
    password: "store123",
    description: "Manage stock, process K.O.Ts, approve ingredient requests",
    bgColor: "bg-purple-100",
    iconColor: "text-purple-600",
    icon: "fas fa-warehouse"
  },
  {
    role: "Authorising Officer",
    username: "officer",
    password: "officer123", 
    description: "Monitor stock & sales, approve reversals, generate reports",
    bgColor: "bg-yellow-100",
    iconColor: "text-yellow-600",
    icon: "fas fa-clipboard-check"
  },
  {
    role: "Barman",
    username: "barman",
    password: "bar123",
    description: "Create bar K.O.Ts, generate bills, customer-wise billing", 
    bgColor: "bg-red-100",
    iconColor: "text-red-600",
    icon: "fas fa-cocktail"
  }
];

export default function TestCredentialsDisplay() {
  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Test Account Credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testCredentials.map((account) => (
              <div key={account.username} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center mb-2">
                  <div className={`w-8 h-8 ${account.bgColor} rounded-full flex items-center justify-center mr-3`}>
                    <i className={`${account.icon} ${account.iconColor} text-sm`}></i>
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">{account.role}</h4>
                </div>
                
                <div className="text-xs text-gray-600 space-y-1 mb-3">
                  <div className="bg-gray-50 p-2 rounded border">
                    <p><strong>Username:</strong> <code className="bg-gray-200 px-1 rounded">{account.username}</code></p>
                    <p><strong>Password:</strong> <code className="bg-gray-200 px-1 rounded">{account.password}</code></p>
                  </div>
                  <p className="text-xs">{account.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-2 text-sm"></i>
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Instructions:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Use any username/password combination above to test different roles</li>
                  <li>Each role has unique permissions and interface elements</li>
                  <li>K.O.T numbers auto-generate (REST-XXX for restaurant, BAR-XXX for bar)</li>
                  <li>Stock levels update automatically when orders are processed</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}