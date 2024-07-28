// Function to update hero points based on items
export function updateAttrition(actor) {
    if (actor.type === 'character') {
      const items = actor.items;
      let totalFleshAttrition = 0;
      let totalEquipAttrition = 0;
      let fleshAttrition = 0;
      let equipAttrition = 0;
  
      items.forEach(item => {
        if (item.type === "equipment") {
            if (item.system.damaged) {
                totalEquipAttrition ++;
            } else {
                totalEquipAttrition ++;
                equipAttrition ++;
            }
        } else if (item.type === "skill") {
            if (item.system.damaged) {
                totalFleshAttrition ++;
            } else {
                totalFleshAttrition ++;
                fleshAttrition ++;
            }
        }
      });
  
      actor.system.attrition.flesh.max = totalFleshAttrition;
      actor.system.attrition.flesh.current = fleshAttrition;
      actor.system.attrition.equipment.max = totalEquipAttrition;
      actor.system.attrition.equipment.current = equipAttrition;
    }
  }