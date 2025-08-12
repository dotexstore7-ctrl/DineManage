import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import TestCredentialsDisplay from "@/components/test-credentials-display";

interface DemoLoginProps {
  onLogin: () => void;
}

export default function DemoLogin({ onLogin }: DemoLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const testAccounts = [
    { username: "admin", password: "admin123", role: "Administrator", description: "Full system access" },
    { username: "cashier", password: "cashier123", role: "Restaurant Cashier", description: "Create K.O.Ts and billing" },
    { username: "storekeeper", password: "store123", role: "Store Keeper", description: "Stock management" },
    { username: "officer", password: "officer123", role: "Authorising Officer", description: "Approvals and monitoring" },
    { username: "barman", password: "bar123", role: "Barman", description: "Bar operations" },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        onLogin();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Login failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            RestaurantPro Demo
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Test with different user roles
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Demo Login</CardTitle>
            <CardDescription>
              Choose a test account to explore different role permissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Test Accounts</span>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {testAccounts.map((account) => (
                  <div
                    key={account.username}
                    className="flex items-center justify-between p-2 border border-gray-200 rounded cursor-pointer hover:bg-gray-50"
                    onClick={() => fillCredentials(account.username, account.password)}
                  >
                    <div>
                      <p className="text-sm font-medium">{account.role}</p>
                      <p className="text-xs text-gray-500">{account.description}</p>
                    </div>
                    <div className="text-xs text-gray-400">
                      {account.username} / {account.password}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <TestCredentialsDisplay />
      </div>

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500">
          This is a demonstration system. In production, use secure authentication.
        </p>
      </div>
    </div>
  );
}