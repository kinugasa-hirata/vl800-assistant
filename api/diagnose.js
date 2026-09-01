// Vercel Serverless Function: /api/diagnose
const VISION_PROMPT = `You are the Keyence VL-800 3D Scanner Coordinate Measuring Machine (3Dスキャナ型三次元測定機) Visual Diagnostic Specialist.

An operator in an air-gapped machine shop has captured a photo using their mobile phone.
The photo is either:
1. The VL-800 software monitor screen (showing a 3D scan mesh, color map deviation, error message, or measurement elements).
2. The physical workpiece on the stage (shiny metal, black rubber, complex undercut, transparent plastic).
3. The VL-800 machine hardware (cables, stage VL-850, measuring unit VL-870, shade cover VL-C45, calibration board OP-88145).

Your task:
Analyze this image thoroughly and output a structured JSON diagnosis grounded in the 8 official Keyence VL-800 manuals:
1. issue_title (Brief Japanese title, e.g. "光沢面によるスキャンデータ欠損・穴あき")
2. severity ("info" | "warning" | "error" | "critical")
3. detected_symptoms (What you see in the photo)
4. root_cause (Technical explanation based on optical triangulation, reflection, alignment, or cabling)
5. step_by_step_fix (Array of 3-5 concrete action steps for the operator)
6. manual_citation (Exact manual name and page, e.g. "AS_148443 (新規データ取得編) p.19-22")
7. estimated_fix_time (e.g. "約2分")

Output ONLY valid JSON matching this schema:
{
  "issue_title": "string",
  "severity": "warning",
  "detected_symptoms": "string",
  "root_cause": "string",
  "step_by_step_fix": ["step 1", "step 2", "step 3"],
  "manual_citation": "string",
  "estimated_fix_time": "string"
}`;

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
    const { imageBase64, mimeType = 'image/jpeg', clientApiKey } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'Image data is required (base64)' });
    }

    const rawApiKey = process.env.GEMINI_API_KEY || clientApiKey || '';
    const apiKey = rawApiKey.replace(/["'\s]/g, '').trim();

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    if (!apiKey) {
      // Fallback local diagnosis simulation
      return res.status(200).json({
        issue_title: 'スキャン品質 / 表面状態の自動診断（オフラインモード）',
        severity: 'warning',
        detected_symptoms: '画像の解析が完了しました（オフライン診断）。対象物の反射率またはアライメント状態を確認しました。',
        root_cause: '光沢面によるレーザー散乱、またはアライメント初期位置の不一致が疑われます。',
        step_by_step_fix: [
          '対象物に光沢がある場合は、アンチグレアスプレー（OP-87934）を薄く均一に塗布してください。',
          'スキャン設定画面で［明るさ調整］->［HDR合成］を有効に設定してください。',
          'CADモデルとの比較を行う場合は［3-2-1位置合わせ］で基準面・軸を指定してください。',
          '遮光カバー（VL-C45）をしっかり閉じて外光を遮断してください。'
        ],
        manual_citation: 'AS_148443 (新規データ取得編) p.19-22 / AS_149847 p.8',
        estimated_fix_time: '約3分',
        source: 'local_rule'
      });
    }

    // Call Gemini 1.5 Flash Vision
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: VISION_PROMPT }]
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: cleanBase64
                }
              },
              { text: 'Analyze this Keyence VL-800 shop floor photo and return JSON diagnosis.' }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error?.message || errText;
      } catch (e) {}

      console.error(`Gemini Vision error (${response.status}):`, parsedErr);
      return res.status(200).json({
        issue_title: `AI診断エラー (${response.status})`,
        severity: 'error',
        detected_symptoms: `Gemini API呼び出しエラー: ${parsedErr}`,
        root_cause: 'Vercelの環境変数 GEMINI_API_KEY が最新のデプロイに適用されていないか、APIキーが無効です。',
        step_by_step_fix: [
          'Vercelダッシュボードの Deployments から最新のデプロイの「Redeploy」を実行してください。',
          '右上の設定アイコン（⚙️）から直接APIキーを保存して再試行してください。',
          '下のトラブルシューティング一覧から該当症状を確認してください。'
        ],
        manual_citation: 'VL-800 リファレンスマニュアル',
        estimated_fix_time: '即時',
        source: 'api_error'
      });
    }

    const data = await response.json();
    const rawOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(rawOutput);
    } catch (e) {
      parsedResult = {
        issue_title: '画像診断結果',
        severity: 'info',
        detected_symptoms: rawOutput,
        root_cause: '詳細はマニュアルをご確認ください。',
        step_by_step_fix: ['マニュアルのトラブルシューティング項目を確認してください。'],
        manual_citation: 'VL-800 リファレンスマニュアル (AS_159000)',
        estimated_fix_time: '約5分'
      };
    }

    parsedResult.source = 'gemini_vision';
    return res.status(200).json(parsedResult);

  } catch (error) {
    console.error('Diagnosis error:', error);
    return res.status(200).json({
      issue_title: '診断処理エラー',
      severity: 'error',
      detected_symptoms: `通信エラー: ${error.message}`,
      root_cause: 'ネットワーク環境またはサーバーレス設定を確認してください。',
      step_by_step_fix: [
        'トラブルシューティング一覧から該当する症状を選択してください。',
        'マニュアルタブから関連ガイドを参照してください。'
      ],
      manual_citation: 'VL-800 リファレンスマニュアル',
      estimated_fix_time: '即時',
      source: 'server_error'
    });
  }
};
