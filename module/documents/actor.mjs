/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */

import { postRollMessage } from '../chat/chat-roll.mjs';

export class CraskActor extends Actor {
  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the actor source data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.crask || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
    this._prepareEnemyData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
  
  }

  _prepareEnemyData(actorData) {
    if (actorData.type !== 'enemy') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;

  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const data = { ...this.system };

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  /**
   * Override for default artwork
   * @override
   */
    static getDefaultArtwork(itemData) {
  
      const defaultImages = {
        character: 'systems/crown-and-skull/assets/icons/Black/character.svg',
        enemy: 'systems/crown-and-skull/assets/icons/Black/Enemy.svg',
        companion: 'systems/crown-and-skull/assets/icons/Black/Companion.svg',
        npc: 'systems/crown-and-skull/assets/icons/Black/NPC.svg'
      };

      // Check if the item type exists in defaultImages object
      if (defaultImages[itemData.type]) {
        return { img: defaultImages[itemData.type] };
      }
      
      return super.getDefaultArtwork(itemData);
    };

/*
  ROLLS
   */

  async roll(name, group, options = { mod: 0, targetOffset: 0 }) {
    
    // Get the attribute, either in attributes or efforts
    const attribute = this.system[group][name];
    if (attribute == null) throw `Attribute ${group}.${name} not found in actor`;
    let dice = diceMap[name];

    // Determine the modifier, depending on if actor or monster
    let mod = parseInt(options.mod);
    if (this.type === 'character') mod += attribute.total;
    else if (this.type === 'monster') mod += attribute + this.system[group].all + this.system.allRollsMod;

    // Do the roll
    let formula = `@dice`;
    const roll = new Roll(formula, { dice: dice, mod: mod, name: name });
    postRollMessage(this, roll, undefined, { isHardSuitRoll });
  }

  /**
   * Helper Functions
   */
  async equipmentAttrition() {
    if (this.type !== "character") {
      ui.notifications.warn("Must select a PC character token.")
      return;
    }
    let undamagedEquipment = [];
    let flavorText = '';
    let messageContent = '';
    let currentUses;
    let selectedItem;
    let items = this.items;

    for (const i of items) {
      if (i.type === "equipment" && i.system.isDamaged === false && !i.system.isInPouch) {
        undamagedEquipment.push(i);
      }
    }

    if (undamagedEquipment.length) {
      selectedItem = undamagedEquipment[Math.floor(Math.random()*undamagedEquipment.length)];

      if (selectedItem.system.uses.current) {
        currentUses = selectedItem.system.uses.current
      }
      
      messageContent = '<b>' + selectedItem.name + '</b> ';

      if (selectedItem.system.hasMultiAttrition && currentUses > 1) {
        currentUses --;
        messageContent += 'lost a use. ' + this.name + ' has ';
        if (this.system.attrition.equipment < 1) {
          messageContent += 'no Equipment remaining. The next hit will be lethal!';
        } else {
          messageContent += this.system.attrition.equipment + ' equipment remaining.';
        }
      } else {
        if (selectedItem.system.hasMultiAttrition) {
          currentUses --;
        }
        selectedItem.update({"system.isDamaged": true});
        messageContent += 'damaged!<br><br>' + this.name + ' has ';
        if (this.system.attrition.equipment < 2) {
          messageContent += 'no Equipment remaining. The next hit will be lethal!';
        } else {
          messageContent += this.system.attrition.equipment -1 + ' equipment remaining.';
        }
      }
      
      flavorText = 'Equipment Attrition!';
      
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: flavorText,
        content: messageContent,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
      });

    } else {
      flavorText = 'Hit to the heart!';
      messageContent = this.name + ' will die at the end of Phase 5 without intervention!';

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: flavorText,
        content: messageContent,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
      });
    }

    if (currentUses !== null && currentUses >= 0) {
      await selectedItem.update({'system.uses.current': currentUses});
    }
  }

  async fleshAttrition() {
    if (this.type !== "character") {
      ui.notifications.warn("Must select a PC character token.")
      return;
    }
    const items = this.items;
    let undamagedSkills = [];
    let flavorText = '';
    let messageContent = '';

    for (const i of items) {
      if (i.type === "skill" && i.system.isDamaged === false) {
        undamagedSkills.push(i);
      }
    }
    
    if (undamagedSkills.length) {
      const selectedItem = undamagedSkills[Math.floor(Math.random()*undamagedSkills.length)];
      selectedItem.update({"system.isDamaged": true});

      flavorText = 'Flesh Attrition!'
      messageContent = '<b>' + selectedItem.name + '</b> skill damaged!<br><br>' + this.name + ' has ';

      if (this.system.attrition.flesh < 2) {
        messageContent += 'no Skills remaining. The next hit will be lethal!';
      } else if (this.system.attrition.flesh < 3) {
        messageContent += this.system.attrition.flesh -1 + ' skill remaining.';
      } else {
        messageContent += this.system.attrition.flesh -1 + ' skills remaining.';
      }

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: flavorText,
        content: messageContent,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
      });

    } else {
      flavorText = 'Hit to the heart!'
      messageContent = this.name + ' will die at the end of Phase 5 without intervention!'

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: flavorText,
        content: messageContent,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
      });
    }
  }

  async brutalAttrition() {
    if (this.type !== "character") {
      ui.notifications.warn("Must select a PC character token.")
      return;
    }
    const items = this.items;
    let undamagedItems = [];
    let messageContent = '';

    // Get undamaged equipment and skills
    for (const i of items) {
      if (!i.system.isDamaged) {
        if (i.type === "skill") {
          undamagedItems.push(i);
        }
        if (i.type === "equipment" && !i.system.isInPouch) {
          if (i.system.hasMultiAttrition) {
            for (let j = 0; j < i.system.uses.current; j++) {
              undamagedItems.push(i);
            }
          } else {
            undamagedItems.push(i);
          }
        }
      }
    }

    // Roll 1D6
    let roll = await new Roll("1d6").evaluate();
    if (game.modules.get('dice-so-nice')?.active) {
      await game.dice3d.showForRoll(roll, game.user, true);
    }

    let flavorText = `Brutal Attrition! [${roll.total}]`;

    // Construct Chat Message
    if (roll.total > undamagedItems.length) {
      for (const i of undamagedItems) {
        i.update({"system.isDamaged": true});
      };
      flavorText += " ❖ <b style='color: red'>Hit to the heart!</b>"
      messageContent = `Attrition exceeds available equipment and skills. ${this.name} will die at the end of Phase 5 without intervention!`
    } else if (roll.total === undamagedItems.length) {
      for (const i of undamagedItems) {
        i.update({"system.isDamaged": true});
      }
      messageContent = `Attrition equals available equipment and skills. The next hit will be lethal!`
    } else {
      let selectedItems = undamagedItems.sort(() => 0.5 - Math.random()).slice(0,roll.total);
      for (const i of selectedItems) {
        if (i.system.hasMultiAttrition) {
          let currentUses = i.system.uses.current;
          currentUses --;
          if (currentUses === 0) {
            i.update({"system.uses.current": currentUses, "system.isDamaged": true})
            messageContent += `<b>${i.name}</b> is damaged!<br>`
          } else {
            await i.update({"system.uses.current": currentUses});
            messageContent += `<b>${i.name}</b> lost a use!<br>`
          }
        } else {
          i.update({"system.isDamaged": true});
          messageContent += `<b>${i.name}</b> is damaged!<br>`
        }
      }
      messageContent += `<br>Remaing attrition...<br><b>Equipment:</b> ${this.system.attrition.equipment}<br><b>Skill:</b> ${this.system.attrition.flesh}`
    }
    
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: flavorText,
      content: messageContent,
      type: CONST.CHAT_MESSAGE_STYLES.OTHER
    });

  }

  async destroyAttrition() {
    // Check if valid actor
    if (this.type !== "character") {
      ui.notifications.warn("Must select a PC character token.")
      return;
    }
    
    // Get equipment and undamaged skills
    const items = this.items;
    let undamagedSkills = [];
    let eligibleEquipment = [];
    for (const i of items) {
      if (i.type === "equipment" && !i.system.isInPouch) {
        eligibleEquipment.push(i);
      }
      if (i.type === "skill" && !i.system.isDamaged) {
        undamagedSkills.push(i);
      }
    }

    // Select Items to Destroy / Damage
    let selectedEquipment
    let selectedSkill
    let hitToHeart = false;

    if (eligibleEquipment) {
      selectedEquipment = eligibleEquipment[Math.floor(Math.random()*eligibleEquipment.length)];
    }

    if (undamagedSkills) {
      selectedSkill = undamagedSkills[Math.floor(Math.random()*undamagedSkills.length)];
    }
    
    // Construct Chat Message
    let flavorText = `Destroy Attrition!`;
    let messageContent = ``;
    if (selectedEquipment) {
      messageContent += `<b>${selectedEquipment.name}</b> destroyed permanently!<br>`;
    } else {
      messageContent += `No equipment to destroy. <b style="color:red">Hit to the heart!</b><br>`;
      hitToHeart = true;
    }

    if (selectedSkill) {
      messageContent += `<b>${selectedSkill.name}</b> skill damaged!<br><br>`;
    } else {
      messageContent += `No skill to damage. <b style="color:red">Hit to the heart!</b><br><br>`;
      hitToHeart = true;
    }

    if (!hitToHeart) {
      messageContent += `Remaing attrition...<br><b>Equipment:</b> ${this.system.attrition.equipment -1}<br><b>Skill:</b> ${this.system.attrition.flesh -1}`
    } else {
      messageContent += `${this.name} will die at the end of Phase 5!`
    }

    if (selectedEquipment) {
      if (game.settings.get('crown-and-skull','autoDestroy')) {
        let currentLost = this.system.heropoints.lost;
        currentLost += selectedEquipment.system.cost;
        this.update({"system.heropoints.lost": currentLost});
        selectedEquipment.delete();
      }
    }

    if (selectedSkill) {
      selectedSkill.update({"system.isDamaged": true})
    }
    
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: flavorText,
      content: messageContent,
      type: CONST.CHAT_MESSAGE_STYLES.OTHER
    });
  }
}
