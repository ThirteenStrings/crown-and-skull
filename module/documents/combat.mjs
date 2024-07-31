/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Combat}
 */

export class CraskCombat extends Combat {
    
  _sortCombatants(a, b) {
    let phase = a.combat.phase;
    return super._sortCombatants(b, a);
  }


}