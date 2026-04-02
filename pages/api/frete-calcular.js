// pages/api/frete-calcular.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cep_destino, itens } = req.body;
  if (!cep_destino || !itens || itens.length === 0) {
    return res.status(400).json({ error: 'CEP ou itens ausentes' });
  }

  try {
    // 1️⃣ Buscar dimensões no Base44
    const base44ApiKey = process.env.BASE44_API_KEY;
    const base44AppId = process.env.BASE44_APP_ID;

    const base44Res = await fetch(
      `https://pictology.base44.app/api/apps/${base44AppId}/entities/ShippingDimensions`,
      { headers: { 'api_key': base44ApiKey } }
    );

    const dimensoes = await base44Res.json();

    if (!Array.isArray(dimensoes) || dimensoes.length === 0) {
      return res.status(400).json({ error: 'Nenhuma dimensão encontrada' });
    }

    // 2️⃣ Mapear itens e verificar dimensões válidas
    const itensValidos = itens.map(item => {
      const dim = dimensoes.find(d => d.size_label === item.size_label);
      if (!dim) return null;
      return { ...item, dimensao: dim };
    }).filter(Boolean);

    if (itensValidos.length === 0) {
      return res.status(400).json({ error: 'Nenhum produto válido' });
    }

    // 3️⃣ Montar payload para Melhor Envio
    const melhorEnvioBody = {
      from: { postal_code: process.env.CEP_ORIGEM }, // CEP da sua loja
      to: { postal_code: cep_destino },
      parcels: itensValidos.map(item => ({
        weight: item.dimensao.weight,      // kg
        length: item.dimensao.height,      // cm
        height: item.dimensao.height,      // cm
        width: item.dimensao.width,        // cm
        quantity: item.quantidade
      }))
    };

    // 4️⃣ Chamar API do Melhor Envio
    const melhorEnvioRes = await fetch(
      'https://api.melhorenvio.com.br/v2/shipment/calculate',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MELHOR_ENVIO_TOKEN}` // Token Melhor Envio
        },
        body: JSON.stringify(melhorEnvioBody)
      }
    );

    const frete = await melhorEnvioRes.json();

    // 5️⃣ Retornar resposta completa
    return res.status(200).json({
      cep_destino,
      itens: itensValidos,
      frete
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno', details: err.message });
  }
}