// Function to update hero points based on items
export function updateAttrition(actor) {
    if (actor.type === 'character') {
      const items = actor.items;
      let fleshAttrition = 0;
      let equipAttrition = 0;
  
      items.forEach(item => {
        if (item.type === "equipment") {
            if (!item.system.isDamaged && !item.system.isInPouch) {
                equipAttrition ++;
            }
        } else if (item.type === "skill") {
            if (!item.system.isDamaged) {
                fleshAttrition ++;
            }
        }
      });
  
      let updateData = {};
      updateData['system.attrition.flesh'] = fleshAttrition;
      updateData['system.attrition.equipment'] = equipAttrition;

      actor.update(updateData)

    }
  }