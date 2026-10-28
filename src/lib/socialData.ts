import { SocialHandleItem } from '../types/football';
import { supabase } from '../utils/supabase';

export const DEFAULT_SOCIAL_LINKS: SocialHandleItem[] = [
  {
    id: 'telegram',
    name: 'Telegram Official VIP Channel',
    handle: '@spiderpicksofficial',
    url: 'https://t.me/spiderpicksofficial',
    isActive: true,
    color: '#229ED9',
    bgGradient: 'linear-gradient(135deg, #0088cc 0%, #00c6ff 100%)',
    description: 'Instant daily banker picks, high odds VIP accumulators, and real-time live goal alerts.',
    badge: 'Verified Channel',
    display_order: 1,
  },
  {
    id: 'facebook',
    name: 'Facebook Official Page',
    handle: 'SpiderPicks Official',
    url: 'https://www.facebook.com/profile.php?id=61595517376075',
    isActive: true,
    color: '#1877F2',
    bgGradient: 'linear-gradient(135deg, #1877f2 0%, #3b5998 100%)',
    description: 'Follow our official page for match breakdowns, community discussions, and daily analysis.',
    badge: 'Official Page',
    display_order: 2,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@spiderpicks',
    url: '',
    isActive: false,
    color: '#E4405F',
    bgGradient: 'linear-gradient(135deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    description: 'Matchday infographics, winning slip highlights, and exclusive football analytics.',
    badge: 'Coming Soon',
    display_order: 3,
  },
  {
    id: 'x',
    name: 'X (Formerly Twitter)',
    handle: '@spiderpicks',
    url: '',
    isActive: false,
    color: '#0f172a',
    bgGradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    description: 'Breaking squad news, real-time match commentary, and instant odds shifts.',
    badge: 'Coming Soon',
    display_order: 4,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    handle: '@spiderpicks',
    url: '',
    isActive: false,
    color: '#000000',
    bgGradient: 'linear-gradient(135deg, #000000 0%, #fe2c55 50%, #25f4ee 100%)',
    description: 'Short video football analysis, betting strategy breakdowns, and daily previews.',
    badge: 'Coming Soon',
    display_order: 5,
  },
];

const STORAGE_KEY = 'sa_social_links';

export function getInitialSocialLinks(): SocialHandleItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: SocialHandleItem[] = JSON.parse(saved);
      // Merge with default items in case new ones were added
      return DEFAULT_SOCIAL_LINKS.map((def) => {
        const found = parsed.find((p) => p.id === def.id);
        return found ? { ...def, ...found } : def;
      });
    }
  } catch (e) {
    console.warn('Failed to parse cached social links:', e);
  }
  return DEFAULT_SOCIAL_LINKS;
}

export function saveLocalSocialLinks(links: SocialHandleItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  } catch (e) {
    console.warn('Failed to save social links locally:', e);
  }
}

export async function fetchRemoteSocialLinks(): Promise<SocialHandleItem[] | null> {
  try {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return null;
    }

    return DEFAULT_SOCIAL_LINKS.map((def) => {
      const row = data.find((r: any) => r.id === def.id);
      if (row) {
        return {
          ...def,
          name: row.name || def.name,
          handle: row.handle || def.handle,
          url: row.url !== undefined ? row.url : def.url,
          isActive: Boolean(row.is_active),
          description: row.description || def.description,
          display_order: row.display_order ?? def.display_order,
        };
      }
      return def;
    });
  } catch (err) {
    console.warn('Error fetching remote social links:', err);
    return null;
  }
}

export async function updateRemoteSocialLink(item: Partial<SocialHandleItem> & { id: string }): Promise<boolean> {
  try {
    const payload: Record<string, any> = {
      id: item.id,
      updated_at: new Date().toISOString(),
    };
    if (item.name !== undefined) payload.name = item.name;
    if (item.handle !== undefined) payload.handle = item.handle;
    if (item.url !== undefined) payload.url = item.url;
    if (item.isActive !== undefined) payload.is_active = item.isActive;
    if (item.description !== undefined) payload.description = item.description;

    const { error } = await supabase
      .from('social_links')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Supabase social_links upsert notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Could not update remote social link:', err);
    return false;
  }
}
