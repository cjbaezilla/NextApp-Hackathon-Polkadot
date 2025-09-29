export const UNISWAP_V2_ADDRESSES = {
  FACTORY: process.env.NEXT_PUBLIC_UNISWAP_V2_FACTORY_ADDRESS!,
  ROUTER: process.env.NEXT_PUBLIC_UNISWAP_V2_ROUTER_ADDRESS!,
  WETH: process.env.NEXT_PUBLIC_WETH_ADDRESS!,
} as const;

export const TOKEN_DECIMALS = 18;
export const SLIPPAGE_TOLERANCE = 5; // 5%
export const DEADLINE_BUFFER = 3600; // 1 hour in seconds

// Common token symbols for display
export const TOKEN_SYMBOLS = {
  [UNISWAP_V2_ADDRESSES.WETH]: 'WETH',
} as const;
