const CHEST_SIZES = [9, 18, 27, 36, 45, 54] as const;

export type ChestSize = (typeof CHEST_SIZES)[number];

type ChestSizeInfo = Readonly<{ title: string; size: ChestSize }>;

function chestTitle(size: ChestSize): string {
    const paddedSize = String(size).padStart(2, '0');
    return `§c§h§e§s§t§${paddedSize[0]}§${paddedSize[1]}§r`;
}

type CustomContent = Readonly<{
    texture: string;
    type: 'block' | 'item' | 'other';
}>;

export class InventoryConfig {
    public readonly chestSizes: ReadonlyMap<ChestSize, ChestSizeInfo>;
    public readonly customContent: Readonly<Record<string, CustomContent>>;
    public readonly customContentKeys: ReadonlySet<string>;
    public readonly customItems: number;
    public readonly inventoryEnabled = true;

    constructor() {
        this.chestSizes = new Map<ChestSize, ChestSizeInfo>(
            CHEST_SIZES.map((size): [ChestSize, ChestSizeInfo] => [
                size,
                {
                    size,
                    title: chestTitle(size),
                },
            ]),
        );

        this.customContent = {} satisfies Record<string, CustomContent>;
        this.customContentKeys = new Set(Object.keys(this.customContent));
        // prettier-ignore
        this.customItems = Object.values(this.customContent).filter((v) => v.type === 'item').length;
    }

    getChestSizeInfo(key: string | number): ChestSizeInfo | undefined {
        const normalizedSize = typeof key === 'string' ? Number(key) : key;

        if (!CHEST_SIZES.includes(normalizedSize as ChestSize)) {
            return undefined;
        }

        return this.chestSizes.get(normalizedSize as ChestSize);
    }
}
