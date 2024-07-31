// Function to update hero points based on items
export function updateDefense(actor) {
  if (actor.type === 'character') {
    const items = actor.items;
  
    let defenseScore = 6;

    items.forEach(item => {
      if (item.system.isEquipped) {
        defenseScore += item.system.defense;
      }
    });
  
    defenseScore = Math.min(18,defenseScore);
    defenseScore = Math.max (0,defenseScore);

    actor.system.defense = defenseScore;
  }
}

  