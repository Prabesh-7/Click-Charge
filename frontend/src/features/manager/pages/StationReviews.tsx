import { useEffect, useMemo, useState } from "react";
import {
  getManagerStationReviews,
  getManagerStationReviewSummary,
  type ManagerStationReview,
  type ManagerStationReviewSummary,
} from "@/api/managerApi";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useClientPagination } from "@/hooks/useClientPagination";
import { MessageSquare, Search, Star } from "lucide-react";

export default function StationReviews() {
  const [reviews, setReviews] = useState<ManagerStationReview[]>([]);
  const [summary, setSummary] = useState<ManagerStationReviewSummary | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reviewData, summaryData] = await Promise.all([
          getManagerStationReviews(),
          getManagerStationReviewSummary(),
        ]);
        setReviews(reviewData);
        setSummary(summaryData);
        setError(null);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ||
            "Failed to load station reviews. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []);

  const filteredReviews = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return reviews;
    }

    return reviews.filter((review) => {
      const name = (review.user_name || "").toLowerCase();
      const email = (review.user_email || "").toLowerCase();
      const text = (review.review_text || "").toLowerCase();
      return (
        name.includes(normalizedQuery) ||
        email.includes(normalizedQuery) ||
        text.includes(normalizedQuery)
      );
    });
  }, [reviews, query]);

  const {
    paginatedItems: paginatedReviews,
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    startItem,
    endItem,
    pageSizeOptions,
    setCurrentPage,
    setPageSize,
  } = useClientPagination(filteredReviews, {
    initialPageSize: 5,
    pageSizeOptions: [5, 10, 20],
    resetOnChange: [query],
  });

  return (
    <main className="min-h-screen bg-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Station Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          View customer ratings and feedback for your station.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-8 text-center text-gray-500">Loading reviews...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm text-amber-700">
                <Star size={16} className="fill-amber-400 text-amber-500" />
                <span>Average Rating</span>
              </div>
              <p className="text-xl font-semibold text-amber-900">
                {summary && summary.review_count > 0
                  ? `${summary.average_rating.toFixed(1)} / 5`
                  : "No ratings yet"}
              </p>
            </div>

            <div className="rounded-md border border-gray-200 bg-white p-4">
              <div className="mb-1 flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare size={16} />
                <span>Total Reviews</span>
              </div>
              <p className="text-xl font-semibold text-gray-900">
                {summary?.review_count ?? 0}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-gray-200 bg-white p-4">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by user name, email, or review text"
                className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm text-gray-900 outline-none focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              No reviews found.
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
              <div className="space-y-4 p-4">
                {paginatedReviews.map((review) => (
                  <article
                    key={review.review_id}
                    className="rounded-md border border-gray-200 bg-white p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {review.user_name || "User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {review.user_email || "Email not available"}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                        <Star
                          size={13}
                          className="fill-amber-400 text-amber-500"
                        />
                        {review.rating}/5
                      </span>
                    </div>

                    <p className="mt-3 text-sm text-gray-700">
                      {review.review_text || "No written feedback."}
                    </p>

                    <p className="mt-2 text-xs text-gray-500">
                      Updated {new Date(review.updated_at).toLocaleString()}
                    </p>
                  </article>
                ))}
              </div>
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={totalItems}
                startItem={startItem}
                endItem={endItem}
                pageSizeOptions={pageSizeOptions}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
