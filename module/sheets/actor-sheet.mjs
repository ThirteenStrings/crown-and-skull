import { prepareActiveEffectCategories } from '../helpers/effects.mjs';
import { updateHeroPoints } from '../helpers/heropoints.mjs';
import { updateDefense } from '../helpers/defensecalc.mjs' ;

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
      checkboxChange: this._onCheckboxChange
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
    header: {
      template: 'systems/crown-and-skull/templates/actor/header.hbs',
    },
    tabs: {
      // Foundry-provided generic template
      template: 'templates/generic/tab-navigation.hbs',
    },
    biography: {
      template: 'systems/crown-and-skull/templates/actor/biography.hbs',
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
    pouches: {
      template: 'systems/crown-and-skull/templates/actor/pouches.hbs',
    },
    rewards: {
      template: 'systems/crown-and-skull/templates/actor/rewards.hbs',
    },
    tactics: {
      template: 'systems/crown-and-skull/templates/actor/tactics.hbs',
    }
  };

  /** @override */
  _configureRenderOptions(options) {
    super._configureRenderOptions(options);
    // Not all parts always render
    options.parts = ['header', 'tabs', 'biography'];
    // Don't show the other tabs if only limited view
    if (this.document.limited) return;
    // Control which parts show based on document subtype
    switch (this.document.type) {
      case 'character':
        options.parts.push('equipment', 'skills', 'magic', 'pouches', 'rewards');
        break;
      case 'enemy':
        options.parts.push('tactics');
        break;
      case 'companion':
        options.parts.push('skills')
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
      case 'pouches':
      case 'rewards':
      case 'header':
        context.tab = context.tabs[partId];
        //Enrich tactics info for display
        context.enrichedKnown = await TextEditor.enrichHTML(
          this.actor.system.known,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            //Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        context.tab = context.tabs[partId];
        //Enrich tactics info for display
        context.enrichedQuest = await TextEditor.enrichHTML(
          this.actor.system.quest,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            //Relative UUID resolution
            relativeTo: this.actor,
          }
        );
      case 'tactics':
        context.tab = context.tabs[partId];
        //Enrich tactics info for display
        context.enrichedTactic1 = await TextEditor.enrichHTML(
          this.actor.system.tactic1,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            //Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        context.enrichedTactic25 = await TextEditor.enrichHTML(
          this.actor.system.tactic25,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            //Relative UUID resolution
            relativeTo: this.actor,
          }
        );
        context.enrichedTactic6 = await TextEditor.enrichHTML(
          this.actor.system.tactic6,
          {
            // Whether to show secret blocks in the finished html
            secrets: this.document.isOwner,
            // Data to fill in for inline rolls
            rollData: this.actor.getRollData(),
            //Relative UUID resolution
            relativeTo: this.actor,
          }
        );
      case 'biography':
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
    if (!this.tabGroups[tabGroup]) this.tabGroups[tabGroup] = 'biography';
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
        case 'biography':
          tab.id = 'biography';
          tab.label += 'Biography';
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
        case 'pouches':
          tab.id = 'pouches';
          tab.label += 'Pouches';
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
    const smallitems = [];
    const largeitems = [];
    const skills = [];
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

    // Integrate hero points preparation
    updateHeroPoints(this.actor);
    updateDefense(this.actor);
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
    const doc = this._getEmbeddedDocument(target);
    doc.sheet.render(true);
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
    const doc = this._getEmbeddedDocument(target);
    await doc.delete();
  }

  /**
   * Handles checkbox changes
   *
   * @this CraskActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @protected
   */
  static async _onCheckboxChange(event, target) {
    const phaseNumber = target.name; // e.g., "one", "two", etc.
    const phaseState = target.checked;

    // Update the actor's phase state
    const updateData = {};
    updateData[`system.phase.${phaseNumber}`] = phaseState;
    await this.actor.update(updateData);
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

      if (actor.system.heroCoinAvailable) {

        let r = await new Roll("dc").evaluate();
        game.dice3d.showForRoll(r, game.user, true);

        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `${actor.name} uses their Hero Coin!`,
          type: CONST.CHAT_MESSAGE_STYLES.OTHER
        });

        // Save the new state to the actor's data
        await actor.update({ 'system.heroCoinAvailable': false });
      } else {

        await ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor }),
          content: `${actor.name} gains a Hero Coin!`,
          type: CONST.CHAT_MESSAGE_STYLES.OTHER
        });

        await actor.update({ 'system.heroCoinAvailable': true });
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
