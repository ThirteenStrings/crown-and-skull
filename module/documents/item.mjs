/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class CraskItem extends Item {
  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which defines the data schema used by dice roll commands against this Item
   * @override
   */
  getRollData() {
    // Starts off by populating the roll data with a shallow copy of `this.system`
    const rollData = { ...this.system };

    // Quit early if there's no parent actor
    if (!this.actor) return rollData;

    // If present, add the actor's roll data
    rollData.actor = this.actor.getRollData();

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll(event) {
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `${item.name}`;

    // If there's no roll data, send a chat message.
    if (!this.system.dmg) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? '',
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();
      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.dmg, rollData);
      // If you need to store the value first, uncomment the next line.
      // const result = await roll.evaluate();
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }

  /**
   * Override for default artwork
   * @override
   */
    static getDefaultArtwork(itemData) {
  
      const defaultImages = {
        equipment: 'systems/crown-and-skull/assets/icons/Black/Equipment.svg',
        smallitem: 'systems/crown-and-skull/assets/icons/Black/SmallItem.svg',
        largeitem: 'systems/crown-and-skull/assets/icons/Black/Equipment.svg',
        skill: 'systems/crown-and-skull/assets/icons/Black/d20.svg',
        spell: 'systems/crown-and-skull/assets/icons/Black/Spellbook.svg',
        advancement: 'systems/crown-and-skull/assets/icons/Black/Spellbook.svg',
        reward: 'systems/crown-and-skull/assets/icons/Black/Ring.svg',
        flora: 'systems/crown-and-skull/assets/icons/Black/Herb.svg',
        flaw: 'systems/crown-and-skull/assets/icons/Black/Skull.svg',
        companion: 'systems/crown-and-skull/assets/icons/Black/Companion.svg',
        ability: 'systems/crown-and-skull/assets/icons/Black/Ability.svg'
      };

      // Check if the item type exists in defaultImages object
      if (defaultImages[itemData.type]) {
        return { img: defaultImages[itemData.type] };
      }
      
      return super.getDefaultArtwork(itemData);
    };
}
