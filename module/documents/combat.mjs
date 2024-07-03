/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Combatant}
 */

export class CraskCombatant extends Combatant {
    /** @override */
    prepareData() {
      // Prepare data for the actor. Calling the super version of this executes
      // the following, in order: data reset (to clear active effects),
      // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
      // prepareDerivedData().
      super.prepareData();
    }

    /**
   * Override for default artwork
   * @override
   */
    static _onUpdateDescendantDocuments(parent, collection, documents, data, options, userId) {

        console.log(parent);  

        super._onUpdateDescendantDocuments();
        
    };
}