import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import CashierDashboard from "@/components/dashboard/cashier-dashboard";
import CreateKOTModal from "@/components/modals/create-kot-modal";
import TestAccountsModal from "@/components/modals/test-accounts-modal";
import FloatingActionButton from "@/components/floating-action-button";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState((user as any)?.role || "admin");
  const [activeMenuItem, setActiveMenuItem] = useState("dashboard");
  const [isKOTModalOpen, setIsKOTModalOpen] = useState(false);
  const [isTestAccountsModalOpen, setIsTestAccountsModalOpen] = useState(false);

  if (!user) return null;

  const renderContent = () => {
    if (selectedRole === "admin" && activeMenuItem === "dashboard") {
      return <AdminDashboard />;
    }

    if (selectedRole === "restaurant_cashier" && activeMenuItem === "dashboard") {
      return <CashierDashboard />;
    }

    switch (activeMenuItem) {
      // Add other menu item cases here for different roles and views
      default:
        // Default content if no specific match
        if (selectedRole === "admin") {
          return <AdminDashboard />;
        }
        if (selectedRole === "restaurant_cashier") {
          return <CashierDashboard />;
        }
        return null; // Or a default message/component
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        activeMenuItem={activeMenuItem}
        onMenuItemChange={setActiveMenuItem}
        user={user as any}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="px-6 py-8">
            {renderContent()}
          </div>
        </main>
      </div>

      <CreateKOTModal
        isOpen={isKOTModalOpen}
        onClose={() => setIsKOTModalOpen(false)}
        userRole={selectedRole}
      />

      <TestAccountsModal
        isOpen={isTestAccountsModalOpen}
        onClose={() => setIsTestAccountsModalOpen(false)}
      />

      <FloatingActionButton
        onCreateKOT={() => setIsKOTModalOpen(true)}
        onShowTestAccounts={() => setIsTestAccountsModalOpen(true)}
      />
    </div>
  );
}