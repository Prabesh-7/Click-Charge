import api from "./axiosInstance";

const authHeader = () => {
  const token = localStorage.getItem("access_token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};

export interface WalletSummary {
  wallet_id: number;
  user_id: number;
  balance: number;
  updated_at?: string | null;
}

export type EsewaFormFields = Record<string, string>;

export interface EsewaInitResponse {
  action_url: string;
  fields: EsewaFormFields;
}

export interface EsewaConfirmResponse {
  message: string;
  balance: number;
  transaction_uuid: string;
}

export interface WalletPayResponse {
  message: string;
  balance: number;
  debited_amount: number;
}

export const getWalletSummary = async () => {
  const { data } = await api.get<WalletSummary>("/user/wallet", {
    headers: authHeader(),
  });
  return data;
};

export const initiateEsewaTopup = async (amount: number) => {
  const { data } = await api.post<EsewaInitResponse>(
    "/user/wallet/esewa/initiate",
    { amount },
    {
      headers: authHeader(),
    },
  );
  return data;
};

export const confirmEsewaTopup = async (encodedData: string) => {
  const { data } = await api.post<EsewaConfirmResponse>(
    "/user/wallet/esewa/confirm",
    { data: encodedData },
    {
      headers: authHeader(),
    },
  );
  return data;
};

export const payFromWallet = async (
  amount: number,
  description?: string,
  reference?: string,
) => {
  const { data } = await api.post<WalletPayResponse>(
    "/user/wallet/pay",
    { amount, description, reference },
    {
      headers: authHeader(),
    },
  );
  return data;
};
