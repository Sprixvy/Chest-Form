import { ItemComponentTypes } from '@minecraft/server';

export type PotionKind = 'potion' | 'splash' | 'lingering';

type PotionMeta = { potionOf: string; effectName: string };
type EffectLine = { name: string; amplifier?: number; durationTicks?: number };

const POTION_META: Record<string, PotionMeta> = {
    mundane: { potionOf: 'Mundane', effectName: 'Mundane' },
    thick: { potionOf: 'Thick', effectName: 'Thick' },
    awkward: { potionOf: 'Awkward', effectName: 'Awkward' },

    nightvision: { potionOf: 'Night Vision', effectName: 'Night Vision' },
    invisibility: { potionOf: 'Invisibility', effectName: 'Invisibility' },
    leaping: { potionOf: 'Leaping', effectName: 'Jump Boost' },
    fire_resistance: { potionOf: 'Fire Resistance', effectName: 'Fire Resistance' },
    swiftness: { potionOf: 'Swiftness', effectName: 'Speed' },
    slowness: { potionOf: 'Slowness', effectName: '§cSlowness' },
    water_breathing: { potionOf: 'Water Breathing', effectName: 'Water Breathing' },
    healing: { potionOf: 'Healing', effectName: 'Instant Health' },
    harming: { potionOf: 'Harming', effectName: '§cInstant Damage' },
    poison: { potionOf: 'Poison', effectName: '§cPoison' },
    regeneration: { potionOf: 'Regeneration', effectName: 'Regeneration' },
    strength: { potionOf: 'Strength', effectName: 'Strength' },
    weakness: { potionOf: 'Weakness', effectName: '§cWeakness' },
    slow_falling: { potionOf: 'Slow Falling', effectName: 'Slow Falling' },
    wither: { potionOf: 'Decay', effectName: '§cWither' },
    turtle_master: { potionOf: 'the Turtle Master', effectName: '§cSlowness' },
    wind_charged: { potionOf: 'Wind Charging', effectName: '§cWind Charged' },
    weaving: { potionOf: 'Weaving', effectName: '§cWeaving' },
    oozing: { potionOf: 'Oozing', effectName: '§cOozing' },
    infested: { potionOf: 'Infestation', effectName: '§cInfested' },
};

const STRONG_LEVEL: Record<string, number> = {
    slowness: 4,
    turtle_master: 4,
    leaping: 2,
    swiftness: 2,
    strength: 2,
    healing: 2,
    harming: 2,
    regeneration: 2,
    poison: 2,
};

const FALLBACK_EFFECTS: Record<string, (durationTicks: number, inferredLevel: number) => EffectLine[]> = {
    wither: (durationTicks) => [{ name: POTION_META.wither.effectName, amplifier: 2, durationTicks }],
    turtle_master: (durationTicks) => [
        { name: POTION_META.turtle_master.effectName, amplifier: 4, durationTicks },
        { name: 'Resistance', amplifier: 3, durationTicks },
    ],
};

function titleCaseKey(key: string): string {
    return key.replace(/_/g, ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
}

function stripNamespace(id: string): string {
    return id.includes(':') ? id.split(':')[1] : id;
}

function normalizePotionEffectId(rawId: string): { base: string; isLong: boolean; isStrong: boolean } {
    const id = stripNamespace(rawId);

    let isLong = false;
    let isStrong = false;
    let base = id;

    if (base.startsWith('long_')) {
        isLong = true;
        base = base.slice('long_'.length);
    } else if (base.startsWith('strong_')) {
        isStrong = true;
        base = base.slice('strong_'.length);
    }

    return { base, isLong, isStrong };
}

function readAmplifier1Based(value: any): number | undefined {
    const raw = value?.amplifier ?? value?.amplifierLevel ?? value?.level ?? value?.effectLevel ?? value?.amplifier_level;
    return typeof raw === 'number' ? raw + 1 : undefined;
}

function tryReadEffectList(potionComponent: any): EffectLine[] | null {
    const candidateMethods = [potionComponent?.getPotionEffects, potionComponent?.getEffects, potionComponent?.getStatusEffects];
    const effectListMethod = candidateMethods.find((method) => typeof method === 'function');
    if (!effectListMethod) return null;

    try {
        const list = effectListMethod.call(potionComponent);
        if (!Array.isArray(list) || list.length === 0) return null;

        return list.map((entry: any) => {
            const rawId = stripNamespace(entry?.type?.id ?? entry?.id ?? '');
            const { base } = normalizePotionEffectId(rawId);

            const meta = POTION_META[base] ?? {
                potionOf: titleCaseKey(base),
                effectName: titleCaseKey(base),
            };

            const amplifier = readAmplifier1Based(entry) ?? 1;
            const durationTicks = entry?.durationTicks ?? entry?.duration ?? 0;

            return { name: meta.effectName, amplifier, durationTicks };
        });
    } catch {
        return null;
    }
}

export function ticksToMSS(ticks: number): string {
    const totalSeconds = Math.max(0, Math.floor(ticks / 20));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(1, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function toRoman(value: number): string {
    if (value <= 0) return '';
    if (value === 1) return 'I';
    if (value === 2) return 'II';
    if (value === 3) return 'III';
    if (value === 4) return 'IV';
    if (value === 5) return 'V';
    return String(value);
}

export function getPotionKind(itemTypeId: string): PotionKind | null {
    if (itemTypeId === 'minecraft:potion') return 'potion';
    if (itemTypeId === 'minecraft:splash_potion') return 'splash';
    if (itemTypeId === 'minecraft:lingering_potion') return 'lingering';
    return null;
}

export function buildPotionDisplay(item: any): {
    textureKey: string;
    displayName: string;
    effectLines: string[];
    whenAppliedLines: string[];
} | null {
    const kind = getPotionKind(item.typeId);
    if (!kind) return null;

    const potionComponent = item.getComponent(ItemComponentTypes.Potion);
    if (!potionComponent) return null;

    const potionEffectType = potionComponent.potionEffectType;
    if (!potionEffectType) return null;

    const { base, isStrong } = normalizePotionEffectId(potionEffectType.id);

    const meta = POTION_META[base] ?? {
        potionOf: titleCaseKey(base),
        effectName: titleCaseKey(base),
    };

    const kindLabel = kind === 'potion' ? 'Potion' : kind === 'splash' ? 'Splash Potion' : 'Lingering Potion';
    const displayName = `${kindLabel} of ${meta.potionOf}`;

    const suffix = kind === 'potion' ? 'potion' : kind === 'splash' ? 'splash_potion' : 'lingering_potion';
    const textureKey = `minecraft:${base}_${suffix}`;

    const defaultDurationTicks: number = potionEffectType.durationTicks ?? 0;

    let effects = tryReadEffectList(potionComponent);

    if (!effects) {
        const componentLevel = readAmplifier1Based(potionEffectType);
        const inferredLevel = isStrong ? STRONG_LEVEL[base] ?? 2 : 1;
        const amplifier = componentLevel ?? inferredLevel;
        const fallbackBuilder = FALLBACK_EFFECTS[base];

        effects = fallbackBuilder ? fallbackBuilder(defaultDurationTicks, amplifier) : [{ name: meta.effectName, amplifier, durationTicks: defaultDurationTicks }];
    }

    const effectLines = effects.map((effect) => {
        const ticks = effect.durationTicks ?? 0;
        const totalSeconds = Math.floor(ticks / 20);
        const amplifierSuffix = effect.amplifier && effect.amplifier > 1 ? ` ${toRoman(effect.amplifier)}` : '';

        if (totalSeconds <= 0) return `${effect.name}${amplifierSuffix}`;
        return `${effect.name}${amplifierSuffix} (${ticksToMSS(ticks)})`;
    });

    const primaryAmplifier = effects[0]?.amplifier ?? 1;

    let whenAppliedLines: string[] = [];

    switch (base) {
        case 'swiftness': {
            const percent = 20 * primaryAmplifier;
            whenAppliedLines = [`§r\n\n§5When Applied:\n§r§9+${percent}% Speed`];
            break;
        }
        case 'slowness': {
            const percent = 15 * primaryAmplifier;
            whenAppliedLines = [`§r\n\n§5When Applied:\n§r§c-${percent}% Speed`];
            break;
        }
        case 'strength': {
            let amount = 1.3 * primaryAmplifier;
            if (amount === 2.6) amount = 2.99;
            whenAppliedLines = [`§r\n\n§5When Applied:\n§r§9+${amount} Attack Damage`];
            break;
        }
        case 'weakness': {
            const amount = 0.7 * primaryAmplifier;
            whenAppliedLines = [`§r\n\n§5When Applied:\n§r§c-${amount} Attack Damage`];
            break;
        }
        case 'turtle_master': {
            whenAppliedLines = [`§r\n\n§5When Applied:\n§r§c-60% Speed`];
            break;
        }
        default: {
            whenAppliedLines = [];
            break;
        }
    }

    return { textureKey, displayName, effectLines, whenAppliedLines };
}
