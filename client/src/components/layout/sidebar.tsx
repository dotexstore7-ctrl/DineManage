import { User } from "@shared/schema";

interface SidebarProps {
  selectedRole: string;
  onRoleChange: (role: string) => void;
  activeMenuItem: string;
  onMenuItemChange: (item: string) => void;
  user: User;
}

export default function Sidebar({ 
  selectedRole, 
  onRoleChange, 
  activeMenuItem, 
  onMenuItemChange,
  user 
}: SidebarProps) {
  const roleOptions = [
    { value: "admin", label: "Admin" },
    { value: "restaurant_cashier", label: "Restaurant Cashier" },
    { value: "store_keeper", label: "Store Keeper" },
    { value: "authorising_officer", label: "Authorising Officer" },
    { value: "barman", label: "Barman" },
  ];

  const getNavigationItems = (role: string) => {
    switch (role) {
      case "admin":
        return [
          { id: "dashboard", icon: "fas fa-tachometer-alt", label: "Dashboard" },
          { id: "users", icon: "fas fa-users", label: "User Management" },
          { id: "menus", icon: "fas fa-utensils", label: "Menu Management" },
          { id: "ingredients", icon: "fas fa-list", label: "Ingredients & Scales" },
          { id: "reports", icon: "fas fa-chart-bar", label: "System Reports" },
        ];
      case "restaurant_cashier":
        return [
          { id: "dashboard", icon: "fas fa-tachometer-alt", label: "Dashboard" },
          { id: "create-kot", icon: "fas fa-receipt", label: "Create K.O.T" },
          { id: "orders", icon: "fas fa-clipboard-list", label: "My Orders" },
          { id: "bills", icon: "fas fa-file-invoice", label: "Generate Bills" },
        ];
      case "store_keeper":
        return [
          { id: "dashboard", icon: "fas fa-tachometer-alt", label: "Dashboard" },
          { id: "stock", icon: "fas fa-warehouse", label: "Stock Management" },
          { id: "pending-kots", icon: "fas fa-clock", label: "Pending K.O.Ts" },
          { id: "stock-additions", icon: "fas fa-plus-circle", label: "Add Stock" },
        ];
      case "authorising_officer":
        return [
          { id: "dashboard", icon: "fas fa-tachometer-alt", label: "Dashboard" },
          { id: "approvals", icon: "fas fa-check-circle", label: "Pending Approvals" },
          { id: "reports", icon: "fas fa-chart-line", label: "Reports" },
          { id: "stock-monitor", icon: "fas fa-eye", label: "Stock Monitor" },
        ];
      case "barman":
        return [
          { id: "dashboard", icon: "fas fa-tachometer-alt", label: "Dashboard" },
          { id: "create-kot", icon: "fas fa-cocktail", label: "Create Bar K.O.T" },
          { id: "orders", icon: "fas fa-clipboard-list", label: "My Orders" },
          { id: "customer-bills", icon: "fas fa-user-tie", label: "Customer Bills" },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems(selectedRole);

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-primary-500">
          <h1 className="text-xl font-bold text-white">RestaurantPro</h1>
        </div>
        
        {/* Role Selector */}
        <div className="px-4 py-3 border-b border-gray-200">
          <label className="block text-xs font-medium text-gray-500 mb-1">Current Role</label>
          <select 
            value={selectedRole}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onMenuItemChange(item.id)}
              className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeMenuItem === item.id
                  ? "bg-primary-50 text-primary-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <i className={`${item.icon} mr-3`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="px-4 py-3 border-t border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {user.profileImageUrl ? (
                <img 
                  src={user.profileImageUrl} 
                  alt={user.firstName || "User"} 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <i className="fas fa-user text-primary-600"></i>
                </div>
              )}
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {roleOptions.find(r => r.value === user.role)?.label}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
