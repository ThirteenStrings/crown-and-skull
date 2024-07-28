import { prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { updateHeroPoints } from '../helpers/heropoints.mjs';
import { updateDefense } from '../helpers/defensecalc.mjs' ;
import { updateAttrition } from '../helpers/attritioncalc.mjs'

const { api, sheets } = foundry.applications;

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheetV2}
 */

export class CraskActorSheet extends api.HandlebarsApplicationMixin(
  sheets.ActorSheetV2
) {
  constructor(options = {}) {
    super(options);
    this.#dragDrop = this.#createDragDropHandlers();
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ['crask', 'actor'],
    position: {
      width: 650,
    },
    actions: {
      viewDoc: this._viewDoc,
      createDoc: this._createDoc,
      deleteDoc: this._deleteDoc,
      toggleEffect: this._toggleEffect,
      roll: this._onRoll,
      dmgToggle: this._dmgToggle,
      updateUses: this._updateUses,
      equipToggle: this._equipToggle,
      editImage: this._editImage,
      useHeroCoin: this._useHeroCoin,
      initiativeSelect: this._initiativeSelect,
      initiativePush: this._initiativePush,
      rollTactic: this._rollTactic,
      rollEquipmentAttrition: this._rollEquipmentAttrition,
      rollFleshAttrition: this._rollFleshAttrition,
      damageRoll: this._damageRoll,
      skillRoll: this._skillRoll,
    },
    // Custom property that's merged into `this.options`
    dragDrop: [{ dragSelector: '[data-drag]', dropSelector: null }],
    form: {
      handler: this.#onSubmitActorForm,
      submitOnChange: true,
    },
  };

  /** @override */
  static PARTS = {
    tabs: {
      // Foundry-provided generic template
      template: 'templates/generic/tab-navigation.hbs',
    },
    header: {
      template: 'systems/crown-and-skull/templates/actor/header.hbs',
    },
    character: {
      template: 'systems/crown-and-skull/templates/actor/character.hbs',
    },
    equipment: {
      template: 'systems/crown-and-skull/templates/actor/equipment.hbs'
    },
    skills: {
      template: 'systems/crown-and-skull/templates/actor/skills.hbs'
    },
    magic: {
      template: 'systems/crown-and-skull/templates/actor/magic.hbs',
    },
    enemy: {
      template: 'systems/crown-and-skull/templates/actor/enemy.hbs',
    },
    companion: {
      template: 'systems/crown-and-skull/templates/actor/companion.hbs',
    },
    npc: {
      template: 'systems/crown-and-skull/templates/actor/npc.hbs',
    }
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = [];
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
    // Control which parts show based on document subtype
    switch (this.document.type) {
      case 'character':
        options.parts.push('header','tabs','character','equipment', 'skills', 'magic');
        break;
      case 'enemy':
        options.parts.push('enemy');
        break;
      case 'companion':
        options.parts.push('companion');
        break;
      case 'npc':
        options.parts.push('npc');
        break;
    }
  }

  /* -------------------------------------------- */

  /** @override */
  async _prepareContext(options) {
    // Output initialization
    const context = {
      // Validates both permissions and compendium status
      editable: this.isEditable,
      actor: this.actor,
      // Add the actor's data to context.data for easier access, as well as flags.
      system: this.actor.system,
      flags: this.actor.flags,
      // Adding a pointer to CONFIG.CRASK
      config: CONFIG.CRASK,
      tabs: this._getTabs(options.parts),
    };

    // Offloading context prep to a helper function
    this._prepareItems(context);

    // Iterate through items, enriching text descriptions
    for (let i of this.document.items) {
      // Enrich description info for display
      // Enrichment turns text like `[[/r 1d20]]` into buttons
      i.system.enrichedDescription = await TextEditor.enrichHTML(
        i.system.description,
        {
          // Data to fill in for inline rolls
          rollData: i.getRollData(),
        }
      );
    }

    return context;
  }

  /** @override */
  async _preparePartContext(partId, context) {
    switch (partId) {
      case 'equipment':
      case 'skills':
      case 'magic':
      case 'header':
        context.tab = context.tabs[partId];
      case 'character':
        context.tab = context.tabs[partId];
        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await TextEditor.enrichHTML(
          this.actor.system.biography,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            // Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        break;
      case 'enemy':
        context.tab = context.tabs[partId];
        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await TextEditor.enrichHTML(
          this.actor.system.biography,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            // Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        break;
      case 'companion':
        context.tab = context.tabs[partId];
        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await TextEditor.enrichHTML(
          this.actor.system.biography,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            // Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        break;
        case 'npc':
        context.tab = context.tabs[partId];
        // Enrich biography info for display
        // Enrichment turns text like `[[/r 1d20]]` into buttons
        context.enrichedBiography = await TextEditor.enrichHTML(
          this.actor.system.biography,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            // Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        break;
    }
    return context;
  }

  /**
   * Generates the data for the generic tab navigation template
   * @param {string[]} parts An array of named template parts to render
   * @returns {Record<string, Partial<ApplicationTab>>}
   * @protected
   */
  _getTabs(parts) {
    // If you have sub-tabs this is necessary to change
    const tabGroup = 'primary';
    // Default tab for first time it's rendered this session
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'character';
    return parts.reduce((tabs, partId) => {
      const tab = {
        cssClass: '',
        group: tabGroup,
        // Matches tab property to
        id: '',
        // FontAwesome Icon, if you so choose
        icon: '',
        // Run through localization
        label: 'CRASK.Actor.Tabs.',
      };
      switch (partId) {
        case 'header':
        case 'tabs':
          return tabs;
        case 'character':
          tab.id = 'character';
          tab.label += 'Character';
          break;
        case 'equipment':
          tab.id = 'equipment';
          tab.label += 'Equipment';
          break;
        case 'skills':
          tab.id = 'skills';
          tab.label += 'Skills';
          break;
        case 'magic':
          tab.id = 'magic';
          tab.label += 'Magic';
          break;        
        case 'rewards':
          tab.id = 'rewards';
          tab.label += 'Rewards';
          break;
        case 'tactics':
          tab.id = 'tactics';
          tab.label += 'Tactics';
          break
      }
      if (this.tabGroups[tabGroup] === tab.id) tab.cssClass = 'active';
      tabs[partId] = tab;
      return tabs;
    }, {});
  }

  /**
   * Organize and classify Items for Actor sheets.
   *
   * @param {object} context The context object to mutate
   */
  _prepareItems(context) {
    // Initialize containers.
    const equipment = [];
    const undamagedEquipment = [];
    const damagedEquipment = [];
    const smallitems = [];
    const largeitems = [];
    const skills = [];
    const undamagedSkills = [];
    const damagedSkills = [];
    const spells = [];
    const alchemical = [];
    const rewards = [];
    const advancements = [];
    const flora = [];
    const flaws = [];
    const abilities = [];
    const companions = [];

    // Iterate through items, allocating to containers
    for (let i of this.document.items) {

      // Append to equipment.
      if (i.type === 'equipment') {
        equipment.push(i);
        if (i.damaged) {
          damagedEquipment.push(i);
        } else {
          undamagedEquipment.push(i);
        }
      }
      // Append to small items.
      else if (i.type === 'smallitem') {
        smallitems.push(i);
      }
      // Append to large items.
      else if (i.type ==='largeitem') {
        largeitems.push(i);
      }
      // Append to skills.
      else if (i.type === 'skill') {
        skills.push(i);
        if (i.damaged) {
          damagedSkills.push(i);
        } else {
          undamagedSkills.push(i);
        }
      }
      // Append to spells.
      else if (i.type === 'spell') {
        spells.push(i);
      }
      // Append to alchemical.
      if (i.type === 'alchemical') {
        alchemical.push(i);
      }
      // Append to rewards.
      if (i.type === 'reward') {
        rewards.push(i);
      }
      // Append to advancements
      if (i.type === 'advancement') {
        advancements.push(i);
      }
      // Append to flora.
      if (i.type === 'flora') {
        flora.push(i);
      }
      // Append to flaws.
      if (i.type === 'flaw') {
        flaws.push(i);
      }
      // Append to abilities.
      if (i.type === 'ability') {
        abilities.push(i);
      }
      // Append to companions.
      if (i.type === 'companion') {
        companions.push(i);
      }
    }

    // Sort then assign
    context.equipment = equipment.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.smallitems = smallitems.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.largeitems = largeitems.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.skills = skills.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.spells = spells.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.alchemical = alchemical.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.rewards = rewards.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.advancements = advancements.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.flora = flora.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.flaws = flaws.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.abilities = abilities.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.companions = companions.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.undamagedEquipment = undamagedEquipment.sort((a, b) => (a.sort || 0) - (b.sort || 0));
    context.undamagedSkills = undamagedSkills.sort((a, b) => (a.sort || 0) - (b.sort || 0));

    // Integrate hero points preparation
    updateHeroPoints(this.actor);
    updateDefense(this.actor);
    updateAttrition(this.actor);
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data
   * @param {RenderOptions} options                 Provided render options
   * @protected
   */
  _onRender(context, options) {
    this.#dragDrop.forEach((d) => d.bind(this.element));
    this.#disableOverrides();
    // You may want to add other special handling here
    // Foundry comes with a large number of utility classes, e.g. SearchFilter
    // That you may want to implement yourself.
  }
 
  /**************
   *
   *   ACTIONS
   *
   **************/

  /**
   * Renders an embedded document's sheet
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _viewDoc(event, target) {

    if (event.ctrlKey || event.altKey) {
      const item = this._getEmbeddedDocument(target);
      const whisperTarget = event.altKey ? [game.user.id] : null;
      // Send the item to the chat
      console.log(this.actor.user);
      let flavorText = "❖ " + item.type.charAt(0).toUpperCase() + item.type.slice(1) + " ❖ " + item.name + " ❖";
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor: this.actor.id}),
        flavor: flavorText,//flavorText,
        content: item.system.enrichedDescription,//messageContent,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER,
        whisper: whisperTarget
      });
    } else {
      // Open the item sheet
      const doc = this._getEmbeddedDocument(target);
      doc.sheet.render(true);
    }
    
  }

  /**
   * Handles item deletion
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _deleteDoc(event, target) {

    if(event.ctrlKey) {
      const doc = this._getEmbeddedDocument(target);
      await doc.delete();
    } else {
      Dialog.confirm({
        title: "Delete Confirmation",
        content: "Are you sure you want to delete this item? \n",
        yes: (Yes) => { 
          const doc = this._getEmbeddedDocument(target);
          doc.delete();
         },
        no: (No) => { 
          
         },
      })
    }
    
      

  }

  /**
   * Handles checkbox changes
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _initiativeSelect(event, target) {
    
    if ( !game.combat ) {
			ui.notifications.warn("COMBAT.NoneActive", {localize: true});
			return null;
		} else {
      // Initiative Selection Dialog
      const initiativeDialogContent = await renderTemplate('./systems/crown-and-skull/templates/dialog/playerInitiativeDialog.hbs')
      const selectedInitiative = await foundry.applications.api.DialogV2.prompt({
        window: { title: "Combat Phase Selection" },
        content: initiativeDialogContent,
        ok: {
          label: "Confirm",
          callback: (event,button) => {
            let to_create = [{actorId: this.actor.id, initiative: button.form.elements.phase.value}];
            game.combat.createEmbeddedDocuments('Combatant', to_create);
            //this.actor.rollInitiative({createCombatants: true, rerollInitiative: true, initiativeOptions: {formula: button.form.elements.phase.value}});

            let flavorText = "Pushed to phase " + button.form.elements.phase.value + "!";
            let messageContent = this.actor.name + " has selected phase " + button.form.elements.phase.value + " for this combat."

            // Send the message to the chat
            ChatMessage.create({
              speaker: ChatMessage.getSpeaker({actor: this.actor}),
              flavor: flavorText,
              content: messageContent,
              type: CONST.CHAT_MESSAGE_STYLES.OTHER
            });
          }
        },
        rejectClose: false
      });
    }
  }

  /**
   * Handles pushing enemy combatants to combat tracker
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _initiativePush(event, target) {
    let actorTokens = this.actor.getActiveTokens()
    let phases = this.actor.system.phases.filter(p => p);
    let to_create = phases.map(phase => ({actorId: this.actor.id, initiative: phase, tokenId: actorTokens.id}));

    if ( !game.combat ) {
			ui.notifications.warn("COMBAT.NoneActive", {localize: true});
			return null;
		} else {
      await game.combat.createEmbeddedDocuments('Combatant', to_create);
    }
    
    let flavorText = 'Pushed to combat tracker!';
    let messageContent = this.actor.name + ' has selected ';

    if (phases.length > 1) {
      // Join all but the last phase with commas, and append the last one with "and"
      messageContent += "phases " + phases.slice(0, -1).join(", ") + " and " + phases[phases.length - 1];
    } else if (phases.length === 1) {
      // Handle the case with only one phase
      messageContent += "phase " + phases[0];
    } else {
      // Handle the case with no phases
      messageContent += "no phases";
    }

    messageContent += ' for this combat.'
    
    // Send the message to the chat
    ChatMessage.create({
        speaker: ChatMessage.getSpeaker({actor: this.actor}),
        flavor: flavorText,
        content: messageContent,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
    });
  }

  /**
   * Handles enemy tactic roll
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
    static async _rollTactic(event, target) {
      // Roll 1d6
      let roll = await new Roll("1d6").evaluate();
      
      if (game.modules.get('dice-so-nice')?.active) {
        await game.dice3d.showForRoll(roll, game.user, true);
      }

      // Determine the output message based on the roll result
      let result = roll.total;
      let messageContent = '';

      if (result === 1) {
          messageContent = `<p>${this.actor.system.tactic1}</p>`;
      } else if (result >= 2 && result <= 5) {
          messageContent = `<p>${this.actor.system.tactic25}</p>`;
      } else if (result === 6) {
          messageContent = `<p>${this.actor.system.tactic6}</p>`;
      }

      // Send the message to the chat
      if (messageContent) {
          ChatMessage.create({
              speaker: ChatMessage.getSpeaker({actor: this.actor}),
              flavor: `Tactic Roll Result: ${roll.total}`,
              content: messageContent,
              type: CONST.CHAT_MESSAGE_STYLES.OTHER
          });
      }

    }

  /**
   * Handles item damage rolls
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
    static async _damageRoll(event, target) {
      // Get the item
      const item = this._getEmbeddedDocument(target);
      let dieCount = 0;
      let gridCount = 0;
      let constant = 0;
      let rollType = event.target.dataset.rollType;
      let rollString = '';

      if (rollType == "Damage" || rollType == "Effect") {
        rollString = item.system.dmg;
      } else if (rollType == "Duration") {
        rollString = item.system.duration;
      }

      // Validate roll string
      if (!Roll.validate(rollString)) {
        ui.notifications.warn('Roll string is invalid!');
        return;
      }

      let roll = await new Roll(rollString).evaluate();
      
      // Roll Dice if DSN Present
      if (game.modules.get('dice-so-nice')?.active) {
        await game.dice3d.showForRoll(roll, game.user, true);
      }

      // Extract results and create message content
      let messageContent = ``;

      // Extract Numeric Terms
      for (let i = 0; i < roll.terms.length; i++) {
        const term = roll.terms[i];
        if (term.constructor.name === "NumericTerm") {
          if (i>0 && roll.terms[i-1].operator === "-") {
            constant -= term.number;
          } else {
              constant += term.number;
          }
        }
      }
      
      // For each die rolled, create a die picture with the number on top of it.
      for (const dieRoll of roll.dice) {
        let dieType = 'D' + dieRoll.faces;
        for (const dieResult of dieRoll.results) {
          dieCount ++;
          gridCount = Math.min(dieCount, 4);
          messageContent += `<div class="die-container">
                                <img src="./systems/crown-and-skull/assets/icons/Black/${dieType}.svg" class="die-img">
                                <span class="die-result">
                                  ${dieResult.result}
                                </span>
                            </div>`;
        }
      }

      // Add numeric result div if needed
      if (constant != 0) {
        dieCount ++;
        gridCount = Math.min(dieCount, 4);
        constant = `${constant >= 0 ? '+' : ''}${constant}`;
        messageContent += `<div class="die-container">
                                <span class="constant-result">
                                  ${constant}
                                </span>
                            </div>`;
      }

      // Check: if only one element eliminate grid class, add classes to opening div
      if (gridCount > 1 ) {
        messageContent = `<div class="grid grid-${gridCount}col flexrow roll-container">` + messageContent;
      } else {
        messageContent = `<div class="flexrow roll-container">` + messageContent;
      }

      // Finish div
      messageContent += `</div>`;

      // Determine flavor text
      let flavorText = item.name + ' ❖ ' + rollType + ' Roll '

      if (dieCount > 1) {
        flavorText += '<br>' + rollString + ' <span style="color: red;">>></span> Total: <span style="color: darkred; text-shadow: 0px 0px 3px white">' + roll.total + '</span>';
      } else {
        flavorText += '❖ ' + rollString;
      }
        

      // Send the message to the chat
      if (messageContent) {
          ChatMessage.create({
              speaker: ChatMessage.getSpeaker({actor: this.actor}),
              flavor: flavorText,
              content: messageContent,
              type: CONST.CHAT_MESSAGE_STYLES.OTHER
          });
      }
    }

  /**
   * Handles skill rolls
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _skillRoll(event, target) {

    let item;
    const rollType = event.target.dataset.rollType;

    // Determine target number
    let targetNumber;

    if (rollType === "Defense") {
      targetNumber = this.actor.system.defense.value;
    } else{
      item = this._getEmbeddedDocument(target);
      targetNumber = item.system.cost + item.system.modifier;
    }
    
    // Dialog popup
    let situationalModifier;
    let dialogTitle = rollType + " Roll Modifier"
    
    if (event.ctrlKey) {
      situationalModifier = 0;
    } else {
      situationalModifier = await foundry.applications.api.DialogV2.wait({
        window: {
          title: dialogTitle,
          modal: true
        },
        content: `
          <form>
            <div style="margin-bottom: 10px; display: inline;">
              <label for="penalty">Situational Modifier:</label>
              <input type="number" name="penalty" value="0" style="max-width: 50px;">
            </div>
          </form>
        `,
        buttons: [
          {
            label: "Confirm",
            callback: (event, button, dialog) => button.form.elements.penalty.value
          }
        ],
        rejectClose: false
      });
    }
    
    if (situationalModifier === null) {
      ui.notifications.warn("Roll Cancelled");
      return;
    }

    let roll = await new Roll('1d20').evaluate();
    
    // Roll Dice if DSN Present
    if (game.modules.get('dice-so-nice')?.active) {
      await game.dice3d.showForRoll(roll, game.user, true);
    }

    const success = +roll.result <= targetNumber + +situationalModifier ? true : false;
    const comparator = success ? '≤' : '>'

    // Extract results and create message content
    let messageContent = `<div class="flexrow roll-container">
                            <div class="flexcol">
                              <label class="skill-roll-label">Roll</label>
                              <div class="die-container skill-output">
                                <img src="./systems/crown-and-skull/assets/icons/Black/d20.svg" class="die-img">
                                <span class="die-result">
                                  ${roll.result}
                                </span>
                              </div>
                            </div>
                            <div class="skill-roll-between">${comparator}</div>
                            <div class="flexcol">
                              <label class="skill-roll-label">Target</label>
                              <div class="skill-constant skill-output">
                                ${targetNumber}
                              </div>
                            </div>`

    if (situationalModifier > 0) {
      messageContent += `<div class="skill-roll-between">+</div>
                          <div class="flexcol">
                            <label class="skill-roll-label">Bonus</label>
                            <div class="skill-constant skill-output" style="background-color: rgba(0,100,0,0.2)">
                              ${situationalModifier}
                            </div>
                          </div>`
    } else if (situationalModifier < 0) {
      messageContent += `<div class="skill-roll-between">+</div>
                          <div class="flexcol">
                            <label class="skill-roll-label">Penalty</label>
                            <div class="skill-constant skill-output" style="background-color: rgba(100,0,0,0.2)">
                              ${situationalModifier}
                            </div>
                          </div>`
    }
    
    messageContent += `</div>`;

    // Flavor text
    let flavorText = '';
    if (rollType === "Defense") {
      flavorText = 'Defense Check ❖ ';
    } else {
      flavorText = item.name + ' ❖ ' + rollType + ' Check<br>';
    }

    if (roll.result == 1) {
      flavorText += '<span style="color: green">CRITICAL SUCCESS</span>'
    } else if (roll.result == 20) {
      flavorText += '<span style="color: red">CRITICAL FAILURE</span>'
    } else if (success) {
      flavorText += '<span style="color: green">CHECK SUCCESSFUL</span>'
    } else {
      flavorText += '<span style="color: red">CHECK FAILED</span>'
    }
    
    // Send the message to the chat
    if (messageContent) {
        ChatMessage.create({
            speaker: ChatMessage.getSpeaker({actor: this.actor}),
            flavor: flavorText,
            content: messageContent,
            type: CONST.CHAT_MESSAGE_STYLES.OTHER
        });
    }
  }

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _createDoc(event, target) {
    // Retrieve the configured document class for Item or ActiveEffect
    const docCls = getDocumentClass(target.dataset.documentClass);
    // Prepare the document creation data by initializing it a default name.
    const docData = {
      name: docCls.defaultName({
        // defaultName handles an undefined type gracefully
        type: target.dataset.type,
        parent: this.actor,
      }),
    };
    // Loop through the dataset and add it to our docData
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      // These data attributes are reserved for the action handling
      if (['action', 'documentClass'].includes(dataKey)) continue;
      // Nested properties require dot notation in the HTML, e.g. anything with `system`
      // An example exists in spells.hbs, with `data-system.spell-level`
      // which turns into the dataKey 'system.spellLevel'
      foundry.utils.setProperty(docData, dataKey, value);
    }

    // Finally, create the embedded document!
    await docCls.create(docData, { parent: this.actor });
  }

  /**
   * Determines effect parent to pass to helper
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _toggleEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    await effect.update({ disabled: !effect.disabled });
  }

  /**
   * Handle clickable rolls.
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _onRoll(event, target) {
    event.preventDefault();
    const dataset = target.dataset;

    // Handle item rolls.
    switch (dataset.rollType) {
      case 'item':
        const item = this._getEmbeddedDocument(target);
        if (item) return item.roll();
    }

    // Handle rolls that supply the formula directly.
    if (dataset.roll) {
      let label = dataset.label ? `[ability] ${dataset.label}` : '';
      let roll = new Roll(dataset.roll, this.actor.getRollData());
      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        rollMode: game.settings.get('core', 'rollMode'),
      });
      return roll;
    }
  }

  /**
   * Handle equipment equipped/damaged toggle.
   * 
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _dmgToggle(event, target) {
    event.preventDefault();
    const itemId = target.closest('.item').dataset.itemId;

    const item = this.actor.items.get(itemId);
    if (!item) return;
    let updateData = {};

    // Cycle through the states: Equipped -> Not Equipped -> Damaged
    if (item.system.damaged) {
      updateData['system.damaged'] = false;
    } else {
      updateData['system.damaged'] = true;
      updateData['system.equipped'] = false;
    }

    await item.update(updateData);
    updateAttrition(this.actor);
  }

  /**
   * On-click image editing.
   *
   * @this BoilerplateActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _editImage(event, target) {
    const attr = target.dataset.edit;
            const documentData = this.document.toObject();
            const current = foundry.utils.getProperty(documentData, attr);
            const { img } = this.document.constructor.getDefaultArtwork?.(documentData) ?? {};
            const fp = new FilePicker({
                current,
                type: "image",
                redirectToRoot: img ? [img] : [],
                callback: (path) => {
                    this.document.update({ [attr]: path });
                },
                top: this.position.top + 40,
                left: this.position.left + 10,
            });
            return fp.browse();
  }  

  /**
   * Handle Increase and Decrease of Item Uses
   * 
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _updateUses(event, target) {
    event.preventDefault();
    const itemId = target.closest('.item').dataset.itemId;

    const item = this.actor.items.get(itemId);
    if (!item) return;
    
    let currentUses = item.system.uses.current;
    let maxUses = item.system.uses.max;

    if (event.ctrlKey) {
      currentUses = Math.min(currentUses+1,maxUses);
    } else {
      currentUses = Math.max(currentUses-1,0);
    }

    await item.update({'system.uses.current': currentUses});
  }

  /**
   * Handle Toggle between Equipped and Unequipped
   * 
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
    static async _equipToggle(event, target) {
      event.preventDefault();
      const itemId = target.closest('.item').dataset.itemId;
  
      const item = this.actor.items.get(itemId);
      if (!item) return;
      let updateData = {};
  
      // Cycle through the states: Equipped -> Not Equipped -> Damaged
      if (item.system.equipped) {
        updateData['system.equipped'] = false;
      } else {
        updateData['system.equipped'] = true;
      }
  
      await item.update(updateData);
  
      // Update the icon and item appearance
      const icon = target.querySelector('i');
      const itemElement = target.closest('.item');
      if (updateData['system.damaged']) {
        icon.className = 'fas fa-times-circle';
        itemElement.style.color = 'red';
      } else if (updateData['system.equipped']) {
        icon.className = 'fas fa-check-circle';
        itemElement.style.color = '';
      } else {
        icon.className = 'fas fa-box';
        itemElement.style.color = '';
      }
    }

  /**
   * Use Hero Coin
   * 
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
    static async _useHeroCoin(event, target) {
      event.preventDefault();
      const element = event.currentTarget;
      const actor = this.actor;
      let messageContent = "◆ Reroll any roll entirely. ◆<br>-- or -- <br>◆ Maximize damage or effect roll. ◆"

      if (actor.system.heroCoinAvailable) {

        if (game.modules.get('dice-so-nice')?.active) {
          let r = await new Roll("dc").evaluate();
          game.dice3d.showForRoll(r, game.user, true);
        }

        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: `Hero coin used!`,
          content: messageContent,
          type: CONST.CHAT_MESSAGE_STYLES.OTHER
        });

        // Save the new state to the actor's data
        await actor.update({ 'system.heroCoinAvailable': false });
      } else {

        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: `Hero coin gained!`,
          content: messageContent,
          type: CONST.CHAT_MESSAGE_STYLES.OTHER
        });

        await actor.update({ 'system.heroCoinAvailable': true });
      }
    }

  /**
   * Roll Equipment Attrition
   * 
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _rollEquipmentAttrition(event, target) {
    const items = this.actor.items;
    let undamagedEquipment = [];
    let flavorText = '';
    let messageContent = '';

    for (const i of items) {
      if (i.type === "equipment" && i.system.damaged === false) {
        undamagedEquipment.push(i);
      }
    }

    if (undamagedEquipment.length) {
      const selectedItem = undamagedEquipment[Math.floor(Math.random()*undamagedEquipment.length)];
      selectedItem.update({"system.damaged": true});

      flavorText = 'Equipment Attrition!';
      messageContent = '<b style="color:red"><<</b> ' + selectedItem.name + ' <b style="color:red">>></b> damaged!<br><br>' + this.actor.name + ' has ';

      if (this.actor.system.attrition.equipment.current < 2) {
        messageContent += 'no Equipment remaining. The next hit will be lethal!';
      } else {
        messageContent += this.actor.system.attrition.equipment.current-1 + ' equipment remaining.';
      }

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: flavorText,
        content: messageContent,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
      });

    } else {
      flavorText = 'Hit to the heart!';
      messageContent = this.actor.name + ' will die at the end of Phase 5 without intervention!';

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: flavorText,
        content: messageContent,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
      });
    }
  }

  /**
   * Roll Flesh Attrition
   * 
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @private
   */
  static async _rollFleshAttrition(event, target) {
    const items = this.actor.items;
    let undamagedSkills = [];
    let flavorText = '';
    let messageContent = '';

    for (const i of items) {
      if (i.type === "skill" && i.system.damaged === false) {
        undamagedSkills.push(i);
      }
    }
    
    if (undamagedSkills.length) {
      const selectedItem = undamagedSkills[Math.floor(Math.random()*undamagedSkills.length)];
      selectedItem.update({"system.damaged": true});

      flavorText = 'Flesh Attrition!'
      messageContent = '<b style="color:red"><<</b> ' + selectedItem.name + ' <b style="color:red">>></b> damaged!<br><br>' + this.actor.name + ' has ';

      if (this.actor.system.attrition.flesh.current < 2) {
        messageContent += 'no Skills remaining. The next hit will be lethal!';
      } else if (this.actor.system.attrition.flesh.current < 3) {
        messageContent += this.actor.system.attrition.flesh.current-1 + ' skill remaining.';
      } else {
        messageContent += this.actor.system.attrition.flesh.current-1 + ' skills remaining.';
      }

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: flavorText,
        content: messageContent,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
      });

    } else {
      flavorText = 'Hit to the heart!'
      messageContent = this.actor.name + ' will die at the end of Phase 5 without intervention!'

      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: flavorText,
        content: messageContent,
        type: CONST.CHAT_MESSAGE_STYLES.OTHER
      });
    }
    
  }

  /** Helper Functions */

  /**
   * Fetches the embedded document representing the containing HTML element
   *
   * @param {HTMLElement} target    The element subject to search
   * @returns {Item | ActiveEffect} The embedded Item or ActiveEffect
   */
  _getEmbeddedDocument(target) {
    const docRow = target.closest('li[data-document-class]');
    if (docRow.dataset.documentClass === 'Item') {
      return this.actor.items.get(docRow.dataset.itemId);
    } else if (docRow.dataset.documentClass === 'ActiveEffect') {
      const parent =
        docRow.dataset.parentId === this.actor.id
          ? this.actor
          : this.actor.items.get(docRow?.dataset.parentId);
      return parent.effects.get(docRow?.dataset.effectId);
    } else return console.warn('Could not find document class');
  }

  /***************
   *
   * Drag and Drop
   *
   ***************/

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    // game.user fetches the current user
    return this.isEditable;
  }

  /**
   * Callback actions which occur at the beginning of a drag start workflow.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragStart(event) {
    const docRow = event.currentTarget.closest('li');
    if ('link' in event.target.dataset) return;

    // Chained operation
    let dragData = this._getEmbeddedDocument(docRow)?.toDragData();

    if (!dragData) return;

    // Set data transfer
    event.dataTransfer.setData('text/plain', JSON.stringify(dragData));
  }

  /**
   * Callback actions which occur when a dragged element is over a drop target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  _onDragOver(event) {}

  /**
   * Callback actions which occur when a dragged element is dropped on a target.
   * @param {DragEvent} event       The originating DragEvent
   * @protected
   */
  async _onDrop(event) {
    const data = TextEditor.getDragEventData(event);
    const actor = this.actor;
    const allowed = Hooks.call('dropActorSheetData', actor, this, data);
    if (allowed === false) return;

    // Handle different data types
    switch (data.type) {
      case 'ActiveEffect':
        return this._onDropActiveEffect(event, data);
      case 'Actor':
        return this._onDropActor(event, data);
      case 'Item':
        return this._onDropItem(event, data);
      case 'Folder':
        return this._onDropFolder(event, data);
    }
  }

  /**
   * Handle the dropping of ActiveEffect data onto an Actor Sheet
   * @param {DragEvent} event                  The concluding DragEvent which contains drop data
   * @param {object} data                      The data transfer extracted from the event
   * @returns {Promise<ActiveEffect|boolean>}  The created ActiveEffect object or false if it couldn't be created.
   * @protected
   */
  async _onDropActiveEffect(event, data) {
    const aeCls = getDocumentClass('ActiveEffect');
    const effect = await aeCls.fromDropData(data);
    if (!this.actor.isOwner || !effect) return false;
    if (effect.target === this.actor)
      return this._onSortActiveEffect(event, effect);
    return aeCls.create(effect, { parent: this.actor });
  }

  /**
   * Handle a drop event for an existing embedded Active Effect to sort that Active Effect relative to its siblings
   *
   * @param {DragEvent} event
   * @param {ActiveEffect} effect
   */
  async _onSortActiveEffect(event, effect) {
    /** @type {HTMLElement} */
    const dropTarget = event.target.closest('[data-effect-id]');
    if (!dropTarget) return;
    const target = this._getEmbeddedDocument(dropTarget);

    // Don't sort on yourself
    if (effect.uuid === target.uuid) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (const el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.effectId;
      const parentId = el.dataset.parentId;
      if (
        siblingId &&
        parentId &&
        (siblingId !== effect.id || parentId !== effect.parent.id)
      )
        siblings.push(this._getEmbeddedDocument(el));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(effect, {
      target,
      siblings,
    });

    // Split the updates up by parent document
    const directUpdates = [];

    const grandchildUpdateData = sortUpdates.reduce((items, u) => {
      const parentId = u.target.parent.id;
      const update = { _id: u.target.id, ...u.update };
      if (parentId === this.actor.id) {
        directUpdates.push(update);
        return items;
      }
      if (items[parentId]) items[parentId].push(update);
      else items[parentId] = [update];
      return items;
    }, {});

    // Effects-on-items updates
    for (const [itemId, updates] of Object.entries(grandchildUpdateData)) {
      await this.actor.items
        .get(itemId)
        .updateEmbeddedDocuments('ActiveEffect', updates);
    }

    // Update on the main actor
    return this.actor.updateEmbeddedDocuments('ActiveEffect', directUpdates);
  }

  /**
   * Handle dropping of an Actor data onto another Actor sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<object|boolean>}  A data object which describes the result of the drop, or false if the drop was
   *                                     not permitted.
   * @protected
   */
  async _onDropActor(event, data) {
    if (!this.actor.isOwner) return false;
  }

  /* -------------------------------------------- */

  /**
   * Handle dropping of an item reference or item data onto an Actor Sheet
   * @param {DragEvent} event            The concluding DragEvent which contains drop data
   * @param {object} data                The data transfer extracted from the event
   * @returns {Promise<Item[]|boolean>}  The created or updated Item instances, or false if the drop was not permitted.
   * @protected
   */
  async _onDropItem(event, data) {
    if (!this.actor.isOwner) return false;
    const item = await Item.implementation.fromDropData(data);

    // Handle item sorting within the same Actor
    if (this.actor.uuid === item.parent?.uuid)
      return this._onSortItem(event, item);

    // Create the owned item
    return this._onDropItemCreate(item, event);
  }

  /**
   * Handle dropping of a Folder on an Actor Sheet.
   * The core sheet currently supports dropping a Folder of Items to create all items as owned items.
   * @param {DragEvent} event     The concluding DragEvent which contains drop data
   * @param {object} data         The data transfer extracted from the event
   * @returns {Promise<Item[]>}
   * @protected
   */
  async _onDropFolder(event, data) {
    if (!this.actor.isOwner) return [];
    const folder = await Folder.implementation.fromDropData(data);
    if (folder.type !== 'Item') return [];
    const droppedItemData = await Promise.all(
      folder.contents.map(async (item) => {
        if (!(document instanceof Item)) item = await fromUuid(item.uuid);
        return item;
      })
    );
    return this._onDropItemCreate(droppedItemData, event);
  }

  /**
   * Handle the final creation of dropped Item data on the Actor.
   * This method is factored out to allow downstream classes the opportunity to override item creation behavior.
   * @param {object[]|object} itemData      The item data requested for creation
   * @param {DragEvent} event               The concluding DragEvent which provided the drop data
   * @returns {Promise<Item[]>}
   * @private
   */
  async _onDropItemCreate(itemData, event) {
    itemData = itemData instanceof Array ? itemData : [itemData];
    return this.actor.createEmbeddedDocuments('Item', itemData);
  }

  /**
   * Handle a drop event for an existing embedded Item to sort that Item relative to its siblings
   * @param {Event} event
   * @param {Item} item
   * @private
   */
  _onSortItem(event, item) {
    // Get the drag source and drop target
    const items = this.actor.items;
    const dropTarget = event.target.closest('[data-item-id]');
    if (!dropTarget) return;
    const target = items.get(dropTarget.dataset.itemId);

    // Don't sort on yourself
    if (item.id === target.id) return;

    // Identify sibling items based on adjacent HTML elements
    const siblings = [];
    for (let el of dropTarget.parentElement.children) {
      const siblingId = el.dataset.itemId;
      if (siblingId && siblingId !== item.id)
        siblings.push(items.get(el.dataset.itemId));
    }

    // Perform the sort
    const sortUpdates = SortingHelpers.performIntegerSort(item, {
      target,
      siblings,
    });
    const updateData = sortUpdates.map((u) => {
      const update = u.update;
      update._id = u.target._id;
      return update;
    });

    // Perform the update
    return this.actor.updateEmbeddedDocuments('Item', updateData);
  }

  /** The following pieces set up drag handling and are unlikely to need modification  */

  /**
   * Returns an array of DragDrop instances
   * @type {DragDrop[]}
   */
  get dragDrop() {
    return this.#dragDrop;
  }

  // This is marked as private because there's no real need
  // for subclasses or external hooks to mess with it directly
  #dragDrop;

  /**
   * Create drag-and-drop workflow handlers for this Application
   * @returns {DragDrop[]}     An array of DragDrop handlers
   * @private
   */
  #createDragDropHandlers() {
    return this.options.dragDrop.map((d) => {
      d.permissions = {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      };
      d.callbacks = {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      };
      return new DragDrop(d);
    });
  }

  /********************
   *
   * Actor Override Handling
   *
   ********************/

  /**
   * Process form submission for the sheet, removing overrides created by active effects
   * @this {CraskActorSheet}                The handler is called with the application as its bound scope
   * @param {SubmitEvent} event                   The originating form submission event
   * @param {HTMLFormElement} form                The form element that was submitted
   * @param {FormDataExtended} formData           Processed data for the submitted form
   * @returns {Promise<void>}
   */
  static async #onSubmitActorForm(event, form, formData) {
    const submitData = this._prepareSubmitData(event, form, formData);
    const overrides = foundry.utils.flattenObject(this.actor.overrides);
    for (let k of Object.keys(overrides)) delete submitData[k];
    await this.actor.update(submitData);
  }

  /**
   * Disables inputs subject to active effects
   */
  #disableOverrides() {
    const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
    for (const override of Object.keys(flatOverrides)) {
      const input = this.element.querySelector(`[name="${override}"]`);
      if (input) {
        input.disabled = true;
      }
    }
  }
}
