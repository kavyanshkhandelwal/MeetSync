export type CreateRoomInput = {
  name: string;
  capacity: number;
  floor: number;
  building: string;
  description?: string;
  equipments: string[];
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
};

export type UpdateRoomInput = Partial<CreateRoomInput>;

export type GetRoomsQuery = {
  page?: number;
  limit?: number;
  search?: string;
  building?: string;
  floor?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export type PaginatedRoomsResponse = {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};
