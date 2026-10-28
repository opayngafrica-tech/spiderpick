export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey =
    process.env.ALLSPORTS_API_KEY ||
    process.env.VITE_ALLSPORTS_API_KEY ||
    'b6ebbc212e89cc1438e3856b82acd89634ff7ef1f200965d0946455398660579';

  const today = new Date().toISOString().slice(0, 10);
  const targetFrom = String(req.query?.from || req.query?.date || today);
  const targetTo = String(req.query?.to || req.query?.date || today);

  try {
    const url = `https://apiv2.allsportsapi.com/football/?met=Fixtures&APIkey=${apiKey}&from=${targetFrom}&to=${targetTo}`;
    const response = await fetch(url);

    if (response.ok) {
      const json = await response.json();
      const rawList = Array.isArray(json?.result) ? json.result : [];

      if (rawList.length > 0) {
        const formatted = rawList.map((item: any) => ({
          id: Number(item.event_key),
          h: item.event_home_team || 'Home',
          a: item.event_away_team || 'Away',
          l: item.league_name || 'League',
          t: item.event_time || '15:00',
          d: item.event_date || targetFrom,
          sh: Number(item.event_final_result?.split('-')[0]?.trim() || 0),
          sa: Number(item.event_final_result?.split('-')[1]?.trim() || 0),
          s: item.event_status === 'Finished' ? 'won' : 'p',
          homeLogo: item.home_team_logo,
          awayLogo: item.away_team_logo,
        }));

        return res.status(200).json({
          source: 'allsportsapi-fixtures',
          count: formatted.length,
          fixtures: formatted,
          timestamp: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('AllSportsAPI fixtures error:', err);
  }

  return res.status(200).json({
    source: 'allsportsapi-empty',
    count: 0,
    fixtures: [],
    timestamp: new Date().toISOString(),
  });
}
