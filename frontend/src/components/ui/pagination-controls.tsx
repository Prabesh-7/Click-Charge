import { Button } from "@/components/ui/button";

type PaginationControlsProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  className?: string;
};

export function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  startItem,
  endItem,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationControlsProps) {
  if (totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <p className="text-xs text-gray-600 sm:text-sm">
        Showing {startItem} to {endItem} of {totalItems}
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium text-gray-600 sm:text-sm">
          Rows
        </label>
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          className="h-9 rounded-md border border-gray-300 bg-white px-2 text-xs text-gray-900 outline-none ring-green-600 focus:ring-1 sm:text-sm"
        >
          {pageSizeOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>

        <span className="min-w-24 text-center text-xs font-medium text-gray-700 sm:text-sm">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
