export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, amount, planTier } = req.body || {};
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const ref = `SP_${planTier ? planTier.toUpperCase() : 'VIP'}_${Date.now()}`;

  if (!secretKey) {
    // If secret key is not set on backend, return reference for client-side popup
    return res.status(200).json({
      success: true,
      reference: ref,
      amount: Math.round(Number(amount || 2000) * 100),
      currency: 'NGN',
      email,
    });
  }

  try {
    const paystackRes = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(Number(amount || 2000) * 100),
        reference: ref,
        currency: 'NGN',
        metadata: { planTier },
      }),
    });

    const data = await paystackRes.json();
    if (data.status) {
      return res.status(200).json({
        success: true,
        reference: data.data.reference || ref,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
      });
    }

    return res.status(200).json({
      success: true,
      reference: ref,
      fallback: true,
    });
  } catch (err: any) {
    return res.status(200).json({
      success: true,
      reference: ref,
      fallback: true,
    });
  }
}
