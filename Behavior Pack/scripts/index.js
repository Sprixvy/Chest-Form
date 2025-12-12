import { world } from '@minecraft/server';
import { ChestFormData } from './extensions/chest-form/index';
import { MinecraftItemTypes } from './extensions/vanilla-data/index';
world.afterEvents.itemUse.subscribe(({ itemStack: item, source: player }) => {
    if (item.typeId !== MinecraftItemTypes.Compass) {
        return;
    }
    mainForm(player);
});
function mainForm(player) {
    const form = new ChestFormData().title('Main Form');
    form.button(12, 'Grass Block', 'minecraft:grass_block', { amount: 1 });
    form.button(14, 'Diamond Sword', 'minecraft:diamond_sword', {
        description: ['§7Sharpness V', '', 'Test (1)', 'Test (2)'],
        durability: 50,
        enchanted: true,
    });
    form.show(player).then(({ canceled, slotIndex, type }) => {
        if (canceled || slotIndex === -1) {
            return;
        }
        if (type === 'container') {
            world.sendMessage(`${type}, ${slotIndex}`);
        }
        else {
            world.sendMessage(`${type}, ${slotIndex}`);
        }
    });
}
