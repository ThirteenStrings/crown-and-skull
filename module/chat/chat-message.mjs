import { postRollMessage } from "./chat-roll.mjs"

export class CraskRollMessage extends ChatMessage {
    static async create(messageData, messageOptions) {
      
        if (messageData.rolls) {
          messageData.flavor = "Generic Roll";
        } else {
          messageData.flavor = "Chat Message";
        }
        
      return super.create(messageData, messageOptions);
    }
  }
  
  Roll.prototype.render = async function ({ flavor, template = this.constructor.CHAT_TEMPLATE, isPrivate = false } = {}) {
    if (!this._evaluated) await this.evaluate({ async: true });
    const chatData = {
      formula: isPrivate ? '???' : this._formula,
      flavor: isPrivate ? null : flavor,
      user: game.user.id,
      total: isPrivate ? '?' : Math.round(this.total * 100) / 100,
      roll: this,
    };
    return renderTemplate(template, chatData);
  };