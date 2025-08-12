export default function Header() {
  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button className="lg:hidden p-2 text-gray-500 hover:text-gray-700">
            <i className="fas fa-bars"></i>
          </button>
          <h2 className="ml-4 text-2xl font-semibold text-gray-900">Dashboard</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700">
            <i className="fas fa-bell"></i>
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>
          
          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            <i className="fas fa-sign-out-alt mr-2"></i>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
