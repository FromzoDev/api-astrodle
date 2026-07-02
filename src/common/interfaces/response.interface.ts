export interface ApiResponse<Data>{
    code: number;
    message: string;
    data: Data;
};