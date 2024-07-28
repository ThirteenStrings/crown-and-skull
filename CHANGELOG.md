# CHANGELOG

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