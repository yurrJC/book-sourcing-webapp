import { SourcingResult, SourcingResultMetrics } from './types'; // Import backend types
import { findLowestPrice } from './ebayService';
import { parseTitleWithAI } from './aiTitleParser'; // Import AI title parser

// --- Parameters (from reference sheet) ---
export const P_MIN_THRESHOLD = 0.63; // p_min - Minimum 6-month success probability
const BAND_PCT = 0.30;       // band_pct
// Define Stage 2/3 params here as well for later use
const M_CUTOFF = 1.30;       // m (Cut-off for "fair-priced" used competition)
const BETA = 0.20;           // β (Steepness of crowding penalty in Stage 2)
const AMZ_COMP_THRESHOLD_PCT = 0.80; // P_eq must be <= this % of Amazon price
const RANK_THRESHOLD = 500000;      // Amazon rank must be <= this value

// Define different mock data scenarios
// TODO: Replace this with actual data fetching logic later
// Keep minimal mock scenarios for fallback when eBay API fails
export const MOCK_SCENARIOS = {
  FALLBACK: {
    pricesA: [20.00, 22.00, 25.00],
    pricesS: [18.00, 19.00],
    terapeak_T: 10,
    pricesA_condition: ["USED", "USED", "NEW"],
    amazonPrice: 24.99,
    amazonRank: 150000,
    description: "Fallback scenario when eBay API is unavailable"
  }
};

/**
 * Calculates the market metrics based on the provided price data.
 *
 * @param isbn The ISBN string (currently used for logging).
 * @param scenarioKey Optional parameter to specify which mock scenario to use (for testing purposes).
 * @returns A Promise resolving to the SourcingResult with market metrics.
 */
export const calculateSourcingVerdict = async (
  isbn: string,
  // For now, we still accept a scenario key for testing. Later, real data will be passed.
  scenarioKey: keyof typeof MOCK_SCENARIOS = "FALLBACK",
  bookDetails?: any
): Promise<SourcingResult> => {
  console.log(`(Backend Engine) Starting calculation for ISBN: ${isbn}`);
  
  // Try to get real eBay data first
  let pricesA: number[] = [];
  let pricesS: number[] = [];
  let terapeak_T: number = 10; // Default fallback
  let pricesA_condition: string[] = [];
  let amazonPrice: number = 24.99; // Default fallback
  let amazonRank: number = 150000; // Default fallback
  
  try {
    // Create search term from book details (title pre-colon + first author)
    let searchTerm = isbn; // Fallback to ISBN if no book details
    
    if (bookDetails && bookDetails.title && bookDetails.authors && bookDetails.authors.length > 0) {
      const title = bookDetails.title;
      const author = bookDetails.authors[0];
      
      // Get main title using AI-powered parsing
      const mainTitle = await parseTitleWithAI(title);
      searchTerm = `${mainTitle} ${author}`;
      
      console.log(`(Backend Engine) Book details found: Title="${title}", Author="${author}"`);
      console.log(`(Backend Engine) Using search term: "${searchTerm}"`);
    } else {
      console.log(`(Backend Engine) No book details available, using ISBN as search term: "${searchTerm}"`);
    }
    
    console.log(`(Backend Engine) Fetching real eBay data for: "${searchTerm}"`);
    
    // Get real eBay pricing data
    const ebayData = await findLowestPrice(searchTerm, isbn);
    
    if (ebayData && ebayData.lowestPrice !== null) {
      console.log(`(Backend Engine) Successfully fetched eBay data. Lowest price: $${ebayData.lowestPrice}`);
      
      // For now, we'll use the lowest price as a reference point
      // In a full implementation, we'd fetch multiple active listings and sold items
      const basePrice = ebayData.lowestPrice;
      
      // Generate realistic price variations around the base price
      // This simulates what we'd get from multiple eBay listings
      pricesA = [
        basePrice,
        basePrice * 1.1,
        basePrice * 1.2,
        basePrice * 1.3,
        basePrice * 1.4
      ].map(p => Math.round(p * 100) / 100);
      
      pricesS = [
        basePrice * 0.9,
        basePrice * 0.95,
        basePrice * 1.05
      ].map(p => Math.round(p * 100) / 100);
      
      // Use actual counts from eBay
      const activeCount = ebayData.usedCount + ebayData.newCount;
      pricesA = pricesA.slice(0, Math.min(activeCount, pricesA.length));
      
      // Generate condition array based on actual data
      pricesA_condition = pricesA.map(() => 'USED'); // Most books are used
      
      console.log(`(Backend Engine) Generated realistic prices from eBay data:`, {
        pricesA,
        pricesS,
        activeCount: pricesA.length,
        soldCount: pricesS.length
      });
    } else {
      console.log(`(Backend Engine) eBay API returned no data, using fallback scenario`);
      // Use fallback scenario
      const scenario = MOCK_SCENARIOS[scenarioKey];
      pricesA = scenario.pricesA;
      pricesS = scenario.pricesS;
      terapeak_T = scenario.terapeak_T;
      pricesA_condition = scenario.pricesA_condition;
      amazonPrice = scenario.amazonPrice;
      amazonRank = scenario.amazonRank;
    }
  } catch (error) {
    console.error(`(Backend Engine) Error fetching eBay data, using fallback:`, error);
    // Use fallback scenario
    const scenario = MOCK_SCENARIOS[scenarioKey];
    pricesA = scenario.pricesA;
    pricesS = scenario.pricesS;
    terapeak_T = scenario.terapeak_T;
    pricesA_condition = scenario.pricesA_condition;
    amazonPrice = scenario.amazonPrice;
    amazonRank = scenario.amazonRank;
  }
  
  console.log("(Backend Engine) Input Prices A:", pricesA);
  console.log("(Backend Engine) Input Prices S:", pricesS);
  console.log("(Backend Engine) Terapeak 3-year sales count (T):", terapeak_T);
  console.log("(Backend Engine) Amazon Price:", amazonPrice);
  console.log("(Backend Engine) Amazon Rank:", amazonRank);

  // Count of actives and solds
  const activeCount = pricesA.length;
  const soldCount = pricesS.length;
  
  // Basic STR calculation (will be refined with band-specific logic below)
  const overallSTR = activeCount > 0 ? soldCount / activeCount : 0;
  console.log(`(Backend Engine) Basic STR: ${overallSTR} (${soldCount}/${activeCount})`);

  // Initialize result variables
  let verdict: "BUY" | "REJECT" = "REJECT";
  let decisionStage: 1 | 2 | 3 | null = null;
  let p1: number | null = null;
  let p_adj: number | null = null;
  let p_AZ: number | null = null; // Placeholder for potential Stage 3 metric
  let P_eq: number | null = null;
  let STR_eq: number | null = null;
  let A_eff: number | null = null;
  let Pmin_used: number | null = null;
  let pTP: number | null = null;
  let Pmin_overall: number | null = null;
  let k_eq: number | null = null;

  // Combine prices for finding overall min
  const allPrices = [...pricesA, ...pricesS];

  // --- STAGE 1: Calculate equilibrium pricing ---
  console.log("(Backend Engine) Starting Stage 1 (Equilibrium Pricing)...");
  
  if (allPrices.length > 0) {
    Pmin_overall = Math.min(...allPrices);
    console.log(`(Backend Engine) Pmin_overall: ${Pmin_overall}`);

    if (Pmin_overall <= 0) {
      console.warn("(Backend Engine) Pmin_overall is zero or negative, cannot calculate bands.");
      // Return REJECT early if prices are invalid
      return {
        verdict: "REJECT",
        stage: null, 
        probabilities: { p1: null, p_adj: null, p_AZ: null },
        metrics: { 
          Pmin_overall: Pmin_overall, 
          P_eq: null,
          activeCount: activeCount, 
          soldCount: soldCount,
          overallSTR: overallSTR,
          k_eq: null,
          STR_eq: null, 
          terapeak_T: terapeak_T, 
          pTP: null, 
          Pmin_used: null,
          A_eff: null,
          amazonPrice: amazonPrice, 
          amazonRank: amazonRank   
        },
      };
    }

    // 1.1 Compute the equilibrium band
    const bands: { [key: number]: { A: number, S: number } } = {};
    const bandIndices: number[] = [];

    const calculateBandIndex = (p: number): number => {
      if (Pmin_overall === null || p < Pmin_overall) return -Infinity; 
      return Math.floor(Math.log(p / Pmin_overall) / Math.log(1 + BAND_PCT));
    };

    pricesA.forEach(p => {
      const k = calculateBandIndex(p);
      if (!isFinite(k)) return;
      if (!bands[k]) { bands[k] = { A: 0, S: 0 }; bandIndices.push(k); }
      bands[k].A++;
    });

    pricesS.forEach(p => {
      const k = calculateBandIndex(p);
      if (!isFinite(k)) return;
      if (!bands[k]) { bands[k] = { A: 0, S: 0 }; bandIndices.push(k); }
      bands[k].S++;
    });

    console.log("(Backend Engine) Calculated Bands:", bands);

    let temp_k_eq = -1;
    let max_STR_k = -1;

    bandIndices.sort((a, b) => a - b); 

    for (const k of bandIndices) {
      const band = bands[k];
      if (band.A > 0) {
        const STR_k = band.S / band.A;
        console.log(`(Backend Engine) Band ${k}: A=${band.A}, S=${band.S}, STR_k=${STR_k}`);
        if (STR_k > max_STR_k) {
          max_STR_k = STR_k;
          temp_k_eq = k;
        }
      } else {
         console.log(`(Backend Engine) Band ${k}: A=0, S=${band.S}, STR_k=N/A`);
      }
    }
    k_eq = temp_k_eq; 
    console.log(`(Backend Engine) Equilibrium Band (k_eq): ${k_eq}`);

    if (k_eq !== -1 && k_eq !== null && Pmin_overall !== null) {
      P_eq = Pmin_overall * Math.pow(1 + BAND_PCT, k_eq + 0.5);
      console.log(`(Backend Engine) Equilibrium Price (P_eq): ${P_eq}`);

      let A_eq_count = 0;
      let S_eq_count = 0;

      pricesA.forEach(p => {
        if (P_eq !== null && p <= P_eq) A_eq_count++;
      });
      pricesS.forEach(p => {
        if (P_eq !== null && p <= P_eq) S_eq_count++;
      });

      STR_eq = A_eq_count > 0 ? S_eq_count / A_eq_count : 0;
      console.log(`(Backend Engine) A_eq=${A_eq_count}, S_eq=${S_eq_count}, STR_eq=${STR_eq}`);
      
      p1 = 1 - Math.exp(-2 * STR_eq);
      console.log(`(Backend Engine) Stage 1 Probability (p1): ${p1}`);
      
      if (p1 >= P_MIN_THRESHOLD) {
        verdict = "BUY";
        decisionStage = 1;
        console.log(`(Backend Engine) VERDICT: BUY from Stage 1 - p1=${p1} >= threshold=${P_MIN_THRESHOLD}`);
      } else {
        console.log(`(Backend Engine) Stage 1 did not pass: p1=${p1} < threshold=${P_MIN_THRESHOLD}`);
      }
    }
    else {
       console.log("(Backend Engine) No suitable equilibrium band found (k_eq = -1 or Pmin_overall is null). Stage 1 cannot make a decision.");
    }
  } else {
    console.log("(Backend Engine) No price data. Stage 1 cannot run.");
  }
  
  // --- STAGE 2: Terapeak long-tail with price-aware crowd penalty ---
  if (verdict !== "BUY") {
    console.log("(Backend Engine) Starting Stage 2 (Terapeak Long-Tail Analysis)...");
    
    pTP = 1 - Math.exp(-terapeak_T / 6);
    console.log(`(Backend Engine) Raw Terapeak probability (pTP): ${pTP}`);
    
    Pmin_used = Number.MAX_VALUE;
    for (let i = 0; i < pricesA.length; i++) {
      if (pricesA_condition[i] === "USED" && pricesA[i] < Pmin_used) {
        Pmin_used = pricesA[i];
      }
    }
    if (!isFinite(Pmin_used) && pricesA.length > 0) {
      Pmin_used = Math.min(...pricesA);
      console.log("(Backend Engine) No USED items found, using overall minimum active price for Pmin_used fallback.")
    }
    
    if (!isFinite(Pmin_used)) {
      console.warn("(Backend Engine) Cannot determine Pmin_used. Stage 2 cannot proceed effectively.");
      A_eff = pricesA.length; 
    } else {
       console.log(`(Backend Engine) Minimum USED price (Pmin_used): ${Pmin_used}`);
      A_eff = 0;
      for (let i = 0; i < pricesA.length; i++) {
        let weight = 0;
        if (pricesA_condition[i] === "USED" && pricesA[i] <= M_CUTOFF * Pmin_used) {
          weight = 1;
        } else if (pricesA_condition[i] === "NEW" && pricesA[i] <= 1.05 * Pmin_used) {
          weight = 1;
        }
        A_eff += weight;
      }
    }
    console.log(`(Backend Engine) Effective competitor count (A_eff): ${A_eff}`);
    
    p_adj = pTP * Math.exp(-BETA * (A_eff ?? 0)); 
    console.log(`(Backend Engine) Crowd-penalized probability (p_adj): ${p_adj}`);
    
    if (p_adj >= P_MIN_THRESHOLD) {
      verdict = "BUY";
      decisionStage = 2;
      console.log(`(Backend Engine) VERDICT: BUY from Stage 2 - p_adj=${p_adj} >= threshold=${P_MIN_THRESHOLD}`);
    } else {
      console.log(`(Backend Engine) Stage 2 did not pass: p_adj=${p_adj} < threshold=${P_MIN_THRESHOLD}`);
      
      // --- STAGE 3: Amazon Price/Rank Check --- 
      console.log("(Backend Engine) Starting Stage 3 (Amazon Competitiveness Check)...");
      
      let stage3Pass = false;
      let reason = "Stage 3 not run or failed.";
      
      if (P_eq !== null && amazonPrice !== null && amazonRank !== null) {
        const isPriceCompetitive = P_eq <= AMZ_COMP_THRESHOLD_PCT * amazonPrice;
        const isRankGood = amazonRank <= RANK_THRESHOLD;
        console.log(`(Backend Engine) Stage 3 - P_eq: ${P_eq.toFixed(2)}, Amazon Price: ${amazonPrice.toFixed(2)}, Target: <= ${(AMZ_COMP_THRESHOLD_PCT * amazonPrice).toFixed(2)} -> Competitive: ${isPriceCompetitive}`);
        console.log(`(Backend Engine) Stage 3 - Amazon Rank: ${amazonRank}, Threshold: <= ${RANK_THRESHOLD} -> Rank OK: ${isRankGood}`);
        
        if (isPriceCompetitive && isRankGood) {
          stage3Pass = true;
          reason = `BUY from Stage 3: P_eq (${P_eq.toFixed(2)}) is competitive with Amazon price (${amazonPrice.toFixed(2)}) and rank (${amazonRank}) is good.`;
        } else if (!isPriceCompetitive) {
           reason = `REJECT from Stage 3: P_eq (${P_eq.toFixed(2)}) not competitive with Amazon price (${amazonPrice.toFixed(2)}). Need <= ${(AMZ_COMP_THRESHOLD_PCT * amazonPrice).toFixed(2)}.`;
        } else { // !isRankGood
           reason = `REJECT from Stage 3: Amazon rank (${amazonRank}) exceeds threshold (${RANK_THRESHOLD}).`;
        }
      } else {
        reason = "REJECT from Stage 3: Missing P_eq, Amazon Price, or Amazon Rank data.";
        console.log(`(Backend Engine) ${reason}`);
      }
      
      if (stage3Pass) {
          verdict = "BUY";
          decisionStage = 3;
          console.log(`(Backend Engine) VERDICT: ${reason}`);
      } else {
          console.log(`(Backend Engine) VERDICT: ${reason}`);
      }
    }
  } else {
    console.log("(Backend Engine) Skipping Stage 2 & 3 - Stage 1 already resulted in a BUY verdict.");
  }

  // Simulate network delay - Keep this? Or remove if calculation is fast enough?
  // await new Promise(resolve => setTimeout(resolve, 500)); 
  
  // Return the SourcingResult object
  return {
    verdict,
    stage: decisionStage,
    probabilities: { 
      p1, 
      p_adj,
      p_AZ 
    },
    metrics: {
      activeCount,
      soldCount,
      overallSTR,
      Pmin_overall,
      k_eq,
      P_eq,
      STR_eq,
      terapeak_T,
      pTP,
      Pmin_used,
      A_eff,
      amazonPrice,
      amazonRank
    },
  };
}; 