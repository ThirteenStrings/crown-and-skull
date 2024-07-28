/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Roll}
 */

export class CraskRoll extends Roll {
    constructor(formula, data, options) {
      super(formula, data, options);
    }
    
    static CHAT_TEMPLATE = '../templates/rolls/rollTemplate.hbs';
    // static TOOLTIP_TEMPLATE = 'path/to/my/tooltip/template.hbs';
  }