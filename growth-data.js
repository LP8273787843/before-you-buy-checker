// SAMPLE DATA ONLY.
// These median house prices are INVENTED for demonstration. They are NOT real
// sales figures and must not be used to make decisions. No free, open API of
// historical Gold Coast suburb medians was found, so the app shows these
// clearly labelled samples and lets the user type in real figures instead.
//
// The shapes are deliberately varied (fast growth, flat decades, dips) to show
// that growth is not a fixed rule. Replace them with real data if you have it:
// keys are suburb names in upper case, values are { year: medianPrice }.
window.SAMPLE_GROWTH = {
  "SURFERS PARADISE":   { 2005: 620000, 2010: 640000, 2015: 650000, 2020: 820000, 2025: 1150000 },
  "BROADBEACH":         { 2005: 700000, 2010: 760000, 2015: 790000, 2020: 980000, 2025: 1450000 },
  "BROADBEACH WATERS":  { 2005: 690000, 2010: 720000, 2015: 840000, 2020: 1100000, 2025: 1700000 },
  "CLEAR ISLAND WATERS":{ 2005: 640000, 2010: 700000, 2015: 820000, 2020: 1050000, 2025: 1600000 },
  "SOUTHPORT":          { 2005: 380000, 2010: 450000, 2015: 470000, 2020: 600000, 2025: 900000 },
  "NERANG":             { 2005: 330000, 2010: 400000, 2015: 430000, 2020: 560000, 2025: 860000 },
  "CARRARA":            { 2005: 400000, 2010: 470000, 2015: 500000, 2020: 640000, 2025: 980000 },
  "ROBINA":             { 2005: 440000, 2010: 530000, 2015: 570000, 2020: 760000, 2025: 1150000 },
  "BURLEIGH HEADS":     { 2005: 520000, 2010: 600000, 2015: 700000, 2020: 1050000, 2025: 1750000 },
  "COOMERA":            { 2005: 360000, 2010: 410000, 2015: 450000, 2020: 540000, 2025: 820000 },
  "COOLANGATTA":        { 2005: 560000, 2010: 600000, 2015: 640000, 2020: 900000, 2025: 1400000 },
  "MERMAID WATERS":     { 2005: 560000, 2010: 640000, 2015: 730000, 2020: 980000, 2025: 1500000 },
  "MUDGEERABA":         { 2005: 400000, 2010: 470000, 2015: 500000, 2020: 650000, 2025: 980000 },
  "HELENSVALE":         { 2005: 420000, 2010: 500000, 2015: 520000, 2020: 660000, 2025: 1000000 },
  "PALM BEACH":         { 2005: 480000, 2010: 560000, 2015: 640000, 2020: 950000, 2025: 1600000 },
  // Used when the suburb is not listed above.
  "_DEFAULT":           { 2005: 450000, 2010: 520000, 2015: 560000, 2020: 720000, 2025: 1100000 }
};
