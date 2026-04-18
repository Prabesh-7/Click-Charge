import CreateManagerStationForm from "@/features/admin/components/CreateManagerStationForm";

export default function CreateManagerStation() {
  return (
    <main className="container mx-auto mt-5 max-w-3xl px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Create Manager & Station
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the details below to register a new manager and charging
          station.
        </p>
      </div>

      <CreateManagerStationForm />
    </main>
  );
}
