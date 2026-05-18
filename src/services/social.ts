export interface SocialContact { id: string; name: string; phone?: string; avatar?: string; }
export interface SocialMessage { id: string; conversationId: string; content: string; from: 'customer' | 'agent' | 'ai'; timestamp: string; }
export interface SocialConversation { id: string; contact: SocialContact; lastMessage: string; lastTime: string; unread: number; aiEnabled: boolean; }

export async function getSocialData() { return []; }
export async function getConversations(): Promise<SocialConversation[]> { return []; }
export async function getMessages(_conversationId: string): Promise<SocialMessage[]> { return []; }
export async function sendAgentMessage(_conversationId: string, _content: string): Promise<void> {}
export async function markConversationRead(_conversationId: string): Promise<void> {}
export async function toggleAiEnabled(_conversationId: string, _enabled: boolean): Promise<void> {}
export function subscribeToMessages(_conversationId: string, _cb: (m: SocialMessage) => void): () => void { return () => {}; }
export function subscribeToConversations(_cb: (c: SocialConversation[]) => void): () => void { return () => {}; }
