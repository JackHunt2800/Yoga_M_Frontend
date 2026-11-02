import { PracticeItem } from './api';

export interface DailyPlaylist {
  id: string;
  dateKey: string; // YYYY-MM-DD
  displayDate: string; // e.g. "Wednesday, Oct 28, 2026"
  difficulty: 'foundations' | 'intermediate' | 'deepening';
  asanas: PracticeItem[];
  mudras: PracticeItem[];
  mantras: PracticeItem[];
  totalDurationMinutes: number;
  isToday: boolean;
}

/**
 * Format an ISO date string or Date into YYYY-MM-DD in local time
 */
export function getDateKey(isoDateString?: string): string {
  if (!isoDateString) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    // Format as YYYY-MM-DD using local year/month/date
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

/**
 * Human-friendly format for date header
 */
export function formatDisplayDate(dateKey: string): string {
  try {
    const [year, month, day] = dateKey.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateKey;
  }
}

/**
 * Group practice items into daily playlists based on Created Date and Difficulty.
 * Mudras and Mantras from the same created date accompany each playlist.
 */
export function buildDailyPlaylists(items: PracticeItem[]): DailyPlaylist[] {
  if (!items || items.length === 0) return [];

  const todayKey = getDateKey(new Date().toISOString());

  // 1. Group all items by dateKey
  const byDate: Record<string, { asanas: PracticeItem[]; mudras: PracticeItem[]; mantras: PracticeItem[] }> = {};

  for (const item of items) {
    const dateKey = getDateKey(item.createdAt);
    if (!byDate[dateKey]) {
      byDate[dateKey] = { asanas: [], mudras: [], mantras: [] };
    }

    if (item.pillarType === 'asana') {
      byDate[dateKey].asanas.push(item);
    } else if (item.pillarType === 'mudra') {
      byDate[dateKey].mudras.push(item);
    } else if (item.pillarType === 'mantra') {
      byDate[dateKey].mantras.push(item);
    }
  }

  const playlists: DailyPlaylist[] = [];

  // 2. For each date, create playlists per difficulty level present in Asanas
  const sortedDates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  for (const dateKey of sortedDates) {
    const group = byDate[dateKey];
    const isToday = dateKey === todayKey;
    const displayDate = formatDisplayDate(dateKey);

    const difficulties: Array<'foundations' | 'intermediate' | 'deepening'> = [
      'foundations',
      'intermediate',
      'deepening',
    ];

    for (const diff of difficulties) {
      const matchingAsanas = group.asanas.filter((a) => a.difficulty === diff);

      // Only build a playlist if there are asanas for this difficulty,
      // OR if there are no asanas at all on this date but some mudras/mantras exist
      if (matchingAsanas.length > 0) {
        // Find matching mudras for this difficulty, fallback to any mudra on that date
        const matchingMudras = group.mudras.filter((m) => m.difficulty === diff);
        const selectedMudras = matchingMudras.length > 0 ? matchingMudras : group.mudras;

        // Find matching mantras for this difficulty, fallback to any mantra on that date
        const matchingMantras = group.mantras.filter((m) => m.difficulty === diff);
        const selectedMantras = matchingMantras.length > 0 ? matchingMantras : group.mantras;

        const totalMinutes =
          matchingAsanas.reduce((sum, a) => sum + (a.durationMinutes || 3), 0) +
          selectedMudras.reduce((sum, m) => sum + (m.durationMinutes || 3), 0);

        playlists.push({
          id: `${dateKey}_${diff}`,
          dateKey,
          displayDate,
          difficulty: diff,
          asanas: matchingAsanas,
          mudras: selectedMudras,
          mantras: selectedMantras,
          totalDurationMinutes: Math.max(1, totalMinutes),
          isToday,
        });
      }
    }

    // Edge case: if a date has mudras/mantras but no asanas, create an exploratory session
    if (group.asanas.length === 0 && (group.mudras.length > 0 || group.mantras.length > 0)) {
      const totalMinutes = group.mudras.reduce((sum, m) => sum + (m.durationMinutes || 3), 0) || 5;
      playlists.push({
        id: `${dateKey}_foundations`,
        dateKey,
        displayDate,
        difficulty: 'foundations',
        asanas: [],
        mudras: group.mudras,
        mantras: group.mantras,
        totalDurationMinutes: Math.max(1, totalMinutes),
        isToday,
      });
    }
  }

  return playlists;
}

