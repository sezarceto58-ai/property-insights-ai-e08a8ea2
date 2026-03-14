/**
 * Investment Score Engine — Module 2
 * Full deal scoring algorithm extending TerraScore into a rich multi-factor model.
 */

import { TrendingUp, MapPin, DollarSign, AlertTriangle, Building2, Zap } from "lucide-react";

export interface DealScoreInput {
  price: number;
  aiValuation: number;
  rentalYield?: number;         // annual %, e.g. 8.5
  city: string;
  district: string;
  propertyType: string;
  developerRating?: number;     // 1–5
  daysOnMarket?: number;
  verified?: boolean;
}

export interface ScoreFactor {
  key: string;
  label: string;
  score: number;         // 0–100
  weight: number;        // 0–1, sum = 1
  contribution: number;  // weighted score
  description: string;
  sentiment: "positive" | "neutral" | "negative";
  icon: React.ElementType;
}

export interface DealScore {
  total: number;          // 0–100
  grade: "A+" | "A" | "B+" | "B" | "C" | "D";
  label: string;
  recommendation: "Strong Buy" | "Buy" | "Hold" | "Caution" | "Avoid";
  factors: ScoreFactor[];
  summary: string;
}

// ── Location growth scores by city ──
const CITY_GROWTH_SCORES: Record<string, number> = {
  Erbil: 85, Baghdad: 62, Sulaymaniyah: 74, Basra: 52,
};

// ── Liquidity risk by property type ──
const LIQUIDITY_SCORES: Record<string, number> = {
  Apartment: 78, Villa: 65, Commercial: 55, Land: 40, Penthouse: 60, Townhouse: 70,
};

export function calculateDealScore(input: DealScoreInput): DealScore {
  const {
    price, aiValuation, rentalYield = 6, city, district,
    propertyType, developerRating = 3.5, daysOnMarket = 30, verified = false,
  } = input;

  // ── Factor 1: Price Discount (weight 0.30) ──
  const discountPct = ((aiValuation - price) / aiValuation) * 100;
  const discountScore = Math.min(100, Math.max(0, 50 + discountPct * 2));

  // ── Factor 2: Rental Yield (weight 0.25) ──
  // Benchmark: 6% = 50, 10%+ = 100, <4% = 0
  const yieldScore = Math.min(100, Math.max(0, ((rentalYield - 4) / 6) * 100));

  // ── Factor 3: Location Growth (weight 0.20) ──
  const growthScore = CITY_GROWTH_SCORES[city] ?? 60;

  // ── Factor 4: Liquidity Risk (weight 0.15) ──
  const liquidityScore = LIQUIDITY_SCORES[propertyType] ?? 65;

  // ── Factor 5: Developer Reputation (weight 0.10) ──
  const developerScore = Math.min(100, Math.max(0, (developerRating / 5) * 100));

  const factors: ScoreFactor[] = [
    {
      key: "priceDiscount",
      label: "Price Discount",
      score: Math.round(discountScore),
      weight: 0.30,
      contribution: Math.round(discountScore * 0.30),
      description: discountPct > 5
        ? `Property is ${discountPct.toFixed(1)}% below AI valuation — excellent entry point.`
        : discountPct < -5
        ? `Property is ${Math.abs(discountPct).toFixed(1)}% above AI valuation — limited upside.`
        : `Property is at fair market value (${discountPct.toFixed(1)}% vs AI valuation).`,
      sentiment: discountPct > 5 ? "positive" : discountPct < -5 ? "negative" : "neutral",
      icon: DollarSign,
    },
    {
      key: "rentalYield",
      label: "Rental Yield",
      score: Math.round(yieldScore),
      weight: 0.25,
      contribution: Math.round(yieldScore * 0.25),
      description: `${rentalYield.toFixed(1)}% annual rental yield. ${
        rentalYield >= 8 ? "Excellent cash flow potential." :
        rentalYield >= 6 ? "Solid income-generating asset." :
        "Below-average yield — capital growth dependent."
      }`,
      sentiment: rentalYield >= 8 ? "positive" : rentalYield >= 5 ? "neutral" : "negative",
      icon: TrendingUp,
    },
    {
      key: "locationGrowth",
      label: "Location Growth",
      score: Math.round(growthScore),
      weight: 0.20,
      contribution: Math.round(growthScore * 0.20),
      description: `${city} (${district}) shows ${
        growthScore >= 75 ? "strong" : growthScore >= 55 ? "moderate" : "limited"
      } appreciation potential based on economic indicators.`,
      sentiment: growthScore >= 70 ? "positive" : growthScore >= 50 ? "neutral" : "negative",
      icon: MapPin,
    },
    {
      key: "liquidityRisk",
      label: "Liquidity Risk",
      score: Math.round(liquidityScore),
      weight: 0.15,
      contribution: Math.round(liquidityScore * 0.15),
      description: `${propertyType} assets have ${
        liquidityScore >= 70 ? "high" : liquidityScore >= 55 ? "moderate" : "low"
      } market liquidity in this region. ${
        daysOnMarket < 30 ? "Fast market absorption detected." :
        daysOnMarket > 90 ? "Extended time-on-market — liquidity risk elevated." : ""
      }`,
      sentiment: liquidityScore >= 70 ? "positive" : liquidityScore >= 50 ? "neutral" : "negative",
      icon: AlertTriangle,
    },
    {
      key: "developerReputation",
      label: "Developer Reputation",
      score: Math.round(developerScore),
      weight: 0.10,
      contribution: Math.round(developerScore * 0.10),
      description: `Developer rated ${developerRating}/5. ${
        developerRating >= 4 ? "Track record of on-time delivery and quality." :
        developerRating >= 3 ? "Acceptable track record with minor delays reported." :
        "Below-average reputation — delivery risk elevated."
      }${verified ? " ✓ Verified listing adds credibility." : ""}`,
      sentiment: developerRating >= 4 ? "positive" : developerRating >= 3 ? "neutral" : "negative",
      icon: Building2,
    },
  ];

  const total = Math.round(
    factors.reduce((sum, f) => sum + f.score * f.weight, 0)
  );

  const grade: DealScore["grade"] =
    total >= 90 ? "A+" : total >= 80 ? "A" : total >= 70 ? "B+" :
    total >= 60 ? "B" : total >= 45 ? "C" : "D";

  const recommendation: DealScore["recommendation"] =
    total >= 80 ? "Strong Buy" : total >= 65 ? "Buy" :
    total >= 50 ? "Hold" : total >= 35 ? "Caution" : "Avoid";

  const label =
    total >= 80 ? "Exceptional Deal" : total >= 65 ? "Good Investment" :
    total >= 50 ? "Average Opportunity" : total >= 35 ? "Below Average" : "Poor Deal";

  const summary = `This property scores ${total}/100 — ${label}. ${
    recommendation === "Strong Buy" || recommendation === "Buy"
      ? `Key drivers: ${factors.filter(f => f.sentiment === "positive").map(f => f.label).join(", ")}.`
      : `Key risks: ${factors.filter(f => f.sentiment === "negative").map(f => f.label).join(", ")}.`
  }`;

  return { total, grade, label, recommendation, factors, summary };
}

// ── React Component ──
import React from "react";

interface InvestmentScoreProps {
  input: DealScoreInput;
  compact?: boolean;
}

export default function InvestmentScore({ input, compact = false }: InvestmentScoreProps) {
  const result = calculateDealScore(input);

  const gradeColors: Record<string, string> = {
    "A+": "text-success border-success bg-success/10",
    "A":  "text-success border-success/70 bg-success/10",
    "B+": "text-primary border-primary bg-primary/10",
    "B":  "text-primary border-primary/70 bg-primary/10",
    "C":  "text-warning border-warning bg-warning/10",
    "D":  "text-destructive border-destructive bg-destructive/10",
  };

  const recColors: Record<string, string> = {
    "Strong Buy": "bg-success/15 text-success border-success/20",
    "Buy":        "bg-success/10 text-success border-success/10",
    "Hold":       "bg-warning/10 text-warning border-warning/20",
    "Caution":    "bg-orange-500/10 text-orange-500 border-orange-500/20",
    "Avoid":      "bg-destructive/10 text-destructive border-destructive/20",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center shrink-0 ${gradeColors[result.grade] ?? ""}`}>
          <span className="text-lg font-bold leading-none">{result.total}</span>
          <span className="text-[9px] font-semibold opacity-70">{result.grade}</span>
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">{result.label}</p>
          <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${recColors[result.recommendation] ?? ""}`}>
            {result.recommendation}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-card border border-border p-5 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-20 h-20 rounded-2xl border-4 flex flex-col items-center justify-center shrink-0 ${gradeColors[result.grade] ?? ""}`}>
          <span className="text-3xl font-black leading-none">{result.total}</span>
          <span className="text-xs font-bold mt-0.5 opacity-70">Grade {result.grade}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-foreground">{result.label}</h3>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${recColors[result.recommendation] ?? ""}`}>
              <Zap className="w-3 h-3 inline mr-1" />{result.recommendation}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* Factor Bars */}
      <div className="space-y-3">
        {result.factors.map((f) => {
          const Icon = f.icon;
          const barColor =
            f.sentiment === "positive" ? "bg-success" :
            f.sentiment === "negative" ? "bg-destructive" : "bg-warning";

          return (
            <div key={f.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                  {f.label}
                  <span className="text-[10px] text-muted-foreground font-normal">({Math.round(f.weight * 100)}% weight)</span>
                </span>
                <span className="text-xs font-bold text-foreground">{f.score}/100</span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${f.score}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{f.description}</p>
            </div>
          );
        })}
      </div>

      {/* Contribution breakdown */}
      <div className="rounded-lg bg-secondary/50 p-3">
        <p className="text-xs font-semibold text-foreground mb-2">Score Breakdown</p>
        <div className="grid grid-cols-5 gap-1">
          {result.factors.map((f) => (
            <div key={f.key} className="text-center">
              <div className={`text-sm font-bold ${
                f.sentiment === "positive" ? "text-success" :
                f.sentiment === "negative" ? "text-destructive" : "text-warning"
              }`}>{f.contribution}</div>
              <div className="text-[9px] text-muted-foreground leading-tight">{f.label.split(" ")[0]}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
