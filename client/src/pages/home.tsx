import { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AdminDashboard from "@/components/dashboard/admin-dashboard";
import StoreKeeperDashboard from "@/components/dashboard/store-keeper-dashboard";
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
            {user.role === "admin" && <AdminDashboard />}
            {user.role === "restaurant_cashier" && (
              <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Restaurant Cashier Dashboard
                </h2>
                <p className="text-gray-600">
                  Cashier features coming soon...
                </p>
              </div>
            )}
            {user.role === "store_keeper" && <StoreKeeperDashboard />}
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