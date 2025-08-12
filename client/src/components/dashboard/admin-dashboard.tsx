import React, { useState } from "react";
import StatsCards from "./stats-cards";
import RecentOrders from "./recent-orders";
import SystemAlerts from "./system-alerts";

export default function AdminDashboard() {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const handleQuickAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    setActiveModal(action);
  };

  return (
    <div>
      <StatsCards />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2">
          <RecentOrders />
        </div>
        <div>
          <SystemAlerts />
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => handleQuickAction('createUser')}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
        >
          <i className="fas fa-user-plus text-blue-500 text-2xl mb-2"></i>
          <p className="text-sm font-medium text-gray-900">Create User</p>
        </button>
        
        <button 
          onClick={() => handleQuickAction('addMenuItem')}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
        >
          <i className="fas fa-plus-circle text-green-500 text-2xl mb-2"></i>
          <p className="text-sm font-medium text-gray-900">Add Menu Item</p>
        </button>
        
        <button 
          onClick={() => handleQuickAction('viewReports')}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
        >
          <i className="fas fa-chart-line text-purple-500 text-2xl mb-2"></i>
          <p className="text-sm font-medium text-gray-900">View Reports</p>
        </button>
        
        <button 
          onClick={() => handleQuickAction('manageStock')}
          className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
        >
          <i className="fas fa-warehouse text-orange-500 text-2xl mb-2"></i>
          <p className="text-sm font-medium text-gray-900">Manage Stock</p>
        </button>
      </div>
      
      {/* Modals */}
      {activeModal === 'createUser' && (
        <CreateUserModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'addMenuItem' && (
        <CreateMenuItemModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'manageStock' && (
        <ManageStockModal onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'viewReports' && (
        <ViewReportsModal onClose={() => setActiveModal(null)} />
      )}
    </div>
  );
}
