import { useState } from "react";
import { Button } from "@/components/ui/button";

interface FloatingActionButtonProps {
  onCreateKOT: () => void;
  onShowTestAccounts: () => void;
}

export default function FloatingActionButton({ onCreateKOT, onShowTestAccounts }: FloatingActionButtonProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="relative">
        {/* FAB Menu Items */}
        {isMenuOpen && (
          <div className="absolute bottom-16 right-0 space-y-2">
            <Button
              size="sm"
              className="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600 transition-all duration-200"
              onClick={() => {
                onCreateKOT();
                setIsMenuOpen(false);
              }}
              title="Create K.O.T"
            >
              <i className="fas fa-receipt"></i>
            </Button>
            
            <Button
              size="sm"
              className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 transition-all duration-200"
              onClick={() => {
                onShowTestAccounts();
                setIsMenuOpen(false);
              }}
              title="Test Accounts"
            >
              <i className="fas fa-users"></i>
            </Button>
            
            <Button
              size="sm"
              className="flex items-center justify-center w-12 h-12 bg-purple-500 text-white rounded-full shadow-lg hover:bg-purple-600 transition-all duration-200"
              onClick={() => {
                // TODO: Implement stock modal
                setIsMenuOpen(false);
              }}
              title="Manage Stock"
            >
              <i className="fas fa-boxes"></i>
            </Button>
          </div>
        )}

        {/* Main FAB */}
        <Button
          size="lg"
          className="w-14 h-14 bg-primary-500 text-white rounded-full shadow-lg hover:bg-primary-600 flex items-center justify-center transition-all duration-200"
          onClick={toggleMenu}
        >
          <i className={`fas fa-plus text-xl transition-transform duration-200 ${isMenuOpen ? 'rotate-45' : ''}`}></i>
        </Button>
      </div>
    </div>
  );
}
