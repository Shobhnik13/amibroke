export function getFunnyLine(spendUsd: number): string {
  if (spendUsd === 0)    return "running on vibes and free tiers. inspiring.";
  if (spendUsd < 10)    return "barely a dent. the AI is confused by you.";
  if (spendUsd < 30)    return "casual enjoyer. AI still has respect for you.";
  if (spendUsd < 75)    return "okay it's getting real. how's the feature going?";
  if (spendUsd < 150)   return "AI is basically your co-founder at this point.";
  if (spendUsd < 300)   return "genuinely concerning. please touch grass.";
  if (spendUsd < 500)   return "you need therapy. and a spending limit. in that order.";
  if (spendUsd < 1000)  return "are you okay? this is a cry for help.";
  return "please seek immediate financial (and emotional) support.";
}
