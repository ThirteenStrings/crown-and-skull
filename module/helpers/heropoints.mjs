// Function to update hero points based on items
export function updateHeroPoints(actor) {
  if (game.settings.get('crown-and-skull','autoCalc')) {
    if (actor.type === 'character') {
      const items = actor.items;
  
      let spentHeroPoints = 0;
      let maxHeroPoints = game.settings.get('crown-and-skull','defaultMaxHeropoints') + actor.system.heropoints.offset;
    
      items.forEach(item => {
        if (item.type === 'reward') {
          maxHeroPoints += item.system.cost;
        } else if (item.type === 'flaw') {
          maxHeroPoints += 5;
        } else if (item.type === 'ability') {
          spentHeroPoints += 15;
        } else if (item.system.cost) {
          spentHeroPoints += item.system.cost;
        }
      });
    
      actor.system.heropoints.spent = spentHeroPoints;
      actor.system.heropoints.max = maxHeroPoints;
      actor.system.heropoints.remaining = maxHeroPoints - spentHeroPoints - actor.system.heropoints.lost;
    }
  }
}

  