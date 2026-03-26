import { useEffect, useState } from "react";
import {
  getMyStaff,
  updateStaff,
  deleteStaff,
  type ManagerStaff,
} from "@/api/managerApi";
import { Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState as useFormState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createStaffSchema,
  type CreateStaffSchema,
} from "@/lib/schema/CreateStaffSchema";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";

export default function MyStaff() {
  const [staffMembers, setStaffMembers] = useState<ManagerStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<ManagerStaff | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<CreateStaffSchema>({
    resolver: zodResolver(createStaffSchema),
  });

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

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleEditClick = (staff: ManagerStaff) => {
    setEditingStaff(staff);
    setValue("user_name", staff.user_name);
    setValue("email", staff.email);
    setValue("password", "");
    setValue("phone_number", staff.phone_number || "");
    setValue("vehicle", staff.vehicle || "");
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingStaff(null);
    reset();
  };

  const onSubmit = async (data: CreateStaffSchema) => {
    if (!editingStaff) return;

    try {
      setIsSubmitting(true);
      await updateStaff(editingStaff.user_id, data);
      alert("Staff member updated successfully!");
      handleCloseModal();
      await fetchStaff();
    } catch (error: any) {
      console.error(
        "Failed to update staff:",
        error.response?.data || error.message,
      );
      alert("Failed to update staff member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      await deleteStaff(userId);
      alert("Staff member deleted successfully!");
      await fetchStaff();
    } catch (error: any) {
      console.error(
        "Failed to delete staff:",
        error.response?.data || error.message,
      );
      alert("Failed to delete staff member. Please try again.");
    }
  };

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
                    <th className="px-4 py-3 text-left font-semibold">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map((staff) => (
                    <tr
                      key={staff.user_id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">{staff.user_name}</td>
                      <td className="px-4 py-3">{staff.email}</td>
                      <td className="px-4 py-3">{staff.phone_number || "-"}</td>
                      <td className="px-4 py-3">
                        {new Date(staff.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => handleEditClick(staff)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit staff"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(staff.user_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete staff"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showEditModal && editingStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Edit Staff
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Username
                </FieldLabel>
                <Input
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="e.g. staffuser"
                  {...register("user_name")}
                />
                {errors.user_name && (
                  <p className="text-sm text-red-500">
                    {errors.user_name.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">Email</FieldLabel>
                <Input
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="staff@example.com"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    className="h-10 border-[#B6B6B6] pr-12"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters (leave empty to keep current)"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Phone Number
                </FieldLabel>
                <Input
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="e.g. 9800000000"
                  {...register("phone_number")}
                />
                {errors.phone_number && (
                  <p className="text-sm text-red-500">
                    {errors.phone_number.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-base font-medium">
                  Vehicle (optional)
                </FieldLabel>
                <Input
                  className="h-10 border border-[#B6B6B6]"
                  placeholder="e.g. Hyundai Kona"
                  {...register("vehicle")}
                />
                {errors.vehicle && (
                  <p className="text-sm text-red-500">
                    {errors.vehicle.message}
                  </p>
                )}
              </Field>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 h-10 bg-gray-200 text-gray-900 hover:bg-gray-300"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-10 bg-green-400"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
