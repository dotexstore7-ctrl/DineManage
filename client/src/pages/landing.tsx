import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LandingProps {
  onShowDemo?: () => void;
}

export default function Landing({ onShowDemo }: LandingProps) {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-utensils text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">RestaurantPro</h1>
            <p className="text-gray-600 mb-6">
              Comprehensive restaurant management system with role-based access control
            </p>
            <div className="space-y-3">
              <Button onClick={handleLogin} className="w-full">
                Sign In with Replit
              </Button>
              <Button onClick={onShowDemo} variant="outline" className="w-full">
                Try Demo with Test Accounts
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
