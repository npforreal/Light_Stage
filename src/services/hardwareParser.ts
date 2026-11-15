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

  // Visual / LED Screen detection
  if (
    lower.includes('màn led') ||
    lower.includes('led screen') ||
    lower.includes('màn hình') ||
    lower.includes('led main') ||
    lower.includes('led cánh') ||
    lower.includes('led sàn') ||
    lower.includes('banner')
  ) {
    let subType: VisualScreenType = 'Other';
    if (lower.includes('main') || lower.includes('chính') || lower.includes('trung tâm')) {
      subType = 'MainScreen';
    } else if (lower.includes('cánh') || lower.includes('wing') || lower.includes('trái') || lower.includes('phải') || lower.includes('left') || lower.includes('right')) {
      subType = 'WingScreen';
    } else if (lower.includes('sàn') || lower.includes('floor')) {
      subType = 'FloorScreen';
    } else if (lower.includes('banner') || lower.includes('ribbon') || lower.includes('dải')) {
      subType = 'Banner';
    }
    return { category: 'Visual', subType };
  }

  // Lighting detection
  if (lower.includes('beam')) {
    return { category: 'Lighting', subType: 'Beam' };
  }
  if (lower.includes('spot')) {
    return { category: 'Lighting', subType: 'Spot' };
  }
  if (lower.includes('wash')) {
    return { category: 'Lighting', subType: 'Wash' };
  }
  if (lower.includes('par') || lower.includes('parled') || lower.includes('par led')) {
    return { category: 'Lighting', subType: 'ParLED' };
  }
  if (lower.includes('blinder') || lower.includes('mặt trời')) {
    return { category: 'Lighting', subType: 'Blinder' };
  }
  if (lower.includes('follow') || lower.includes('rọi')) {
    return { category: 'Lighting', subType: 'Follow' };
  }
  if (lower.includes('laser')) {
    return { category: 'Lighting', subType: 'Laser' };
  }
  if (lower.includes('strobe') || lower.includes('chớp')) {
    return { category: 'Lighting', subType: 'Strobe' };
  }
  if (lower.includes('smoke') || lower.includes('khói') || lower.includes('haze') || lower.includes('fog')) {
    return { category: 'Lighting', subType: 'Smoke' };
  }

  return { category: defaultCategory, subType: 'Other' };
}

/**
 * Extracts individual device specifications and quantities from freeform text.
 * Examples:
 * - "4 Beam 350W + 2 Follow" -> Beam 350W (4), Follow (2)
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
    let count: number | null = null;
    let cleanName = clause;

    // Pattern 1: Suffix multiplier: "Beam 350W x 4", "Màn LED cánh * 2", "Spot: 4"
    const suffixMatch = clause.match(/^(.+?)\s*(?:[xX*:]|\bx\b)\s*(\d+)\s*(?:cây|cái|chiếc|bộ|màn|tấm)?$/i);
    if (suffixMatch) {
      cleanName = suffixMatch[1].trim();
      count = parseInt(suffixMatch[2], 10);
    } else {
      // Pattern 2: Prefix multiplier: "4 Beam 350W", "12x Par LED", "2 cây Follow"
      const prefixMatch = clause.match(/^(\d+)\s*(?:x|X|\*|cây|cái|chiếc|bộ|màn|tấm)?\s*(.+)$/i);
      if (prefixMatch) {
        count = parseInt(prefixMatch[1], 10);
        cleanName = prefixMatch[2].trim();
      } else {
        // Pattern 3: Vietnamese unit pattern: "Beam 4 cây", "Follow 2 chiếc"
        const unitSuffixMatch = clause.match(/^(.+?)\s+(\d+)\s+(?:cây|cái|chiếc|bộ|màn|tấm)$/i);
        if (unitSuffixMatch) {
          cleanName = unitSuffixMatch[1].trim();
          count = parseInt(unitSuffixMatch[2], 10);
        }
      }
    }

    // Fallback: If no explicit quantity detected but contains a known keyword, default count to 1
    if (count === null || isNaN(count) || count <= 0) {
      const lower = clause.toLowerCase();
      const hasKnownHardware =
        lower.includes('beam') ||
        lower.includes('spot') ||
        lower.includes('wash') ||
        lower.includes('par') ||
        lower.includes('blinder') ||
        lower.includes('follow') ||
        lower.includes('laser') ||
        lower.includes('strobe') ||
        lower.includes('khói') ||
        lower.includes('màn led') ||
        lower.includes('led');

      if (hasKnownHardware) {
        count = 1;
        cleanName = clause;
      } else {
        continue; // Not recognized as hardware
      }
    }

    // Clean up trailing punctuation & spaces
    cleanName = cleanName.replace(/^[ -:]+|[ -:]+$/g, '').trim();
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
