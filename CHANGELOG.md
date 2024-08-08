# CHANGELOG

## 1.5.3

- Fixed an issue where rolls would not display correctly on ForgeVTT

## 1.5.2

- Fixed an issue where actor sheets were not displaying the correct skill target number

Thanks to Ryan for the bug report.

## 1.5.1

- Fixed flesh attrition button not working
- Fixed issue with not being able to access token editing
- Modified Skill item appearance and item sheet to be more intuitive

Thanks to Feroand for the bug reports and suggestions.

## 1.5.0

- Added option to disable automatic hero point calculations in game settings
- Added option to display all item section headers in game settings (item section headers are hidden unless at least one of that item type is present on the sheet)
- Tactic roll details are obfuscated from players
- Added a reset uses button next to item use controls on equipment and spells
- Added "Rest & Recovery" and "Take a Breather" macros in the macro compendium
- Prompt to automatically add the cost of deleted equipment and companion items to lost hero points
- Equipment, Flesh, Destroy, and Brutal Attrition functions now available as a macro in the macro compendium (Brutal and Destroy are only available as a macro, these macros will only operate on a selected character actor token)
- Destroyed items from destroy attrition will automatically add the cost of the item to lost hero points
- Added option to disable Destroy Attrition from automatically deleting items in game settings
- When players select initiative when they are already in the initiative tracker, a dialog box pops up to ask if they want to update existing initiative, push an additional combatant, or cancel
- Redesigned enemy sheet

### Known Issues
- Localization continues to suffer
- Roll All & Roll NPCs combat buttons are inoperable for GMs

### Future Plans

- Localization overhaul
- Find a way to remove Roll All & Roll NPCs combat buttons as they have no use
- Inline rolls from items say item name instead of "Generic Roll"
- Phases labeled in combat tracker
- Companion actors can sync with a player and automatically add an item entry to their owner

### Dropped Plans

- No longer planning for default scene / background
- Item Macros not useful for system, no longer worried about color changing icons

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