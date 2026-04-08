import api from "./axiosInstance";

const authHeader = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export interface StationReview {
  review_id: number;
  station_id: number;
  user_id: number;
  user_name?: string | null;
  rating: number;
  review_text?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StationReviewSummary {
  station_id: number;
  average_rating: number;
  review_count: number;
  my_rating?: number | null;
  my_review_text?: string | null;
}

export interface StationReviewPayload {
  rating: number;
  review_text?: string;
}

export const upsertStationReview = async (
  stationId: number,
  payload: StationReviewPayload,
): Promise<StationReview> => {
  const { data } = await api.post<StationReview>(
    `/user/stations/${stationId}/review`,
    payload,
    { headers: authHeader() },
  );
  return data;
};

export const getStationReviews = async (
  stationId: number,
): Promise<StationReview[]> => {
  const { data } = await api.get<StationReview[]>(
    `/user/stations/${stationId}/reviews`,
    { headers: authHeader() },
  );
  return data;
};

export const getStationReviewSummary = async (
  stationId: number,
): Promise<StationReviewSummary> => {
  const { data } = await api.get<StationReviewSummary>(
    `/user/stations/${stationId}/reviews/summary`,
    { headers: authHeader() },
  );
  return data;
};
