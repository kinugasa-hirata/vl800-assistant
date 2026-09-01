// Vercel Serverless Function: /api/chat
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPT = `You are the Keyence VL-800 3D Scanner Coordinate Measuring Machine (3Dスキャナ型三次元測定機) AI Assistant.
Your mission is to provide accurate, step-by-step, and safe operational and troubleshooting guidance to factory operators and quality engineers.

Always ground your answers in the 8 official Keyence VL-800 manuals:
1. AS_148443: 新規データ取得編 (New Data Acquisition) - Workpiece placement, brightness, texture ON/OFF, multi-angle stitching.
2. AS_148444: 3D測定編 (3D Measurement) - Elements (planes, cylinders, spheres), distances, angles, OK/NG tolerances.
3. AS_148445: 幾何公差編 (GD&T) - Datum A/B/C, Flatness, Roundness, Perpendicularity, Position, Runout.
4. AS_148446: 断面測定編 (Cross Section) - Cut plane, 2D profile, R-radius, chamfer angles.
5. AS_148447: 多断面測定編 (Multi Cross Section) - Multi-slice pitch, batch inspection.
6. AS_149847: 3D比較測定・断面比較測定編 (CAD Comparison) - STEP/IGES CAD import, 3-2-1 alignment, Best-fit, Color deviation heatmap (Green=±0.05mm, Red=surplus, Blue=undercut).
7. AS_159000: リファレンスマニュアル (Reference Manual 342p) - Hardware config, coordinate systems, templates, Ch.17 maintenance & calibration.
8. AS_168219: ユーザーズマニュアル (User Manual) - VL-870/850 hardware, cabling (STAGE, HEAD, LIGHT, USB3.0), shade cover VL-C45, safety.

Formatting Rules:
- Answer in the user's language (Japanese by default, English if asked in English).
- Be concise, structured (bullet points), and actionable for a mobile screen.
- Always include manual citation badges at the end, e.g. [📘 参照: AS_148444 (3D測定編) p.8-12].
- Emphasize safety warnings for stage movement, cabling, and laser optical components.`;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { message, history = [], clientApiKey } = req.body || {};
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || clientApiKey;

    if (!apiKey) {
      // Offline / Fallback mode: Search local knowledge
      return res.status(200).json({
        reply: `【オフライン/事前登録ナレッジからの回答】\n\nご質問「${message}」に関する標準手順：\n\n・該当の測定または操作を行う際は、対象物をステージ中央に正しく設置し、合焦インジケータ（緑色の帯）に合わせてください。\n・光沢物・黒色物はアンチグレアスプレー（OP-87934）またはHDRスキャンを使用します。\n・詳細な手順は「マニュアル一覧」タブから各操作ガイドをご確認いただけます。\n\n※ Gemini APIキーを設定すると、AIによるリアルタイム対話とより詳細な自動診断が有効になります。\n\n[📘 参照: VL-800 リファレンスマニュアル (AS_159000)]`,
        source: 'local_knowledge',
        hasApiKey: false
      });
    }

    // Call Gemini API (gemini-1.5-flash or gemini-2.0-flash)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }]
      },
      {
        role: 'model',
        parts: [{ text: '理解いたしました。Keyence VL-800 3Dスキャナ型三次元測定機の専門AIアシスタントとして、8冊の公式マニュアルに基づき的確で安全な操作・トラブルシューティング手順を回答いたします。' }]
      }
    ];

    // Append history
    if (Array.isArray(history)) {
      history.slice(-6).forEach(h => {
        if (h.role && h.text) {
          contents.push({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '回答を取得できませんでした。';

    return res.status(200).json({
      reply: replyText,
      source: 'gemini_api',
      hasApiKey: true
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error',
      fallbackReply: '現在AIサービスに接続できません。マニュアル一覧またはトラブルシューティング集をご確認ください。'
    });
  }
};
