/**
 * Determines the CSS class for a battle log message based on its content
 */
export function getBattleLogClass(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Critical hits
  if (lowerMessage.includes('critical hit')) {
    return 'log-critical';
  }
  
  // Fainted/Knocked out
  if (lowerMessage.includes('fainted') || lowerMessage.includes('knocked out')) {
    return 'log-fainted';
  }
  
  // Super effective
  if (lowerMessage.includes('super effective') || lowerMessage.includes('it\'s super effective')) {
    return 'log-super-effective';
  }
  
  // Not very effective
  if (lowerMessage.includes('not very effective')) {
    return 'log-not-effective';
  }
  
  // Damage dealt
  if (lowerMessage.includes('damage') || lowerMessage.includes('hit') || lowerMessage.includes('used')) {
    return 'log-damage';
  }
  
  // Healing
  if (lowerMessage.includes('heal') || lowerMessage.includes('recover') || lowerMessage.includes('restore')) {
    return 'log-heal';
  }
  
  // Status changes
  if (lowerMessage.includes('status') || lowerMessage.includes('switched') || lowerMessage.includes('sent out')) {
    return 'log-status';
  }
  
  // Default
  return '';
}

/**
 * Formats a battle message with proper styling
 */
export interface BattleLogMessage {
  text: string;
  type: 'damage' | 'heal' | 'status' | 'critical' | 'super-effective' | 'not-effective' | 'fainted' | 'default';
  timestamp: number;
}

export function createBattleLogMessage(text: string): BattleLogMessage {
  const lowerText = text.toLowerCase();
  
  let type: BattleLogMessage['type'] = 'default';
  
  if (lowerText.includes('critical hit')) {
    type = 'critical';
  } else if (lowerText.includes('fainted') || lowerText.includes('knocked out')) {
    type = 'fainted';
  } else if (lowerText.includes('super effective')) {
    type = 'super-effective';
  } else if (lowerText.includes('not very effective')) {
    type = 'not-effective';
  } else if (lowerText.includes('damage') || lowerText.includes('hit') || lowerText.includes('used')) {
    type = 'damage';
  } else if (lowerText.includes('heal') || lowerText.includes('recover')) {
    type = 'heal';
  } else if (lowerText.includes('switched') || lowerText.includes('sent out')) {
    type = 'status';
  }
  
  return {
    text,
    type,
    timestamp: Date.now(),
  };
}
