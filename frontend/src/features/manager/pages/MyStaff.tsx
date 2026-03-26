import { useEffect, useState } from "react";
import { getMyStaff, type ManagerStaff } from "@/api/managerApi";

export default function MyStaff() {
  const [staffMembers, setStaffMembers] = useState<ManagerStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const data = await getMyStaff();
        setStaffMembers(data);
        setError(null);
      } catch (err: any) {
        console.error("Failed to load staff:", err.response?.data || err.message);
        setError(err.response?.data?.detail || "Failed to load staff.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaff();
  }, []);

  return (
    <main className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Staff</h1>
        <p className="text-sm text-gray-500 mt-1">
          Staff members assigned to your station.
        </p>
      </div>

      {loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading staff...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white border border-[#B6B6B6] rounded-lg shadow-sm overflow-hidden">
          {staffMembers.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              No staff assigned to your station yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Name</th>
                    <th className="px-4 py-3 text-left font-semibold">Email</th>
                    <th className="px-4 py-3 text-left font-semibold">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map((staff) => (
                    <tr key={staff.user_id} className="border-t">
                      <td className="px-4 py-3">{staff.user_name}</td>
                      <td className="px-4 py-3">{staff.email}</td>
                      <td className="px-4 py-3">{staff.phone_number || "-"}</td>
                      <td className="px-4 py-3">
                        {new Date(staff.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
