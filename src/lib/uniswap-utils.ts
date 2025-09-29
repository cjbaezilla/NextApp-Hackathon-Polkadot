import { parseEther, formatEther, formatUnits, parseUnits } from 'viem';
import { TOKEN_DECIMALS } from './constants';

/**
 * Convert human-readable amount to wei (for 18-decimal tokens)
 * @param amount - String amount like "1.5"
 * @returns BigInt in wei
 */
export function toWei(amount: string): bigint {
  if (!amount || amount === '0') return 0n;
  try {
    return parseEther(amount);
  } catch (error) {
    throw new Error(`Invalid amount format: ${amount}`);
  }
}

/**
 * Convert wei to human-readable format (for 18-decimal tokens)
 * @param wei - BigInt amount in wei
 * @returns Formatted string
 */
export function fromWei(wei: bigint): string {
  return formatEther(wei);
}

/**
 * Convert token amount considering decimals
 * @param amount - String amount
 * @param decimals - Token decimals (default 18)
 * @returns BigInt
 */
export function toTokenUnits(amount: string, decimals: number = TOKEN_DECIMALS): bigint {
  if (!amount || amount === '0') return 0n;
  try {
    return parseUnits(amount, decimals);
  } catch (error) {
    throw new Error(`Invalid amount format: ${amount}`);
  }
}

/**
 * Format token amount considering decimals
 * @param units - BigInt token units
 * @param decimals - Token decimals (default 18)
 * @returns Formatted string
 */
export function fromTokenUnits(units: bigint, decimals: number = TOKEN_DECIMALS): string {
  return formatUnits(units, decimals);
}

/**
 * Calculate minimum amount out with slippage tolerance
 * @param amountOut - Expected amount out
 * @param slippagePercent - Slippage percentage (default 5%)
 * @returns Minimum amount out
 */
export function calculateMinAmountOut(amountOut: bigint, slippagePercent: number = 5): bigint {
  const slippageBps = BigInt(slippagePercent * 100); // Convert to basis points
  const slippageAmount = (amountOut * slippageBps) / 10000n;
  return amountOut - slippageAmount;
}

/**
 * Calculate maximum amount in with slippage tolerance
 * @param amountIn - Expected amount in
 * @param slippagePercent - Slippage percentage (default 5%)
 * @returns Maximum amount in
 */
export function calculateMaxAmountIn(amountIn: bigint, slippagePercent: number = 5): bigint {
  const slippageBps = BigInt(slippagePercent * 100);
  const slippageAmount = (amountIn * slippageBps) / 10000n;
  return amountIn + slippageAmount;
}

/**
 * Get deadline timestamp
 * @param minutesFromNow - Minutes from current time (default 20)
 * @returns Unix timestamp
 */
export function getDeadline(minutesFromNow: number = 20): bigint {
  return BigInt(Math.floor(Date.now() / 1000) + (minutesFromNow * 60));
}

/**
 * Format amount for display with proper precision
 * @param amount - Amount as string or bigint
 * @param decimals - Decimals to show (default 6)
 * @returns Formatted string
 */
export function formatAmount(amount: string | bigint, decimals: number = 6): string {
  const amountStr = typeof amount === 'bigint' ? fromWei(amount) : amount;
  const num = parseFloat(amountStr);
  
  if (num === 0) return '0';
  if (num < 0.000001) return '< 0.000001';
  if (num < 1) return num.toFixed(decimals);
  if (num < 1000) return num.toFixed(4);
  if (num < 1000000) return `${(num / 1000).toFixed(2)}K`;
  return `${(num / 1000000).toFixed(2)}M`;
}
