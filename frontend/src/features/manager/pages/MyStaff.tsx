import { useEffect, useState } from "react";
import {
  getMyStaff,
  updateStaff,
  deleteStaff,
  createStaff,
  type ManagerStaff,
} from "@/api/managerApi";
import { Edit2, Trash2, Plus } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function MyStaff() {
  const [staffMembers, setStaffMembers] = useState<ManagerStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStaff, setEditingStaff] = useState<ManagerStaff | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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

  const {
    register: registerAdd,
    handleSubmit: handleSubmitAdd,
    formState: { errors: addErrors, isSubmitting: isAddSubmitting },
    reset: resetAdd,
  } = useForm<CreateStaffSchema>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: {
      user_name: "",
      email: "",
      password: "",
      phone_number: "",
      vehicle: "",
    },
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

  const handleAddClick = () => {
    resetAdd();
    setShowAddModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetAdd();
  };

  const onSubmit = async (data: CreateStaffSchema) => {
    if (!editingStaff) return;

    try {
      setIsSubmitting(true);
      await updateStaff(editingStaff.user_id, data);
      toast.success("Staff updated successfully.");
      handleCloseModal();
      await fetchStaff();
    } catch (error: any) {
      console.error(
        "Failed to update staff:",
        error.response?.data || error.message,
      );
      toast.error("Failed to update staff member. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitAdd = async (data: CreateStaffSchema) => {
    try {
      await createStaff(data);
      toast.success("Staff added successfully.");
      handleCloseAddModal();
      await fetchStaff();
    } catch (error: any) {
      console.error(
        "Failed to add staff:",
        error.response?.data || error.message,
      );
      toast.error("Failed to add staff member. Please try again.");
    }
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this staff member?")) {
      return;
    }

    try {
      await deleteStaff(userId);
      toast.success("Staff deleted successfully.");
      await fetchStaff();
    } catch (error: any) {
      console.error(
        "Failed to delete staff:",
        error.response?.data || error.message,
      );
      toast.error("Failed to delete staff member. Please try again.");
    }
  };

  return (
    <main className="p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">My Staff</h1>
          <p className="text-sm text-gray-500 mt-1">
            Staff members assigned to your station.
          </p>
        </div>
        {staffMembers.length > 0 && (
          <button
            onClick={handleAddClick}
            className="shrink-0 h-11 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Add Staff
          </button>
        )}
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
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Edit2 size={22} />
              </div>
              <p className="text-base font-semibold text-gray-700 mb-6">
                No staff members found. Add your first staff member to get
                started.
              </p>
              <button
                onClick={handleAddClick}
                className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Add Staff Member
              </button>
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

      {showAddModal && (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Add Staff Member
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmitAdd(onSubmitAdd)} className="space-y-6">
              <Field className="gap-2">
                <FieldLabel className="text-sm font-medium text-gray-700">
                  Username
                </FieldLabel>
                <Input
                  className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. staffuser"
                  {...registerAdd("user_name")}
                />
                {addErrors.user_name && (
                  <p className="text-xs text-red-600 mt-1">
                    {addErrors.user_name.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-sm font-medium text-gray-700">
                  Email
                </FieldLabel>
                <Input
                  className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="staff@example.com"
                  {...registerAdd("email")}
                />
                {addErrors.email && (
                  <p className="text-xs text-red-600 mt-1">
                    {addErrors.email.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-sm font-medium text-gray-700">
                  Password
                </FieldLabel>
                <div className="relative">
                  <Input
                    className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400 pr-12"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    {...registerAdd("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors p-1"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {addErrors.password && (
                  <p className="text-xs text-red-600 mt-1">
                    {addErrors.password.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-sm font-medium text-gray-700">
                  Phone Number
                </FieldLabel>
                <Input
                  className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. 9800000000"
                  {...registerAdd("phone_number")}
                />
                {addErrors.phone_number && (
                  <p className="text-xs text-red-600 mt-1">
                    {addErrors.phone_number.message}
                  </p>
                )}
              </Field>

              <Field className="gap-2">
                <FieldLabel className="text-sm font-medium text-gray-700">
                  Vehicle (optional)
                </FieldLabel>
                <Input
                  className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="e.g. Hyundai Kona"
                  {...registerAdd("vehicle")}
                />
                {addErrors.vehicle && (
                  <p className="text-xs text-red-600 mt-1">
                    {addErrors.vehicle.message}
                  </p>
                )}
              </Field>

              <DialogFooter className="gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseAddModal}
                  className="h-10"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isAddSubmitting}
                  className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isAddSubmitting ? "Adding..." : "Add Staff"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
