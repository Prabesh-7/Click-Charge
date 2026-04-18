import { useEffect, useMemo, useState } from "react";

type UseClientPaginationOptions = {
  initialPageSize?: number;
  pageSizeOptions?: number[];
  resetOnChange?: unknown[];
};

export type UseClientPaginationResult<T> = {
  paginatedItems: T[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
  pageSizeOptions: number[];
  setCurrentPage: (page: number) => void;
  setPageSize: (size: number) => void;
};

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function useClientPagination<T>(
  items: T[],
  options?: UseClientPaginationOptions,
): UseClientPaginationResult<T> {
  const pageSizeOptions =
    options?.pageSizeOptions?.length &&
    options.pageSizeOptions.every((value) => value > 0)
      ? options.pageSizeOptions
      : DEFAULT_PAGE_SIZE_OPTIONS;

  const initialPageSize =
    options?.initialPageSize && options.initialPageSize > 0
      ? options.initialPageSize
      : pageSizeOptions[0];

  const [currentPage, setCurrentPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPageState(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!options?.resetOnChange?.length) {
      return;
    }

    setCurrentPageState(1);
  }, options?.resetOnChange ?? []);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [items, currentPage, pageSize]);

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const setCurrentPage = (page: number) => {
    if (!Number.isFinite(page)) {
      return;
    }

    const normalized = Math.min(Math.max(1, Math.trunc(page)), totalPages);
    setCurrentPageState(normalized);
  };

  const setPageSize = (size: number) => {
    if (!Number.isFinite(size) || size <= 0) {
      return;
    }

    setPageSizeState(Math.trunc(size));
    setCurrentPageState(1);
  };

  return {
    paginatedItems,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startItem,
    endItem,
    pageSizeOptions,
    setCurrentPage,
    setPageSize,
  };
}
