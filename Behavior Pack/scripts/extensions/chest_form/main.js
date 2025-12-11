import { EntityComponentTypes, ItemComponentTypes } from '@minecraft/server';
import { ActionFormData } from '@minecraft/server-ui';
import { InventoryConfig } from './constants';
import { dataTypes, itemTypes } from './item-types';
function isRawText(obj) {
    return obj != null && Array.isArray(obj.rawtext);
}
const config = new InventoryConfig();
function toRoman(level) {
    if (level <= 0)
        return '';
    const map = [
        [10, 'X'],
        [9, 'IX'],
        [5, 'V'],
        [4, 'IV'],
        [1, 'I'],
    ];
    let res = '';
    for (const [val, sym] of map) {
        while (level >= val) {
            res += sym;
            level -= val;
        }
    }
    return res;
}
function formatEnchantName(id) {
    const base = id.replace(/.*(?<=:)/, '').replace(/_/g, ' ');
    return base.replace(/(^\w|\s\w)/g, (m) => m.toUpperCase());
}
class ChestFormData {
    #buttonArray;
    #titleText;
    slotCount;
    constructor(size = 'single') {
        const sizing = config.CHEST_SIZES.get(size) ?? ['', 27];
        this.slotCount = sizing[1];
        this.#buttonArray = Array(this.slotCount).fill(['', undefined]);
        this.#titleText = {
            rawtext: [
                {
                    text: sizing[0],
                },
            ],
        };
    }
    title(text) {
        if (typeof text === 'string') {
            this.#titleText.rawtext.push({ text });
        }
        else if (isRawText(text)) {
            this.#titleText.rawtext.push(...text.rawtext);
        }
        else {
            this.#titleText.rawtext.push(text);
        }
        return this;
    }
    button(slot, name, description, texture, amount = 1, durability = 0, enchanted = false) {
        const targetTexture = texture && config.customContentKeys.has(texture) ? config.customContent[texture]?.texture : texture;
        const id = targetTexture ? dataTypes.get(targetTexture) ?? itemTypes.get(targetTexture) : undefined;
        const rawText = {
            rawtext: [
                {
                    text: `stack#${String(Math.min(Math.max(amount, 1), 99)).padStart(2, '0')}dur#${String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0')}§r`,
                },
            ],
        };
        if (typeof name === 'string') {
            rawText.rawtext.push({ text: `${name}§r` });
        }
        else if (isRawText(name)) {
            rawText.rawtext.push(...name.rawtext, { text: '§r' });
        }
        else {
            return this;
        }
        if (description?.length) {
            for (const obj of description) {
                if (typeof obj === 'string') {
                    rawText.rawtext.push({ text: `\n${obj}` });
                }
                else if (isRawText(obj)) {
                    rawText.rawtext.push(...obj.rawtext, { text: '§r' });
                }
            }
        }
        const encoded = id === undefined ? targetTexture : (id + (id < 256 ? 0 : config.customItems)) * 65536 + (enchanted ? 32768 : 0);
        const index = Math.max(0, Math.min(slot, this.slotCount - 1));
        this.#buttonArray.splice(index, 1, [rawText, encoded]);
        return this;
    }
    pattern(pattern, key) {
        for (let i = 0; i < pattern.length; i++) {
            const row = pattern[i];
            for (let j = 0; j < row.length; j++) {
                const letter = row.charAt(j);
                const data = key[letter];
                if (!data)
                    continue;
                const slot = j + i * 9;
                const texture = data.texture;
                const targetTexture = texture && config.customContentKeys.has(texture) ? config.customContent[texture]?.texture : texture;
                const id = targetTexture ? dataTypes.get(targetTexture) ?? itemTypes.get(targetTexture) : undefined;
                const { amount = 1, durability = 0, name, description, enchanted = false } = data;
                const stackSize = String(Math.min(Math.max(amount, 1), 99)).padStart(2, '0');
                const durValue = String(Math.min(Math.max(durability, 0), 99)).padStart(2, '0');
                const buttonRawtext = {
                    rawtext: [
                        {
                            text: `stack#${stackSize}dur#${durValue}§r`,
                        },
                    ],
                };
                if (typeof name === 'string') {
                    buttonRawtext.rawtext.push({ text: `${name}§r` });
                }
                else if (isRawText(name)) {
                    buttonRawtext.rawtext.push(...name.rawtext, { text: '§r' });
                }
                else {
                    continue;
                }
                if (Array.isArray(description) && description.length > 0) {
                    for (const obj of description) {
                        if (typeof obj === 'string') {
                            buttonRawtext.rawtext.push({ text: `\n${obj}` });
                        }
                        else if (isRawText(obj)) {
                            buttonRawtext.rawtext.push({ text: '\n' }, ...obj.rawtext);
                        }
                    }
                }
                const encoded = id === undefined ? targetTexture : (id + (id < 256 ? 0 : config.customItems)) * 65536 + (enchanted ? 32768 : 0);
                const index = Math.max(0, Math.min(slot, this.slotCount - 1));
                this.#buttonArray.splice(index, 1, [buttonRawtext, encoded]);
            }
        }
        return this;
    }
    async show(player) {
        const form = new ActionFormData();
        for (const [raw, id] of this.#buttonArray) {
            form.button(raw, String(id));
        }
        form.title(this.#titleText);
        if (!config.inventoryEnabled) {
            const res = await form.show(player);
            return res;
        }
        const container = player.getComponent(EntityComponentTypes.Inventory)?.container;
        if (container) {
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (!item) {
                    form.button('');
                    continue;
                }
                const { typeId, amount } = item;
                const targetTexture = config.customContentKeys.has(typeId) ? config.customContent[typeId].texture : typeId;
                const id = dataTypes.get(targetTexture) ?? itemTypes.get(targetTexture);
                const durability = item.getComponent(ItemComponentTypes.Durability);
                let durabilityValue = 0;
                if (durability) {
                    const max = durability.maxDurability;
                    const damage = durability.damage;
                    if (damage > 0) {
                        durabilityValue = Math.max(1, Math.min(99, Math.round(((max - damage) / max) * 99)));
                    }
                }
                const baseName = typeId
                    .replace(/.*(?<=:)/, '')
                    .replace(/_/g, ' ')
                    .replace(/(^\w|\s\w)/g, (m) => m.toUpperCase())
                    .replace('And', 'and');
                const displayName = item.nameTag ?? baseName;
                const rawtext = {
                    rawtext: [
                        {
                            text: `stack#${String(amount).padStart(2, '0')}dur#${String(durabilityValue).padStart(2, '0')}§r${displayName}`,
                        },
                    ],
                };
                const enchantable = item.getComponent(ItemComponentTypes.Enchantable);
                let hasEnchants = false;
                if (enchantable) {
                    const enchants = enchantable.getEnchantments();
                    if (enchants.length > 0)
                        hasEnchants = true;
                    if (hasEnchants && !item.nameTag) {
                        rawtext.rawtext[0].text = rawtext.rawtext[0].text.replace(displayName, `§b${displayName}§r`);
                    }
                    for (const ench of enchants) {
                        const enchName = formatEnchantName(ench.type.id);
                        const levelStr = toRoman(ench.level) || ench.level.toString();
                        rawtext.rawtext.push({
                            text: `§r\n§7${enchName} ${levelStr}`,
                        });
                    }
                }
                const lore = item.getLore().join('\n');
                if (lore) {
                    rawtext.rawtext.push({ text: '§r\n§5' + lore });
                }
                const encoded = id === undefined ? targetTexture : (id + (id < 256 ? 0 : config.customItems)) * 65536 + (hasEnchants ? 32768 : 0);
                form.button(rawtext, String(encoded));
            }
        }
        const res = await form.show(player);
        if (res.canceled || res.selection === undefined)
            return res;
        const selection = res.selection;
        if (selection < this.slotCount) {
            const [] = this.#buttonArray[selection] ?? [];
            return {
                ...res,
                type: 'container',
                slotIndex: selection,
            };
        }
        if (!container)
            return res;
        const invIndex = selection - this.slotCount;
        if (invIndex < 0 || invIndex >= container.size)
            return res;
        return {
            ...res,
            type: 'inventory',
            slotIndex: invIndex,
            containerIndex: invIndex,
        };
    }
}
export { ChestFormData };
