const CHEST_SIZES = [9, 18, 27, 36, 45, 54];
function chestTitle(size) {
    const paddedSize = String(size).padStart(2, '0');
    return `§c§h§e§s§t§${paddedSize[0]}§${paddedSize[1]}§r`;
}
export class InventoryConfig {
    chestSizes;
    customContent;
    customContentKeys;
    customItems;
    inventoryEnabled = true;
    constructor() {
        this.chestSizes = new Map(CHEST_SIZES.map((size) => [
            size,
            {
                size,
                title: chestTitle(size),
            },
        ]));
        this.customContent = {};
        this.customContentKeys = new Set(Object.keys(this.customContent));
        this.customItems = Object.values(this.customContent).filter((v) => v.type === 'item').length;
    }
    getChestSizeInfo(key) {
        const normalizedSize = typeof key === 'string' ? Number(key) : key;
        if (!CHEST_SIZES.includes(normalizedSize)) {
            return undefined;
        }
        return this.chestSizes.get(normalizedSize);
    }
}
