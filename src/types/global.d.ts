import { AxiosError, AxiosResponse } from "axios";

declare global {
  type ApiResponse<T = any> = AxiosResponse<T>;
  type ApiError = AxiosError;
}

export {};
