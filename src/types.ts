/**
 * Represents the final decision and key metrics from the sourcing engine.
 */
export interface SourcingResult {
  verdict: "BUY" | "REJECT";
  /** The stage number (1, 2, or 3) that determined the verdict. */
  stage: 1 | 2 | 3 | null; // Null might indicate rejection before stage 1 if needed, or just use stage 3 reject?
  probabilities: {
    /** Stage 1 probability (Equilibrium pricing). Null if stage not reached or applicable. */
    p1: number | null;
    /** Stage 2 probability (Terapeak adjusted). Null if stage not reached. */
    p_adj: number | null;
    /** Stage 3 probability (Amazon proxy). Null if stage not reached. */
    p_AZ?: number | null;
  };
  metrics: {
    /** Equilibrium Sell-Through Rate from Stage 1. */
    STR_eq: number | null;
    /** Effective competitor count from Stage 2. */
    A_eff: number | null;
    /** Mid-point equilibrium price from Stage 1. */
    P_eq: number | null;
    /** Total number of active listings. */
    activeCount: number;
    /** Total number of sold items. */
    soldCount: number;
    /** Overall Sell-Through Rate (soldCount/activeCount). */
    overallSTR: number;
    /** Terapeak 3-year sales count. */
    terapeak_T: number | null;
    /** Raw Terapeak probability (1 - e^(-T/6)). */
    pTP: number | null;
    /** Minimum price of USED items. */
    Pmin_used: number | null;
    amazonPrice?: number | null;
    amazonRank?: number | null;
    Pmin_overall?: number | null;
    k_eq?: number | null;
  };
  // Optional: Add fields for the input data used, for debugging/display?
  // input_data?: {
  //   prices_A: number[];
  //   prices_S: number[];
  //   T: number;
  //   amazon_BSR: number;
  //   amazon_reviews: number;
  // };
  // Optional: Add an error message field?
  // error?: string | null;
}

/**
 * Represents the display-friendly sourcing verdict data used in the UI.
 */
export interface SourcingVerdict {
  verdict: "BUY" | "REJECT";
  decidingStage: number;
  decidingReason: string;
  buyCost: number;
  sellingPrice: number;
  profit: number;
  roi: number;
  equilibriumDetails: {
    probability: number;
    threshold: number;
    passesStage1: boolean;
    str: number;
  } | null;
  terapeakDetails: {
    salesRate: number;
    threshold: number;
    passesStage2: boolean;
  } | null;
  amazonPrice?: number | null;
  amazonRank?: number | null;
  // Add book details from backend
  bookDetails?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    image?: string;
    binding?: string;
    pages?: number;
    date_published?: string;
    dimensions?: string;
    source?: 'isbndb' | 'googlebooks'; // Track which API provided the data
  } | null;
  // Add manual input data
  manualInputs?: {
    lowestActivePrice?: number | null;
    recentSoldPrice?: number | null;
    terapeakSales?: number | null;
    amazonBSR?: number | null;
    amazonReviews?: number | null;
    amazonPrice?: number | null;
  };
}

/**
 * Scenario key types for testing different sourcing scenarios
 */
export type ScenarioKey = 'STRONG_EQUILIBRIUM' | 'WEAK_EQUILIBRIUM' | 'TERAPEAK_DOMINANT' | 'AMAZON_DOMINANT';

/**
 * Mock scenario data for testing
 */
export interface MockScenario {
  description: string;
  pricesA: number[];
  pricesS: number[];
  terapeak_T: number;
  pricesA_condition: string[];
  amazonPrice: number;
  amazonRank: number;
}

export const MOCK_SCENARIOS: Record<ScenarioKey, MockScenario> = {
  STRONG_EQUILIBRIUM: {
    description: 'Strong equilibrium with good STR',
    pricesA: [25, 30, 35, 40, 45],
    pricesS: [20, 25, 30, 35],
    terapeak_T: 12,
    pricesA_condition: ['used', 'used', 'used', 'used', 'used'],
    amazonPrice: 32.50,
    amazonRank: 150000
  },
  WEAK_EQUILIBRIUM: {
    description: 'Weak equilibrium with poor STR',
    pricesA: [15, 20, 25, 30, 35],
    pricesS: [10, 15, 20],
    terapeak_T: 3,
    pricesA_condition: ['used', 'used', 'used', 'used', 'used'],
    amazonPrice: 25.00,
    amazonRank: 500000
  },
  TERAPEAK_DOMINANT: {
    description: 'High Terapeak sales, moderate STR',
    pricesA: [20, 25, 30, 35],
    pricesS: [18, 22, 28],
    terapeak_T: 25,
    pricesA_condition: ['used', 'used', 'used', 'used'],
    amazonPrice: 27.50,
    amazonRank: 300000
  },
  AMAZON_DOMINANT: {
    description: 'High Amazon rank, low competition',
    pricesA: [30, 35, 40],
    pricesS: [25, 30, 35],
    terapeak_T: 8,
    pricesA_condition: ['used', 'used', 'used'],
    amazonPrice: 45.00,
    amazonRank: 50000
  }
}; 