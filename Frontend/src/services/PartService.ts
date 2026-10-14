import api, { ApiRequestOptions } from "@/utils/api";

export type ApiPagination = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type ApiListResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  pagination: ApiPagination;
};

export type Part = {
  id: number;
  part_number: string;
  part_name: string;
  location_id: number;
  location: string;
  timestamp: string;
};

export type PartPayload = Pick<
  Part,
  "part_number" | "part_name" | "location" | "timestamp"
>;

export type PartQuery = {
  page?: number;
  limit?: number;
  search?: string;
};

const normalizeQuery = (query: PartQuery) => ({
  page: query.page,
  limit: query.limit,
  search: query.search,
});

const PartService = {
  getParts: async (query: PartQuery = {}, options?: ApiRequestOptions) => {
    const response = await api.get<ApiListResponse<Part>>("/api/parts", {
      ...options,
      params: normalizeQuery(query),
    });

    return response.data;
  },

  getPart: async (id: number, options?: ApiRequestOptions) => {
    const response = await api.get<{
      success: boolean;
      message: string;
      data: Part;
    }>(`/api/parts/${id}`, options);

    return response.data;
  },

  createPart: async (data: PartPayload, options?: ApiRequestOptions) => {
    const response = await api.post<{
      success: boolean;
      message: string;
      data: Part;
    }>("/api/parts", data, options);

    return response.data;
  },

  updatePart: async (
    id: number,
    data: Partial<PartPayload>,
    options?: ApiRequestOptions
  ) => {
    const response = await api.put<{
      success: boolean;
      message: string;
      data: Part;
    }>(`/api/parts/${id}`, data, options);

    return response.data;
  },

  deletePart: async (id: number, options?: ApiRequestOptions) => {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/api/parts/${id}`,
      options
    );

    return response.data;
  },
};

export default PartService;
