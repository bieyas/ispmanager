import { MockApiAdapter } from './adapters/mock-adapter';
import { RealApiAdapter } from './adapters/real-adapter';
import { ApiAdapter } from './types';

const API_MODE = process.env.NEXT_PUBLIC_API_MODE ?? 'real';

function createApiClient(): ApiAdapter {
  if (API_MODE === 'real') {
    return new RealApiAdapter();
  }

  return new MockApiAdapter();
}

export const apiClient = createApiClient();
