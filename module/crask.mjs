// Import document classes.
import { CraskActor } from './documents/actor.mjs';
import { CraskItem } from './documents/item.mjs';
// Import sheet classes.
import { CraskActorSheet } from './sheets/actor-sheet.mjs';
import { CraskItemSheet } from './sheets/item-sheet.mjs';
// Import combat classes.
import { CraskCombat } from './documents/combat.mjs';
// Import chat classes.
import { CraskRollMessage } from './chat/chat-message.mjs';
// Import Data Models
import { CharacterData, EnemyData, CompanionActorData, NPCData, 
         EquipmentData, SkillData, SpellData, LargeItemData, RewardData, AdvancementData, FloraData, FlawData, AbilityData, CompanionItemData } from './data.mjs'


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.crask = {
  documents: {
    CraskActor,
    CraskItem,
    CraskCombat,
  },
  applications: {
    CraskActorSheet,
    CraskItemSheet,
  },
  utils: {
    rollItemMacro,
  },
};

Hooks.once('init', function () {
  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: null,
    decimals: 0,
  };

  // Actor Data Model Registration
  CONFIG.Actor.dataModels = {
    character: CharacterData,
    enemy: EnemyData,
    companion: CompanionActorData,
    npc: NPCData
  };

  //tem Data Model Registration
  CONFIG.Item.dataModels = {
    equipment: EquipmentData,
    skill: SkillData,
    spell: SpellData,
    advancement: AdvancementData,
    largeItem: LargeItemData,
    rewards: RewardData,
    flora: FloraData,
    flaw: FlawData,
    companion: CompanionItemData,
    ability: AbilityData
  };

  // Register Combat and Chat Message Overrides
  CONFIG.Actor.documentClass = CraskActor;
  CONFIG.Item.documentClass = CraskItem;
  CONFIG.Combat.documentClass = CraskCombat;
  CONFIG.ChatMessage.documentClass = CraskRollMessage;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('crask', CraskActorSheet, {
    makeDefault: true,
    label: 'CRASK.SheetLabels.Actor',
  });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('crask', CraskItemSheet, {
    makeDefault: true,
    label: 'CRASK.SheetLabels.Item',
  });

  CONFIG.Actor.trackableAttributes = {
    character: {
      bar: ["attrition.flesh","attrition.equipment","heropoints"]
    },
    enemy: {
      bar: ["hitpoints"]
    }
  }
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper('toLowerCase', function (str) {
  return str.toLowerCase();
});

// Helper to check if values are equal
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

// Help to check if values are greater than
Handlebars.registerHelper('ifGreaterThan', function(arg1, arg2, options) {
  return (arg1 > arg2) ? options.fn(this) : options.inverse(this);
});

// Add an `includes` helper
Handlebars.registerHelper('includes', function(check, inList) {
  return inList.includes(check);
});

// Add a roll string validation helper
Handlebars.registerHelper('isValidRoll', function(str, options) {
  return Roll.validate(str) ? options.fn(this) : options.inverse(this);
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once('ready', function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on('hotbarDrop', (bar, data, slot) => createDocMacro(data, slot));
});


/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

function createDocMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== 'Item') return;
  if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
    ui.notifications.warn(
      'You can only create macro buttons for owned Items'
    );
  }
  _createDocMacro(data, slot);
  return false;
}

async function _createDocMacro(data, slot) {
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.crask.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  console.log(macro);
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: 'script',
      img: item.img,
      command: command,
      flags: { 'crask.itemMacro': true },
      thumbnail: item.img,
    });
    
  }
  game.user.assignHotbarMacro(macro, slot);
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: 'Item',
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}