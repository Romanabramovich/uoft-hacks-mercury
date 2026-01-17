import { MockService } from "./mock-service";
// import { RealService } from "./real-service";

// Toggle this implementation when backend is ready
const useMock = true;

export const apiClient = useMock ? new MockService() : new MockService(); // Fallback to mock for now
