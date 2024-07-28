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

}
