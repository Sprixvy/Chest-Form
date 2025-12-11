import { world } from '@minecraft/server';
import { ChestFormData } from './extensions/main';
world.afterEvents.itemUse.subscribe((evd) => {
    if (evd.itemStack.typeId !== 'minecraft:compass')
        return;
    primaryMenu(evd.source);
});
function primaryMenu(player) {
    new ChestFormData('double')
        .title('§l§5Primary Menu')
        .button(21, '§l§6Test Item 1', ['', '§r§7A testing item'], 'minecraft:magma_cream', 14)
        .button(22, '§l§nTest Item 2', ['', '§r§7Another item'], 'textures/items/netherite_axe', 1, 10)
        .button(23, '§l§bTest Item 3', ['', '§r§7A third item'], 'minecraft:tnt', 64, 0, true)
        .button(30, '§l§2Test Item 4', ['', '§r§7A fourth item'], 'custom:item', 64, 0, true)
        .pattern(['_________', '__xxxxx__', '__x___x__', '__x___x__', '__xxxxx__'], {
        x: {
            name: { rawtext: [{ text: 'Pattern' }] },
            description: ['§7This is a pattern!'],
            enchanted: false,
            amount: 1,
            texture: 'minecraft:black_stained_glass_pane',
        },
    })
        .show(player)
        .then((response) => {
        if (response.canceled)
            return;
        world.sendMessage(`${player.name} has chosen item ${response.selection}`);
    });
}
