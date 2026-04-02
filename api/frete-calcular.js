export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cep_destino, itens } = req.body;
  if (!cep_destino || !itens) {
    return res.status(400).json({ error: "CEP ou itens ausentes" });
  }

  try {
    // Buscar dimensões no Base44
    const base44ApiKey = process.env.BASE44_API_KEY;
    const base44AppId = process.env.BASE44_APP_ID;

    const base44Res = await fetch(
      `https://pictology.base44.app/api/apps/${base44AppId}/entities/ShippingDimensions`,
      { headers: { "api_key": base44ApiKey } }
    );

    const dimensoes = await base44Res.json();

    if (!Array.isArray(dimensoes) || dimensoes.length === 0) {
      return res.status(400).json({ error: "Nenhuma dimensão encontrada" });
    }

    // Mapear itens para verificar se existe dimensão
    const itensValidos = itens.map(item => {
      const dim = dimensoes.find(d => d.size_label === item.size_label);
      if (!dim) return null;
      return { ...item, dimensao: dim };
    }).filter(Boolean);

    if (itensValidos.length === 0) {
      return res.status(400).json({ error: "Nenhum produto válido" });
    }

    // Retornar JSON final (pode colocar lógica de frete aqui)
    return res.status(200).json({
      cep_destino,
      itens: itensValidos
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno", details: err.message });
  }
}
