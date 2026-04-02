// enviarBase44ParaNext.js
import 'dotenv/config'; // carrega variáveis do .env

// Node 18+ já tem fetch nativo, então não precisa de node-fetch

// CONFIGURAÇÃO
const base44ApiKey = process.env.BASE44_API_KEY;
const base44AppId = process.env.BASE44_APP_ID;
const nextEndpoint = "http://localhost:3000/api/frete-calcular"; // ajuste se necessário
const cepDestino = "04026000"; // CEP do cliente

if (!base44ApiKey || !base44AppId) {
  console.error("Erro: Base44 API Key ou App ID não configurados!");
  process.exit(1);
}

async function enviar() {
  try {
    // 1️⃣ Buscar dimensões no Base44
    const res = await fetch(
      `https://pictology.base44.app/api/apps/${base44AppId}/entities/ShippingDimensions`,
      {
        headers: {
          "api_key": base44ApiKey,
          "Accept": "application/json",
          "User-Agent": "Node.js"
        }
      }
    );

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      console.error("Nenhuma dimensão encontrada no Base44!");
      return;
    }

    console.log(`Dimensões encontradas: ${data.length}`);

    // 2️⃣ Montar itens para enviar ao Next.js
    const itens = data.map(dim => ({
      size_label: dim.size_label,
      quantidade: 1
    }));

    const jsonFinal = {
      cep_destino: cepDestino,
      itens
    };

    console.log("JSON a ser enviado ao Next.js:");
    console.log(JSON.stringify(jsonFinal, null, 2));

    // 3️⃣ Enviar para o endpoint Next.js
    const postRes = await fetch(nextEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(jsonFinal)
    });

    const resposta = await postRes.json();
    console.log("Resposta do Next.js:", resposta);

  } catch (err) {
    console.error("Erro:", err);
  }
}

// Executa o envio
enviar();