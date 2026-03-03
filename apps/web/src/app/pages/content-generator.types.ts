export type Platform = 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok';

export type PlatformSize = {
  name: string;
  width: number;
  height: number;
};

export const PLATFORM_SIZES: Record<Platform, PlatformSize[]> = {
  facebook: [
    { name: 'Post (kwadrat)', width: 1200, height: 1200 },
    { name: 'Post (poziomy)', width: 1200, height: 630 },
    { name: 'Story', width: 1080, height: 1920 },
    { name: 'Cover', width: 820, height: 312 },
  ],
  instagram: [
    { name: 'Post (kwadrat)', width: 1080, height: 1080 },
    { name: 'Post (pionowy)', width: 1080, height: 1350 },
    { name: 'Story/Reels', width: 1080, height: 1920 },
    { name: 'Karuzela', width: 1080, height: 1080 },
  ],
  linkedin: [
    { name: 'Post (poziomy)', width: 1200, height: 627 },
    { name: 'Post (kwadrat)', width: 1200, height: 1200 },
    { name: 'Cover', width: 1584, height: 396 },
  ],
  twitter: [
    { name: 'Post', width: 1200, height: 675 },
    { name: 'Header', width: 1500, height: 500 },
  ],
  tiktok: [
    { name: 'Video (pionowy)', width: 1080, height: 1920 },
    { name: 'Video (kwadrat)', width: 1080, height: 1080 },
  ],
};

export const COST_ESTIMATES = {
  textGeneration: 10,
  imageGeneration: 25,
  videoGeneration: 50,
  internetResearch: 5,
};

/** OpenAI gpt-4o-mini (Mar 2026): $0.15/1M input, $0.60/1M output. Est. ~100 input + ~150 output per variant. */
export const OPENAI_TEXT_PRICING_USD = {
  inputPer1M: 0.15,
  outputPer1M: 0.6,
  estInputTokensPerVariant: 100,
  estOutputTokensPerVariant: 150,
};

export function estimateTextCostUsd(numVariants: number): number {
  const input = OPENAI_TEXT_PRICING_USD.estInputTokensPerVariant * numVariants;
  const output =
    OPENAI_TEXT_PRICING_USD.estOutputTokensPerVariant * numVariants;
  return (
    (input * OPENAI_TEXT_PRICING_USD.inputPer1M) / 1_000_000 +
    (output * OPENAI_TEXT_PRICING_USD.outputPer1M) / 1_000_000
  );
}
