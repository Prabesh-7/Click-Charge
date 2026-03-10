export default function StaffDashboard() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <main className="container mx-auto mt-10 p-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome, {user.user_name} 
      </h1>
      <p className="text-sm text-gray-500 mt-1">Staff Dashboard</p>
    </main>
  );
}