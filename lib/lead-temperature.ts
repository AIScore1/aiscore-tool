import { Lead } from './types';

export function calculateTemperature(
  lead: Pick<Lead, 'scoreGap' | 'geoScore' | 'sector' | 'phone'>
): 'hot' | 'warm' | 'cold' {
  let points = 0;

  if (lead.scoreGap >= 20) points += 3;
  else if (lead.scoreGap >= 10) points += 2;
  else if (lead.scoreGap > 0) points += 1;

  if (lead.geoScore >= 35 && lead.geoScore <= 65) points += 2;
  else if (lead.geoScore < 35) points += 1;

  const hotSectors = ['legal', 'accounting', 'healthcare', 'realestate'];
  if (hotSectors.includes(lead.sector)) points += 2;

  if (lead.phone) points += 1;

  if (points >= 6) return 'hot';
  if (points >= 3) return 'warm';
  return 'cold';
}
