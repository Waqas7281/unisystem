import { useEffect, useMemo, useState } from "react";

/**
 * Client-side pagination helper.
 * Slices `items` into pages of `pageSize` and resets to page 1
 * whenever the underlying item count changes (e.g. after a new search/filter).
 */
export default function usePagination(items = [], pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
  }, [totalItems]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    totalPages,
    totalItems,
    pageSize,
    paginatedItems,
  };
}
