import { Platform, PolyRouterMarket, PolyRouterResponse } from '@/types';

// Rate limiting implementation
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove requests older than the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // If we're at the limit, wait until we can make another request
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }
    
    // Record this request
    this.requests.push(now);
  }
}

// API Client class
export class PolyRouterClient {
  private readonly baseUrl = 'https://api.polyrouter.io/functions/v1';
  private readonly apiKey: string;
  private readonly rateLimiter: RateLimiter;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.rateLimiter = new RateLimiter(10, 1000); // 10 requests per second
  }

  private async makeRequest<T>(
    endpoint: string,
    params: Record<string, string | number | boolean> = {}
  ): Promise<T> {
    await this.rateLimiter.waitForSlot();

    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.makeRequest<T>(endpoint, params);
      }
      
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get markets from all platforms or specific platform
  async getMarkets(
    platform?: Platform,
    limit: number = 50,
    offset: number = 0,
    status?: string
  ): Promise<PolyRouterResponse<PolyRouterMarket>> {
    const params: Record<string, string | number> = {
      limit,
      offset,
    };

    if (platform) {
      params.platform = platform;
    }

    if (status) {
      params.status = status;
    }

    const response = await this.makeRequest<any>('/markets-v2', params);
    
    // Transform the response to match our expected format
    return {
      data: response.markets || [],
      pagination: response.pagination || { total: 0, limit, offset, has_more: false },
      meta: response.meta || {}
    };
  }

  // Get market details by ID
  async getMarketDetails(marketId: string): Promise<PolyRouterMarket> {
    return this.makeRequest<PolyRouterMarket>(`/markets-v2/${marketId}`);
  }

  // Get price history for markets
  async getPriceHistory(
    marketIds: string[],
    interval: '1m' | '5m' | '1h' | '4h' | '1d' = '1h',
    limit: number = 24
  ): Promise<PolyRouterResponse<any>> {
    return this.makeRequest<PolyRouterResponse<any>>('/price-history-v2', {
      market_ids: marketIds.join(','),
      interval,
      limit,
    });
  }

  // Search markets across platforms
  async searchMarkets(
    query: string,
    platform?: Platform,
    limit: number = 20
  ): Promise<PolyRouterResponse<PolyRouterMarket>> {
    const params: Record<string, string | number> = {
      q: query,
      limit,
    };

    if (platform) {
      params.platform = platform;
    }

    return this.makeRequest<PolyRouterResponse<PolyRouterMarket>>(
      '/search-markets',
      params
    );
  }

  // Get events (if available)
  async getEvents(
    platform?: Platform,
    limit: number = 20
  ): Promise<PolyRouterResponse<any>> {
    const params: Record<string, string | number> = { limit };
    if (platform) {
      params.platform = platform;
    }

    return this.makeRequest<PolyRouterResponse<any>>('/events', params);
  }

  // Get series (if available)
  async getSeries(
    platform?: Platform,
    limit: number = 20
  ): Promise<PolyRouterResponse<any>> {
    const params: Record<string, string | number> = { limit };
    if (platform) {
      params.platform = platform;
    }

    return this.makeRequest<PolyRouterResponse<any>>('/series', params);
  }
}

// Create singleton instance
const polyRouterClient = new PolyRouterClient(
  process.env.POLYROUTER_API_KEY || ''
);

export default polyRouterClient;
