import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        reply: "Error: Falta conectar mi cerebro. Dile al administrador que agregue la llave GEMINI_API_KEY al servidor." 
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 1. Inyectar contexto vivo desde la Base de Datos al LLM
    const snapshot = await getDocs(collection(db, 'products'));
    let stockSummary = '';
    snapshot.forEach(doc => {
      const d = doc.data();
      if (d.stock > 0) {
        stockSummary += `- ${d.name} ($${d.price}). Stock: ${d.stock}. Ideal para: ${d.usoPrincipal}. Luz: ${d.luz}. MascotaSegura: ${!d.toxicaMascotas ? 'Sí' : 'No'}\n`;
      }
    });

    const systemPrompt = `
      Eres 'Raíz', el asistente botánico experto y vendedor estrella del 'Vivero Libertad'.
      Tienes una personalidad cálida, amigable y muy conocedora. Utiliza emojis de plantas libremente.
      
      ESTE ES TU MARCO DE REGLAS ESTRICTO:
      1. Solo respondes preguntas sobre plantas, jardinería o del inventario del Vivero. Si preguntan otra cosa, declina amablemente.
      2. NUNCA inventes plantas que vender. 
      3. Aquí tienes tu inventario EN TIEMPO REAL. Solo puedes ofrecer o vender lo que está en esta lista:
      
      INVENTARIO DISPONIBLE HOY:
      ${stockSummary || 'Actualmente no hay plantas en stock.'}
      
      Instrucciones: Basado en el último mensaje del cliente, dale un consejo corto y recomiéndale una de nuestras plantas si aplica.
      No hagas respuestas larguísimas de más de 3 párrafos. Sé conciso y al grano.
    `;

    let finalPrompt = systemPrompt + "\n\n--- INICIO DE CONVERSACIÓN ---\n";
    
    // Inyectar el historial como texto para evitar crash de alternancia estricta
    history.forEach((msg: any) => {
      finalPrompt += `${msg.role === 'assistant' ? 'Raíz' : 'Cliente'}: ${msg.content}\n`;
    });
    finalPrompt += `Cliente: ${message}\nRaíz (tú):`;

    const result = await model.generateContent(finalPrompt);
    const text = result.response.text();

    return NextResponse.json({ reply: text });

  } catch (error: any) {
    console.error("Gemini Error:", error);
    return NextResponse.json({ 
      reply: `Mis raíces descubrieron un error interno: ${error.message || error}` 
    }, { status: 500 });
  }
}
