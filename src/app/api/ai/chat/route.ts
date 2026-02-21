import { NextResponse } from 'next/server';
import { getAIContext } from '@/lib/aiContext';

export async function POST(req: Request) {
    try {
        const { messages, organizationId, activeTicketId } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'Brak klucza API Gemini' }, { status: 500 });
        }

        // 1. Gather Context
        const context = await getAIContext(organizationId, activeTicketId);

        // 2. Prepare System Prompt (Ported from legacy)
        const systemPrompt = `
        Jesteś Asystentką GK Portal (Wersja Next.js).
        Twoim celem jest zarządzanie zadaniami (Tickets) zgodnie ze ŚCISŁYM SCHEMATEM BAZY DANYCH.
        
        === TWOJE AKTUALNE OTOCZENIE ===
        ZADANIE (Jeśli otwarte): ${context.activeTicketStr}
        
        ${context.sopContext}
        ${context.vaultContext}
        
        Styl: PROFESJONALNY, ZWIĘZŁY, KONKRETNY.
        ZASADA 1: ŻADNYCH EMOTIKONEK (Ban).
        ZASADA 2: Używaj list punktowanych.
        ZASADA 3: Krótkie zdania.
        
        OBECNA DATA: ${new Date().toISOString().split('T')[0]}
        
        === OSTATNIE ZADANIA ===
        ${context.ticketsStr}
        
        ### ZASADY FORMATOWANIA
        - ZAWSZE zwracaj tablicę obiektów JSON: [ { "type": "MESSAGE", "text": "..." } ]
        - Komendy wspierane: CREATE_TICKET, UPDATE_TICKET, START_TIMER, STOP_TIMER.
        `;

        // 3. Call Gemini API
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemPrompt }]
                },
                contents: messages.map((m: any) => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }]
                }))
            })
        });

        const data = await response.json();
        const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "[]";

        // Attempt to parse JSON from AI response (sanitize if needed)
        let aiJson = [];
        try {
            const cleanJson = aiText.replace(/```json|```/g, '').trim();
            aiJson = JSON.parse(cleanJson);
        } catch (e) {
            aiJson = [{ type: 'MESSAGE', text: aiText }];
        }

        return NextResponse.json(aiJson);
    } catch (error: any) {
        console.error('Chat error:', error);
        return NextResponse.json({ error: 'Błąd AI Chat' }, { status: 500 });
    }
}
