export async function getChannels() { return []; }

export interface ChannelIntegration { id: string; channel: string; status: 'connected' | 'disconnected'; }
export async function getAllIntegrations(): Promise<ChannelIntegration[]> { return []; }
export async function disconnectChannel(_id: string): Promise<void> {}
