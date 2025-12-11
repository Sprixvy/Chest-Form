export class InventoryConfig {
    CHEST_SIZES;
    customContent;
    customContentKeys;
    customItems;
    inventoryEnabled;
    constructor() {
        this.CHEST_SIZES = new Map([
            ['9', ['§c§h§e§s§t§0§9§r', 9]],
            ['18', ['§c§h§e§s§t§1§8§r', 18]],
            ['27', ['§c§h§e§s§t§2§7§r', 27]],
            ['36', ['§c§h§e§s§t§3§6§r', 36]],
            ['45', ['§c§h§e§s§t§4§5§r', 45]],
            ['54', ['§c§h§e§s§t§5§4§r', 54]],
            [9, ['§c§h§e§s§t§0§9§r', 9]],
            [18, ['§c§h§e§s§t§1§8§r', 18]],
            [27, ['§c§h§e§s§t§2§7§r', 27]],
            [36, ['§c§h§e§s§t§3§6§r', 36]],
            [45, ['§c§h§e§s§t§4§5§r', 45]],
            [54, ['§c§h§e§s§t§5§4§r', 54]],
            ['single', ['§c§h§e§s§t§2§7§r', 27]],
            ['double', ['§c§h§e§s§t§5§4§r', 54]],
        ]);
        this.customContent = {
            'custom:item': {
                texture: 'textures/items/paper',
                type: 'other',
            },
        };
        this.customContentKeys = new Set(Object.keys(this.customContent));
        this.customItems = Object.values(this.customContent).filter((v) => v.type === 'item').length;
        this.inventoryEnabled = true;
    }
}
