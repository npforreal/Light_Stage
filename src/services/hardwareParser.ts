import { DeviceSpecification, LightingFixtureType, VisualScreenType, Act } from '../types/stage';

export interface HardwareItemStats {
  name: string;
  category: 'Lighting' | 'Visual';
  subType: string;
  totalInstances: number;
  peakConcurrent: number;
}

export interface ShowHardwareInventory {
  totalLighting: number;
  totalScreens: number;
  peakLighting: number;
  peakScreens: number;
  inventory: Record<string, HardwareItemStats>;
}

/**
 * Detects fixture or screen category & sub-type from a device description name
 */
export function classifyDevice(name: string, defaultCategory: 'Lighting' | 'Visual' = 'Lighting'): {
  category: 'Lighting' | 'Visual';
  subType: LightingFixtureType | VisualScreenType | string;
} {
  const lower = name.toLowerCase();

  // Exclude non-hardware phrases like "party mode", "spare cable"
  if (/\b(?:spare|party|parallel|particle)\b/i.test(lower) && !/\b(?:beam|spot|wash|blinder|follow|laser|strobe|smoke|haze)\b/i.test(lower)) {
    return { category: defaultCategory, subType: 'Other' };
  }

  // Visual / LED Screen detection with word boundary checks
  if (
    /(?:màn\s+led|led\s+screen|màn\s+hình|led\s+main|led\s+cánh|led\s+sàn|\bbanner\b)/i.test(lower) ||
    (/\bled\b/i.test(lower) && !/\bpar\s+led\b/i.test(lower))
  ) {
    let subType: VisualScreenType = 'Other';
    if (/(?:main|chính|trung\s+tâm)/i.test(lower)) {
      subType = 'MainScreen';
    } else if (/(?:cánh|wing|trái|phải|left|right)/i.test(lower)) {
      subType = 'WingScreen';
    } else if (/(?:sàn|floor)/i.test(lower)) {
      subType = 'FloorScreen';
    } else if (/(?:banner|ribbon|dải)/i.test(lower)) {
      subType = 'Banner';
    }
    return { category: 'Visual', subType };
  }

  // Lighting detection with word boundaries
  if (/\bbeam\b/i.test(lower)) {
    return { category: 'Lighting', subType: 'Beam' };
  }
  if (/\bspot\b/i.test(lower)) {
    return { category: 'Lighting', subType: 'Spot' };
  }
  if (/\bwash\b/i.test(lower)) {
    return { category: 'Lighting', subType: 'Wash' };
  }
  if (/\b(?:parled|par\s+led|par)\b/i.test(lower) && !/\b(?:spare|party|separate)\b/i.test(lower)) {
    return { category: 'Lighting', subType: 'ParLED' };
  }
  if (/\bblinder\b|mặt\s+trời/i.test(lower)) {
    return { category: 'Lighting', subType: 'Blinder' };
  }
  if (/\bfollow\b|rọi/i.test(lower)) {
    return { category: 'Lighting', subType: 'Follow' };
  }
  if (/\blaser\b/i.test(lower)) {
    return { category: 'Lighting', subType: 'Laser' };
  }
  if (/\bstrobe\b|chớp/i.test(lower)) {
    return { category: 'Lighting', subType: 'Strobe' };
  }
  if (/\b(?:smoke|haze|fog)\b|khói/i.test(lower)) {
    return { category: 'Lighting', subType: 'Smoke' };
  }

  return { category: defaultCategory, subType: 'Other' };
}

/**
 * Checks whether text contains authentic lighting or visual hardware keywords with word boundary
 */
function containsHardwareKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  // Filter out non-fixtures
  if (/\b(?:spare|party|cable|dây\s+cáp|đạo\s+cụ|ghế|bàn|quạt)\b/i.test(lower)) {
    const stripped = lower.replace(/\b(?:spare|party|cable|dây\s+cáp|đạo\s+cụ|ghế|bàn|quạt)\b/gi, '');
    if (!/\b(?:beam|spot|wash|par|blinder|follow|laser|strobe|smoke|haze|fog|led|screen)\b/i.test(stripped)) {
      return false;
    }
  }

  return (
    /\b(?:beam|spot|wash|parled|par\s+led|par|blinder|follow|laser|strobe|smoke|haze|fog|led|screen|banner)\b/i.test(lower) ||
    /(?:màn\s+led|màn\s+hình|mặt\s+trời|rọi|chớp|khói|cây\s+follow)/i.test(lower)
  );
}

/**
 * Extracts individual device specifications and quantities from freeform text.
 * Examples:
 * - "4 Beam 350W + 2 Follow" -> Beam 350W (4), Follow (2)
 * - "Beam x 4 (FOH)" -> Beam (FOH) (4)
 * - "Màn LED cánh x 2" -> Màn LED cánh (2)
 * - "Spot 1000W x 4, 12 Par LED" -> Spot 1000W (4), Par LED (12)
 * - "2 cây Follow, 8 cái Beam" -> Follow (2), Beam (8)
 */
export function parseHardwareFromText(
  text: string,
  defaultCategory: 'Lighting' | 'Visual' = 'Lighting'
): DeviceSpecification[] {
  if (!text || typeof text !== 'string') return [];

  // Split into clauses by comma, plus, semicolon, newline, ampersand, or bullet
  const clauses = text
    .split(/[,+;\n\r&•|]|\band\b|\bvới\b|\bcùng\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const results: DeviceSpecification[] = [];

  for (const clause of clauses) {
    // Skip clauses that are false-positive noise
    if (!containsHardwareKeyword(clause)) {
      continue;
    }

    let count: number | null = null;
    let cleanName = clause;

    // Transition pattern: "Blinder 2 -> 0" or "Beam 4 -> 8"
    const transitionMatch = clause.match(/^(.+?)\s+(\d+)\s*(?:->|→)\s*(\d+)/i);
    if (transitionMatch) {
      cleanName = transitionMatch[1].trim();
      const primaryCount = parseInt(transitionMatch[2], 10);
      count = primaryCount > 0 ? primaryCount : parseInt(transitionMatch[3], 10);
    } else {
      // Pattern 1: Suffix multiplier with optional notes: "Beam x 4 (FOH)", "Spot: 4", "Par LED * 6"
      const suffixMatch = clause.match(
        /^(.+?)\s*(?:[xX*:]|\bx\b)\s*(\d+)\s*(?:cây|cái|chiếc|bộ|màn|tấm)?(?:\s*(\([^)]+\)|\[[^\]]+\]))?$/i
      );
      if (suffixMatch) {
        cleanName = suffixMatch[3] ? `${suffixMatch[1].trim()} ${suffixMatch[3].trim()}` : suffixMatch[1].trim();
        count = parseInt(suffixMatch[2], 10);
      } else {
        // Pattern 2: Prefix multiplier: "4 Beam 350W", "12x Par LED", "2 cây Follow"
        const prefixMatch = clause.match(/^(\d+)\s*(?:x|X|\*|cây|cái|chiếc|bộ|màn|tấm)?\s*(.+)$/i);
        if (prefixMatch) {
          count = parseInt(prefixMatch[1], 10);
          cleanName = prefixMatch[2].trim();
        } else {
          // Pattern 3: Vietnamese unit pattern: "Beam 4 cây", "Follow 2 chiếc"
          const unitSuffixMatch = clause.match(/^(.+?)\s+(\d+)\s+(?:cây|cái|chiếc|bộ|màn|tấm)(?:\s*(\([^)]+\)))?$/i);
          if (unitSuffixMatch) {
            cleanName = unitSuffixMatch[3]
              ? `${unitSuffixMatch[1].trim()} ${unitSuffixMatch[3].trim()}`
              : unitSuffixMatch[1].trim();
            count = parseInt(unitSuffixMatch[2], 10);
          }
        }
      }
    }

    // Limit check: 1 to 9999. If quantity exceeds reasonable limit (e.g. 4000000000) or is negative/zero, reject
    if (count !== null && (count <= 0 || count > 9999)) {
      console.warn(`[LightStage] Quantity ${count} out of reasonable range (1-9999) in clause: "${clause}".`);
      continue;
    }

    // Fallback: If no explicit quantity detected but contains a known keyword, default count to 1
    if (count === null || isNaN(count) || count <= 0) {
      if (containsHardwareKeyword(clause)) {
        count = 1;
        cleanName = clause;
      } else {
        continue; // Not recognized as hardware
      }
    }

    // Clean up trailing punctuation & spaces (escaping literal hyphen)
    cleanName = cleanName.replace(/^[ \-:]+|[ \-:]+$/g, '').trim();
    if (!cleanName) continue;

    const { category, subType } = classifyDevice(cleanName, defaultCategory);

    results.push({
      id: `dev-${results.length + 1}-${Math.random().toString(36).substring(2, 6)}`,
      name: cleanName,
      category,
      subType,
      count,
    });
  }

  return results;
}

/**
 * Calculates show-wide hardware statistics: total equipment inventory and peak concurrent usage
 */
export function calculateShowHardwareInventory(acts: Act[]): ShowHardwareInventory {
  const inventory: Record<string, HardwareItemStats> = {};
  let totalLighting = 0;
  let totalScreens = 0;
  let peakLighting = 0;
  let peakScreens = 0;

  for (const act of acts) {
    for (const cue of act.cues) {
      let cueLighting = 0;
      let cueScreens = 0;

      // Collect from LX department
      const lxDevices = cue.departments.lx?.fixtures ?? [];
      const lxCount = cue.departments.lx?.fixtureCount ?? 0;
      cueLighting += Math.max(lxCount, lxDevices.reduce((sum, d) => sum + d.count, 0));

      for (const dev of lxDevices) {
        const key = dev.name.toLowerCase().trim();
        if (!inventory[key]) {
          inventory[key] = {
            name: dev.name,
            category: dev.category,
            subType: dev.subType,
            totalInstances: 0,
            peakConcurrent: 0,
          };
        }
        inventory[key].totalInstances += dev.count;
        if (dev.count > inventory[key].peakConcurrent) {
          inventory[key].peakConcurrent = dev.count;
        }
      }

      // Collect from VX department
      const vxDevices = cue.departments.vx?.screens ?? [];
      const vxCount = cue.departments.vx?.screenCount ?? 0;
      cueScreens += Math.max(vxCount, vxDevices.reduce((sum, d) => sum + d.count, 0));

      for (const dev of vxDevices) {
        const key = dev.name.toLowerCase().trim();
        if (!inventory[key]) {
          inventory[key] = {
            name: dev.name,
            category: dev.category,
            subType: dev.subType,
            totalInstances: 0,
            peakConcurrent: 0,
          };
        }
        inventory[key].totalInstances += dev.count;
        if (dev.count > inventory[key].peakConcurrent) {
          inventory[key].peakConcurrent = dev.count;
        }
      }

      // Track show totals & peaks
      totalLighting += cueLighting;
      totalScreens += cueScreens;
      if (cueLighting > peakLighting) peakLighting = cueLighting;
      if (cueScreens > peakScreens) peakScreens = cueScreens;
    }
  }

  return {
    totalLighting,
    totalScreens,
    peakLighting,
    peakScreens,
    inventory,
  };
}
