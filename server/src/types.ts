/**
 * Represents the detailed results of the sourcing engine calculation from the backend.
 */
export interface SourcingResult {
  verdict: "BUY" | "REJECT";
  /** The stage number (1, 2, or 3) that determined the verdict. */
  stage: 1 | 2 | 3 | null; 
  probabilities: {
    /** Stage 1 probability (Equilibrium pricing). Null if stage not reached or applicable. */
    p1: number | null;
    /** Stage 2 probability (Terapeak adjusted). Null if stage not reached. */
    p_adj: number | null;
    /** Stage 3 probability (Amazon proxy). Null if stage not reached. */
    p_AZ?: number | null;
  };
  metrics: SourcingResultMetrics;
  /** Details fetched from ISBNdb or similar source */
  bookDetails?: {
    title?: string;
    authors?: string[];
    publisher?: string;
    image?: string;
    binding?: string;
    pages?: number;
    date_published?: string;
    dimensions?: string;
    // Add any other relevant fields from IsbnDbBook.book
  } | null;
}

/**
 * Metrics calculated or used by the sourcing engine.
 */
export interface SourcingResultMetrics {
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
}

// We don't need SourcingVerdict here, as that's a frontend-specific display type. 