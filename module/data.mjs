// Minimize Repetition
const fields = foundry.data.fields;
function resourceField(initialValue, initialMax) {
  return {
    // Make sure to call new so you invoke the constructor!
    min: new fields.NumberField({ initial: 0 }),
    value: new fields.NumberField({ initial: initialValue }),
    max: new fields.NumberField({ initial: initialMax }),
  };
}

/**
 * Actor Data
 */

// Common Actor Data
class CommonActorData extends foundry.abstract.TypeDataModel {
    static defineSchema() {
    // All actors have a biography section
    return {
        biography: new fields.HTMLField({ initial: "" }),
    }
  }
}

// Character Specific Actor Data
export class CharacterData extends CommonActorData {
  static defineSchema() {
    const commonData = super.defineSchema();
    return {
      ...commonData,
      heropoints: new fields.SchemaField({
          max: new fields.NumberField({ initial: 50, integer: true, min: 0 }),
          spent: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          lost: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          remaining: new fields.NumberField({ initial: 50, integer: true})
      }),
      defense: new fields.NumberField({ initial: 6, integer: true, min: 6, max: 18 }),
      defenseModifier: new fields.NumberField({ initial: 0, integer: true }),
      attrition: new fields.SchemaField({
          flesh: new fields.NumberField({ initial: 0, integer: true, min: 0 }),
          equipment: new fields.NumberField({ initial: 0, integer: true, min: 0})
      }),
      heroCoinAvailable: new fields.BooleanField({ initial: false }),
      lineage: new fields.StringField({ initial: "Human" }),
      hometown: new fields.StringField({ initial: "Gardenburrow" }),
      hasPouch: new fields.BooleanField({ initial: false }),
      hasHerbalistsPouch: new fields.BooleanField({ initial: false }),
      hasBackpack: new fields.BooleanField({ initial: false })
    }
  }
}

// Enemy Specific Actor Data
export class EnemyData extends CommonActorData {
  static defineSchema() {
    const commonData = super.defineSchema();
    return {
      ...commonData,
      hitpoints: new fields.SchemaField({ 
          current: new fields.NumberField({ initial: 25, integer: true, min: 0 }),
          max: new fields.NumberField({ initial: 25, integer: true, min: 0 })
      }),
      attack: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      defense: new fields.NumberField({ initial: 1, integer: true, min: 0 }),
      phases: new fields.ArrayField(new fields.NumberField({ initial: 1 })),
      tactics: new fields.SchemaField({
          number: new fields.NumberField({ initial: 1, integer: true, min: 1, max: 3 }),
          move: new fields.StringField({ initial: "Move and Recover: The enemy relocates, gathers strength." }),
          melee: new fields.StringField({ initial: "Melee Attack: A standard single-target claw or weapon attack." }),
          area: new fields.StringField({ initial: "Area Attack: The enemy uses a spin, ground-pound, cleave or magic attack to hit all heroes at once." })
      }),
      shortdescription: new fields.StringField({ initial: "A short description of the monster." })
    }
  }
}

// Companion Specific Actor Data
export class CompanionActorData extends CommonActorData {
  static defineSchema() {
    const commonData = super.defineSchema();
    return {
      ...commonData,
      attack: new fields.StringField({ initial: "1D4", validate: val => {
        if (!foundry.dice.Roll.validate(val)) {
          throw new Error("Must be a proper roll string ('1d4', '1d8+1', '3', etc.");
        }
      }}),
      defense: new fields.NumberField({ initial: 6, integer: true, min: 6 }) 
    }
  }
}

// NPC Specific Actor Data
export class NPCData extends CommonActorData {
  static defineSchema() {
    const commonData = super.defineSchema();
    return {
      ...commonData,
      location: new fields.StringField({ initial: "" }),
      known: new fields.StringField({ initial: "" }),
      quest: new fields.StringField({ initial: "" })
    }
  }
}

/** 
 * Item Data
 */

// Common Actor Data
class CommonItemData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    // All actors have a biography section
    return {
        description: new fields.HTMLField({ initial: "" }),
        cost: new fields.NumberField({ initial: 0 })
    }
  }
}

// Equipment Data
export class EquipmentData extends CommonItemData {
  static defineSchema() {
    const commonData = super.defineSchema();
    return {
      ...commonData,
      defense: new fields.NumberField({ initial: 0, min: 0, integer: true }),
      damage: new fields.StringField({ initial: "", validate: val => {
        if (!foundry.dice.Roll.validate(val))
          throw new Error("Must be a proper roll string ('1d4', '1d8+1', '3', etc.");
      }}),
      uses: new fields.SchemaField({
        current: new fields.NumberField({ initial: 1 }),
        max: new fields.NumberField({ initial: 1 })
      }),
      isEquipped: new fields.BooleanField({ initial: true }),
      isDamaged: new fields.BooleanField({ initial: false }),
      isInPouch: new fields.BooleanField({ initial: false }),
      isInBackpack: new fields.BooleanField({ initial: false }),
      hasMultiAttrition: new fields.BooleanField({ initial: false })
    }
  }

  static migrateData(source) {
    // Migrate defense and damage
    if ( source.dmg ) { source.damage = source.dmg };
    return super.migrateData(source);
  }
}

// Skill Data
export class SkillData extends CommonItemData {
  static defineSchema() {
    const commonData = super.defineSchema();
    return {
      ...commonData,
      targetNumber: new fields.NumberField({ initial: 3, min: 3, max: 18 }),
      isDamaged: new fields.BooleanField({ initial: false }),
      modifier: new fields.NumberField({ initial: 0, integer: true })
    }
  }
  static migrateData(source) {
    // Migrate target number
    if ( source.dc ) { source.targetNumber = +source.dc; source.dc = null };
    return super.migrateData(source);
  }
  prepareDerivedData() {
    this.totalTarget = this.targetNumber + this.modifier;
  }
}

// Spell Data
export class SpellData extends CommonItemData {
  static defineSchema() {
    const commonData = super.defineSchema();
    return {
      ...commonData,
      effect: new fields.StringField({ initial: "", validate: val => {
        if (!foundry.dice.Roll.validate(val)) {
          throw new Error("Must be a proper roll string ('1d4', '1d8+1', '3', etc.");
        }
      }}),
      duration: new fields.StringField({ initial: "", validate: val => {
        if (!foundry.dice.Roll.validate(val)) {
          throw new Error("Must be a proper roll string ('1d4', '1d8+1', '3', etc.");
        }
      }}),
      range: new fields.StringField({ initial: "Touch" }),
      uses: new fields.SchemaField({
        current: new fields.NumberField({ initial: 1 }),
        max: new fields.NumberField({ initial: 1 })
      })
    }
  }
}

// Large Item Data
export class LargeItemData extends CommonItemData { static defineSchema() { const commonData = super.defineSchema(); return { ...commonData } } }

// Reward Data
export class RewardData extends CommonItemData { static defineSchema() { const commonData = super.defineSchema(); return { ...commonData } } }

// Advancement Data
export class AdvancementData extends CommonItemData { static defineSchema() { const commonData = super.defineSchema(); return { ...commonData } } }

// Flora Data
export class FloraData extends CommonItemData { static defineSchema() { const commonData = super.defineSchema(); return { ...commonData } } }

// Flaw Data
export class FlawData extends CommonItemData { static defineSchema() { const commonData = super.defineSchema(); return { ...commonData } } }

// Ability Data
export class AbilityData extends CommonItemData { static defineSchema() { const commonData = super.defineSchema(); return { ...commonData } } }

// Companion Data
export class CompanionItemData extends CommonItemData { static defineSchema() { const commonData = super.defineSchema(); return { ...commonData } } }