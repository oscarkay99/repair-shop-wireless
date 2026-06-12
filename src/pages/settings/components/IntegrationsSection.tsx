import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllIntegrations, disconnectChannel, type ChannelIntegration } from '@/services/channels';

const CHANNEL_META = {
  whatsapp: {
    name: 'WhatsApp Business',
    icon: 'ri-whatsapp-line',
    color: '#25D366',
    description: 'Receive & send DMs, broadcasts, AI auto-replies',
    scopes: 'whatsapp_business_messaging,whatsapp_business_management,business_management',
  },
  instagram: {
    name: 'Instagram',
    icon: 'ri-instagram-line',
    color: '#E1306C',
    description: 'DM inbox, comment auto-replies, post scheduling & ads',
    scopes: 'instagram_basic,instagram_manage_messages,pages_read_engagement,pages_show_list,business_management',
  },
  tiktok: {
    name: 'TikTok for Business',
    icon: 'ri-tiktok-line',
    color: '#FE2C55',
    description: 'DM inbox, comment triggers, ad campaigns & video scheduling',
  },
} as const;

const OTHER_INTEGRATIONS = [
  { id: 'mtn', name: 'MTN Mobile Money', icon: 'ri-smartphone-line', color: '#FFCC00', status: 'connected', description: 'Accept MoMo payments and auto-reconcile', lastSync: '1 min ago' },
  { id: 'dhl', name: 'DHL Express', icon: 'ri-truck-line', color: '#D40511', status: 'connected', description: 'Auto-create shipments and track deliveries', lastSync: '15 min ago' },
  { id: 'ga', name: 'Google Analytics', icon: 'ri-bar-chart-2-line', color: '#F4B400', status: 'disconnected', description: 'Track storefront traffic and conversions', lastSync: 'Never' },
  { id: 'mc', name: 'Mailchimp', icon: 'ri-mail-line', color: '#FFE01B', status: 'disconnected', description: 'Email marketing campaigns and automation', lastSync: 'Never' },
  { id: 'qb', name: 'QuickBooks', icon: 'ri-book-2-line', color: '#2CA01C', status: 'disconnected', description: 'Sync sales and expenses to accounting', lastSync: 'Never' },
];

async function buildOAuthUrl(_channel: 'instagram' | 'whatsapp' | 'tiktok'): Promise<string | null> {
  return null;
}

export default function IntegrationsSection() {
  const [searchParams] = useSearchParams();
  const [integrations, setIntegrations] = useState<ChannelIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const notConfigured = true;

  useEffect(() => {
    // Show feedback from OAuth redirect
    const connected = searchParams.get('connected');
    const error = searchParams.get('error');
    if (connected) {
      const name = CHANNEL_META[connected as keyof typeof CHANNEL_META]?.name ?? connected;
      showToast('success', `${name} connected successfully!`);
    }
    if (error) {
      const messages: Record<string, string> = {
        oauth_denied: 'Connection was cancelled.',
        invalid_session: 'Session expired. Please sign in again.',
        callback_failed: 'Connection failed. Check your app credentials.',
        missing_params: 'OAuth response was incomplete. Try again.',
      };
      showToast('error', messages[error] ?? 'Something went wrong.');
    }
  }, []);

  useEffect(() => {
    getAllIntegrations()
      .then(setIntegrations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 5000);
  }

  function getIntegration(channel: string) {
    return integrations.find(i => i.channel === channel);
  }

  async function handleConnect(channel: 'instagram' | 'whatsapp' | 'tiktok') {
    setConnecting(channel);
    const url = await buildOAuthUrl(channel);
    setConnecting(null);

    if (!url) {
      showToast('error', `Set VITE_${channel === 'tiktok' ? 'TIKTOK_CLIENT_KEY' : 'META_APP_ID'} in your .env.local first.`);
      return;
    }

    // Open OAuth in same tab — Meta/TikTok will redirect back
    window.location.href = url;
  }

  async function handleDisconnect(channel: 'instagram' | 'whatsapp' | 'tiktok') {
    try {
      await disconnectChannel(channel);
      setIntegrations(prev =>
        prev.map(i => i.channel === channel ? { ...i, status: 'disconnected', access_token: null, last_sync: null } : i),
      );
      showToast('success', `${CHANNEL_META[channel].name} disconnected.`);
    } catch (err) {
      showToast('error', String(err));
    }
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
          <i className={`mr-2 ${toast.type === 'success' ? 'ri-check-line' : 'ri-alert-line'}`} />
          {toast.message}
        </div>
      )}

      {/* Setup notice */}
      {notConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700 space-y-2">
          <p className="font-semibold"><i className="ri-information-line mr-1" />One-time setup required to enable OAuth connections</p>
          <p>Add these to your <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code> file:</p>
          <pre className="bg-amber-100 rounded-lg p-3 text-amber-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{`# From developers.facebook.com → Your App → Settings → Basic
VITE_META_APP_ID=your_meta_app_id

# From developers.tiktok.com → Your App → Manage → Client Key
VITE_TIKTOK_CLIENT_KEY=your_tiktok_client_key`}</pre>
          <p>Then add the secrets for the Edge Functions:</p>
          <pre className="bg-amber-100 rounded-lg p-3 text-amber-800 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">{`supabase secrets set META_APP_ID=xxx META_APP_SECRET=xxx
supabase secrets set TIKTOK_CLIENT_KEY=xxx TIKTOK_CLIENT_SECRET=xxx
supabase secrets set APP_URL=https://yourapp.com`}</pre>
        </div>
      )}

      {/* Social channels */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Social Channels</h3>
        <div className="space-y-3">
          {(Object.keys(CHANNEL_META) as (keyof typeof CHANNEL_META)[]).map(channel => {
            const meta = CHANNEL_META[channel];
            const integration = getIntegration(channel);
            const isConnected = integration?.status === 'connected';

            return (
              <div key={channel} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}18` }}>
                  <i className={`${meta.icon} text-lg`} style={{ color: meta.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-slate-800">{meta.name}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                      {isConnected ? 'Connected' : 'Not Connected'}
                    </span>
                    {isConnected && integration?.last_sync && (
                      <span className="text-[10px] text-slate-400">
                        Last sync: {new Date(integration.last_sync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{meta.description}</p>
                  {isConnected && (
                    <p className="text-[10px] text-emerald-600 mt-0.5">
                      <i className="ri-check-line mr-0.5" />
                      {channel === 'whatsapp' && integration?.phone_number_id ? `Phone ID: ${integration.phone_number_id}` : ''}
                      {channel === 'instagram' && integration?.ig_user_id ? `Account ID: ${integration.ig_user_id}` : ''}
                      {channel === 'tiktok' && integration?.tiktok_app_id ? `App ID: ${integration.tiktok_app_id}` : ''}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(channel)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-rose-200 text-rose-500 hover:bg-rose-50 cursor-pointer"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(channel)}
                      disabled={connecting === channel || loading}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-60 whitespace-nowrap"
                      style={{ background: meta.color }}
                    >
                      {connecting === channel ? (
                        <i className="ri-loader-4-line animate-spin" />
                      ) : (
                        <i className={meta.icon} />
                      )}
                      Connect {meta.name}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* How it works */}
      <div className="bg-slate-50 rounded-2xl p-4">
        <p className="text-xs font-semibold text-slate-600 mb-2"><i className="ri-shield-check-line mr-1 text-emerald-500" />How connections work</p>
        <div className="flex items-start gap-6 text-xs text-slate-500">
          {[
            { icon: 'ri-cursor-line', text: 'Click Connect — you\'re redirected to the official platform login' },
            { icon: 'ri-lock-line', text: 'You log in with your own credentials — we never see your password' },
            { icon: 'ri-link-m', text: 'You authorize this app — a secure token is stored for your account only' },
          ].map(step => (
            <div key={step.icon} className="flex items-start gap-2">
              <i className={`${step.icon} text-slate-400 mt-0.5 flex-shrink-0`} />
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Engine */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Engine</h3>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-50">
            <i className="ri-robot-2-line text-lg text-emerald-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-slate-800">OpenAI GPT-4o Mini</p>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-600">Active</span>
            </div>
            <p className="text-xs text-slate-500">Powers AI auto-replies and post generation across all channels.</p>
          </div>
          <div className="text-[10px] text-slate-400 text-right">
            <p>gpt-4o-mini</p>
            <p className="text-emerald-500 font-medium">Configured</p>
          </div>
        </div>
      </div>

      {/* Other integrations */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Other Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OTHER_INTEGRATIONS.map(integration => (
            <div key={integration.id} className="bg-white rounded-2xl p-4 border border-slate-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${integration.color}18` }}>
                <i className={`${integration.icon} text-lg`} style={{ color: integration.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold text-slate-800">{integration.name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${integration.status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                    {integration.status === 'connected' ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{integration.description}</p>
                {integration.status === 'connected' && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Last sync: {integration.lastSync}</p>
                )}
              </div>
              <button
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap flex-shrink-0 ${integration.status === 'connected' ? 'border border-slate-200 text-slate-500 hover:bg-slate-50' : 'text-white'}`}
                style={integration.status !== 'connected' ? { background: '#DC1F1F' } : {}}
              >
                {integration.status === 'connected' ? 'Manage' : 'Connect'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
