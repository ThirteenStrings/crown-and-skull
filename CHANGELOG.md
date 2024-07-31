# CHANGELOG

## 1.4.0

<b>Please be aware that this version can break characters and items from past versions. The switch to Data Model changed some of the underlying item structures and they may no longer be compatible. Backup your world. It may be bricked by this update.</b>

- Changed to Data Model architecture instead of template.json, this will hopefully future-proof the system
- Cleaned up header, more consistent layout
- Added temporary defense modifiers to the header for spell bonuses and other ongoing effects
- Small Item type removed
- Pouch and Herbalist Pouch inventory only available if actor owns Pouch or Herbalist Pouch
- If a Pouch is owned, items will now have a button to transfer them to the Pouch
- Items in the Pouch will have a button to remove them from the Pouch
- If a Pouch is deleted, all contained items will be ejected into the main inventory
- Equipment items now have a "Multi Attrition" checkbox in the item sheet. If Equipment attrition selects these items, it will lower the uses by one instead of damaging the item.
- Items in Pouch now have a cleaned up design

### Known Issues

- Localization has suffered during this update
- Roll All & Roll NPCs combat buttons are inoperable for GMs
- Selecting a phase will push a combatant whether or not one already exists

### Future Plans

- Change the default images and backgrounds
- Default scene
- Clean up phase selection process to check for existing combatants
- Tactics roll option for GM only roll
- Brutal attrition macro
- Destroy attrition macro
- Inline rolls from items say item name instead of "Generic Roll"
- Reset button for uses if uses are more than 2
- Rest & Recovery rolls
- Phases labeled in combat tracker
- Creating an item macro by drag-dropping will have a white icon svg in the macro bar
- Companion actors can sync with a player and automatically add an item entry to their owner
- Create a prompt to automatically add the cost of deleted items to the "Lost Hero Points" tracker

## 1.3.0

- Roll templates have been added
- Automated rolls for attrition, skills, defense, damage, effect, and duration
- Skill and defense can be "quick rolled" without a situational modifier by ctrl+clicking
- Attrition section at top with automated random attrition
- Cleaned up some item borders
- Cleaned up some item layouts to be more consistent
- Overall visual style cleanup
- Fixed error where hero-coin would not work if Dice So Nice was not active
- Ctrl-click on item images to post to chat
- Alt-click on item images to whisper-self in chat
- Fixed url-error for .zip file (hopefully)
- Added item-deletion confirmation, ctrl+click to skip confirmation

### Known Issues

- Shields will be damaged instead of using up a use. Players will need to undamage the item and reduce the number of uses
- Roll All & Roll NPCs combat buttons are inoperable for GMs
- Selecting a phase will push a combatant whether or not one already exists

### Future Plans

- Change the default images and backgrounds
- Default scene
- Rework small items and pouches
- Rework shields and armor with multiple hits
- Clean up phase selection process to check for existing combatants
- Tactics roll option for GM only roll
- Switch to Data Model
- Brutal attrition macro
- Destroy attrition macro
- Inline rolls from items say item name instead of "Generic Roll"
- Reset button for uses if uses are more than 2
- Rest & Recovery rolls
- Phases labeled in combat tracker
- Creating an item macro by drag-dropping will have a white icon svg in the macro bar

## 1.2.2

- Fixed enemy background and button issues

## 1.2.0

- Major sheet layout changes
- Clean up HTML and code
- Phase tracker -more- functional
- Initiative now counts from low to high
- Fixed dark mode text color issues
- Pouches and item sections only appear when an item is added under that category
- Enemy tactics button

### Known Issues

- Cannot use "Roll All" and "Roll NPCs" initiative buttons in combat
- Pushing enemy combatants multiple times does not delete existing combatants for that actor

### Future Plans
- Splash introduction to explain sheet usage
- Improved phase selection process
- Tactics button for GM only output
- Better roll outputs

## 1.1.0

- Visual Style Change
- Cleaned up HTML
- Light Mode and Dark Mode currently have same style
- Can currently run a game with the current setup

### Known Issues
- Phase tracker is not currently functional. Clicking a box will set initiative but multiple phases are not supported
- Spell timer buttons output description instead of rolling
- Inline rolls in descriptions do not indicate where the roll is from

### Future Plans
- Functional phase tracker
- Better roll outputs

## 1.0.0

- Minimum viable product for system.

Todo:

- Create functional combat tracker for the phase system.
- Refactor code.
- Clean up HTML.
- More localization.
- Light mode compatibility.