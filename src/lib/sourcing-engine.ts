import { SourcingResult } from '../types';

// --- Parameters (from reference sheet) ---
export const P_MIN_THRESHOLD = 0.63; // p_min - Minimum 6-month success probability
const BAND_PCT = 0.30;       // band_pct
// Define Stage 2/3 params here as well for later use
const M_CUTOFF = 1.30;       // m (Cut-off for "fair-priced" used competition)
const BETA = 0.20;           // β (Steepness of crowding penalty in Stage 2)
const AMZ_COMP_THRESHOLD_PCT = 0.80; // P_eq must be <= this % of Amazon price
const RANK_THRESHOLD = 500000;      // Amazon rank must be <= this value

// Define different mock data scenarios
export const MOCK_SCENARIOS = {
  // Scenario 1: Strong Stage 1 data - should result in BUY at Stage 1
  STRONG_EQUILIBRIUM: {
    pricesA: [16.00, 18.50, 15.00, 25.00, 22.00, 19.99],
    pricesS: [14.50, 15.50, 16.00, 15.75, 14.95], // More solds = higher STR
    terapeak_T: 12,
    pricesA_condition: ["USED", "USED", "USED", "NEW", "USED", "USED"],
    amazonPrice: 24.99, // Mock Amazon price
    amazonRank: 150000, // Mock Amazon rank
    description: "Strong equilibrium scenario - should succeed at Stage 1"
  },
  
  // Scenario 2: Weak Stage 1, Strong Stage 2 - should fail Stage 1 but pass Stage 2
  WEAK_EQUILIBRIUM_STRONG_TERAPEAK: {
    pricesA: [16.00, 18.50, 15.00, 25.00, 22.00, 19.99, 17.50, 21.00, 15.50, 18.20, 16.80], // Many more actives = much lower STR
    pricesS: [14.50, 15.50], // Fewer solds = lower STR at equilibrium
    terapeak_T: 24, // Higher Terapeak count = higher probability
    pricesA_condition: ["USED", "USED", "USED", "NEW", "USED", "USED", "USED", "NEW", "USED", "USED", "USED"],
    amazonPrice: 21.50, // Mock Amazon price
    amazonRank: 300000, // Mock Amazon rank
    description: "Weak equilibrium but strong Terapeak - should fail Stage 1 but succeed at Stage 2"
  },
  
  // Scenario 3: Both stages fail - should proceed through both and reject (or maybe pass stage 3)
  BOTH_FAIL: {
    pricesA: [16.00, 18.50, 15.00, 25.00, 22.00, 19.99, 17.50, 18.99, 16.50, 15.25], // Many actives
    pricesS: [14.50], // Very few solds
    terapeak_T: 4, // Low Terapeak count
    pricesA_condition: ["USED", "USED", "USED", "NEW", "USED", "USED", "USED", "NEW", "USED", "USED"],
    amazonPrice: 19.99, // Mock Amazon price - P_eq might be competitive here
    amazonRank: 450000, // Mock Amazon rank - within threshold
    description: "Both stages fail - should be rejected after trying both stages, unless Stage 3 passes"
  },
  // Scenario 4: Stage 3 Pass - Fails 1 & 2, but good Amazon price/rank
  STAGE_3_PASS: {
     pricesA: [22.00, 24.50, 20.00, 28.00, 26.00, 21.99], // Higher prices, P_eq likely higher
     pricesS: [20.50], // Very few solds
     terapeak_T: 5, // Low Terapeak count
     pricesA_condition: ["USED", "USED", "USED", "NEW", "USED", "USED"],
     amazonPrice: 30.00, // High enough Amazon price for P_eq to be competitive
     amazonRank: 100000, // Good rank
     description: "Fails Stage 1 & 2, but good Amazon data should trigger Stage 3 BUY"
  },
   // Scenario 5: Stage 3 Fail (Bad Rank) - Fails 1 & 2, competitive price but bad rank
  STAGE_3_FAIL_RANK: {
     pricesA: [22.00, 24.50, 20.00, 28.00, 26.00, 21.99],
     pricesS: [20.50],
     terapeak_T: 5,
     pricesA_condition: ["USED", "USED", "USED", "NEW", "USED", "USED"],
     amazonPrice: 30.00,
     amazonRank: 750000, // Rank too high
     description: "Fails Stage 1 & 2, competitive Amazon price but rank too high for Stage 3"
  },
   // Scenario 6: Stage 3 Fail (Bad Price) - Fails 1 & 2, good rank but price not competitive
  STAGE_3_FAIL_PRICE: {
     pricesA: [22.00, 24.50, 20.00, 28.00, 26.00, 21.99],
     pricesS: [20.50],
     terapeak_T: 5,
     pricesA_condition: ["USED", "USED", "USED", "NEW", "USED", "USED"],
     amazonPrice: 25.00, // P_eq likely > 0.8 * 25
     amazonRank: 100000,
     description: "Fails Stage 1 & 2, good Amazon rank but price not competitive enough for Stage 3"
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
  scenarioKey: keyof typeof MOCK_SCENARIOS = "STRONG_EQUILIBRIUM" // Default to the first scenario
): Promise<SourcingResult> => {
  // Get the specified mock scenario
  const scenario = MOCK_SCENARIOS[scenarioKey];
  console.log(`(Engine) Using scenario: ${scenarioKey} - ${scenario.description}`);
  console.log(`(Engine) Starting calculation for ISBN: ${isbn}`);
  
  // MOCK DATA - from selected scenario
  const pricesA = scenario.pricesA;
  const pricesS = scenario.pricesS;
  const terapeak_T = scenario.terapeak_T;
  const pricesA_condition = scenario.pricesA_condition;
  const amazonPrice = scenario.amazonPrice;
  const amazonRank = scenario.amazonRank;
  
  console.log("(Engine) Input Prices A:", pricesA);
  console.log("(Engine) Input Prices S:", pricesS);
  console.log("(Engine) Terapeak 3-year sales count (T):", terapeak_T);
  console.log("(Engine) Amazon Price:", amazonPrice);
  console.log("(Engine) Amazon Rank:", amazonRank);

  // Count of actives and solds
  const activeCount = pricesA.length;
  const soldCount = pricesS.length;
  
  // Basic STR calculation (will be refined with band-specific logic below)
  const overallSTR = activeCount > 0 ? soldCount / activeCount : 0;
  console.log(`(Engine) Basic STR: ${overallSTR} (${soldCount}/${activeCount})`);

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
  console.log("(Engine) Starting Stage 1 (Equilibrium Pricing)...");
  
  if (allPrices.length > 0) {
    Pmin_overall = Math.min(...allPrices);
    console.log(`(Engine) Pmin_overall: ${Pmin_overall}`);

    if (Pmin_overall <= 0) {
      console.warn("(Engine) Pmin_overall is zero or negative, cannot calculate bands.");
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
      if (Pmin_overall === null || p < Pmin_overall) return -Infinity; // Avoid issues with prices below Pmin_overall
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

    console.log("(Engine) Calculated Bands:", bands);

    let temp_k_eq = -1;
    let max_STR_k = -1;

    bandIndices.sort((a, b) => a - b); // Ensure we process in order for tie-breaking

    for (const k of bandIndices) {
      const band = bands[k];
      if (band.A > 0) {
        const STR_k = band.S / band.A;
        console.log(`(Engine) Band ${k}: A=${band.A}, S=${band.S}, STR_k=${STR_k}`);
        // Ties go to the lowest k (first one encountered in sorted list)
        if (STR_k > max_STR_k) {
          max_STR_k = STR_k;
          temp_k_eq = k;
        }
      } else {
         console.log(`(Engine) Band ${k}: A=0, S=${band.S}, STR_k=N/A`);
      }
    }
    k_eq = temp_k_eq; // Assign to the main variable
    console.log(`(Engine) Equilibrium Band (k_eq): ${k_eq}`);

    if (k_eq !== -1 && k_eq !== null && Pmin_overall !== null) {
      // Calculate mid-point price of equilibrium band
      P_eq = Pmin_overall * Math.pow(1 + BAND_PCT, k_eq + 0.5);
      console.log(`(Engine) Equilibrium Price (P_eq): ${P_eq}`);

      // 1.2 Effective STR in that band (or below)
      let A_eq_count = 0;
      let S_eq_count = 0;

      pricesA.forEach(p => {
        if (P_eq !== null && p <= P_eq) A_eq_count++;
      });
      pricesS.forEach(p => {
        if (P_eq !== null && p <= P_eq) S_eq_count++;
      });

      STR_eq = A_eq_count > 0 ? S_eq_count / A_eq_count : 0;
      console.log(`(Engine) A_eq=${A_eq_count}, S_eq=${S_eq_count}, STR_eq=${STR_eq}`);
      
      // 1.4 6-month success probability
      p1 = 1 - Math.exp(-2 * STR_eq);
      console.log(`(Engine) Stage 1 Probability (p1): ${p1}`);
      
      // Stage 1 Decision: if p1 >= P_MIN_THRESHOLD, we BUY
      if (p1 >= P_MIN_THRESHOLD) {
        verdict = "BUY";
        decisionStage = 1;
        console.log(`(Engine) VERDICT: BUY from Stage 1 - p1=${p1} >= threshold=${P_MIN_THRESHOLD}`);
      } else {
        console.log(`(Engine) Stage 1 did not pass: p1=${p1} < threshold=${P_MIN_THRESHOLD}`);
      }
    }
    else {
       console.log("(Engine) No suitable equilibrium band found (k_eq = -1 or Pmin_overall is null). Stage 1 cannot make a decision.");
    }
  } else {
    console.log("(Engine) No price data. Stage 1 cannot run.");
  }
  
  // --- STAGE 2: Terapeak long-tail with price-aware crowd penalty ---
  // Only proceed to Stage 2 if Stage 1 did not result in a BUY verdict
  if (verdict !== "BUY") {
    console.log("(Engine) Starting Stage 2 (Terapeak Long-Tail Analysis)...");
    
    // 2.1 Raw long-tail probability
    // pTP = 1 - e^(-T/6)
    pTP = 1 - Math.exp(-terapeak_T / 6);
    console.log(`(Engine) Raw Terapeak probability (pTP): ${pTP}`);
    
    // 2.2 Effective competitor count
    // Get minimum USED price for the weighting calculation
    Pmin_used = Number.MAX_VALUE;
    for (let i = 0; i < pricesA.length; i++) {
      if (pricesA_condition[i] === "USED" && pricesA[i] < Pmin_used) {
        Pmin_used = pricesA[i];
      }
    }
    // Fallback if no USED items or Pmin_used remained MAX_VALUE
    if (!isFinite(Pmin_used) && pricesA.length > 0) {
      Pmin_used = Math.min(...pricesA);
      console.log("(Engine) No USED items found, using overall minimum active price for Pmin_used fallback.")
    }
    
    if (!isFinite(Pmin_used)) {
      console.warn("(Engine) Cannot determine Pmin_used. Stage 2 cannot proceed effectively.");
      A_eff = pricesA.length; // Fallback: consider all actives as effective?
    } else {
       console.log(`(Engine) Minimum USED price (Pmin_used): ${Pmin_used}`);
      // Calculate weights using the weight function
      // wi = 1 if USED and Pi ≤ m × Pmin_used
      // wi = 1 if NEW and Pi ≤ 1.05 × Pmin_used
      // wi = 0 otherwise
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
    console.log(`(Engine) Effective competitor count (A_eff): ${A_eff}`);
    
    // 2.3 Crowd-penalized probability
    // padj = pTP * e^(-β*Aeff)
    p_adj = pTP * Math.exp(-BETA * (A_eff ?? 0)); // Use nullish coalescing for A_eff
    console.log(`(Engine) Crowd-penalized probability (p_adj): ${p_adj}`);
    
    // Stage 2 Decision: if p_adj >= P_MIN_THRESHOLD, we BUY
    if (p_adj >= P_MIN_THRESHOLD) {
      verdict = "BUY";
      decisionStage = 2;
      console.log(`(Engine) VERDICT: BUY from Stage 2 - p_adj=${p_adj} >= threshold=${P_MIN_THRESHOLD}`);
    } else {
      console.log(`(Engine) Stage 2 did not pass: p_adj=${p_adj} < threshold=${P_MIN_THRESHOLD}`);
      
      // --- STAGE 3: Amazon Price/Rank Check --- 
      console.log("(Engine) Starting Stage 3 (Amazon Competitiveness Check)...");
      
      let stage3Pass = false;
      let reason = "Stage 3 not run or failed.";
      
      if (P_eq !== null && amazonPrice !== null && amazonRank !== null) {
        const isPriceCompetitive = P_eq <= AMZ_COMP_THRESHOLD_PCT * amazonPrice;
        const isRankGood = amazonRank <= RANK_THRESHOLD;
        console.log(`(Engine) Stage 3 - P_eq: ${P_eq.toFixed(2)}, Amazon Price: ${amazonPrice.toFixed(2)}, Target: <= ${(AMZ_COMP_THRESHOLD_PCT * amazonPrice).toFixed(2)} -> Competitive: ${isPriceCompetitive}`);
        console.log(`(Engine) Stage 3 - Amazon Rank: ${amazonRank}, Threshold: <= ${RANK_THRESHOLD} -> Rank OK: ${isRankGood}`);
        
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
        console.log(`(Engine) ${reason}`);
      }
      
      if (stage3Pass) {
          verdict = "BUY";
          decisionStage = 3;
          console.log(`(Engine) VERDICT: ${reason}`);
      } else {
          // Verdict remains REJECT if Stage 3 doesn't pass
          console.log(`(Engine) VERDICT: ${reason}`);
      }
    }
  } else {
    console.log("(Engine) Skipping Stage 2 & 3 - Stage 1 already resulted in a BUY verdict.");
  }

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return the market metrics, now including which stage made the decision
  return {
    verdict,
    stage: decisionStage,
    probabilities: { 
      p1, 
      p_adj,
      p_AZ // Currently null, could be populated with a specific Stage 3 metric if desired
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

 