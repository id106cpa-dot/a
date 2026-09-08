var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_genai = require("@google/genai");
var import_meta = {};
import_dotenv.default.config();
var __filename = (0, import_url.fileURLToPath)(import_meta.url);
var __dirname = import_path.default.dirname(__filename);
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "25mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "25mb" }));
var genAI = null;
function getGeminiClient() {
  if (!genAI && process.env.GEMINI_API_KEY) {
    genAI = new import_genai.GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return genAI;
}
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
});
app.post("/api/scan-106", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing image/document data" });
    }
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured on the server"
      });
    }
    let resolvedMime = mimeType;
    if (!resolvedMime && imageBase64.startsWith("data:")) {
      const match = imageBase64.match(/^data:([^;]+);base64,/);
      if (match) {
        resolvedMime = match[1];
      }
    }
    resolvedMime = resolvedMime || "image/jpeg";
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
    const prompt = `\u05D0\u05EA\u05D4 \u05DE\u05D5\u05DE\u05D7\u05D4 \u05DE\u05E1 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05D9\u05E9\u05E8\u05D0\u05DC\u05D9 \u05D5\u05DE\u05E2\u05E8\u05DB\u05EA OCR \u05DE\u05EA\u05E7\u05D3\u05DE\u05EA \u05DC\u05E1\u05E8\u05D9\u05E7\u05EA \u05D8\u05E4\u05E1\u05D9 106 (\u05D0\u05D9\u05E9\u05D5\u05E8 \u05DC\u05DE\u05E1 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05E2\u05DC \u05DE\u05E9\u05DB\u05D5\u05E8\u05EA \u05D5\u05E0\u05D9\u05DB\u05D5\u05D9\u05D9\u05DD).
\u05E1\u05E8\u05D5\u05E7 \u05D1\u05E2\u05D9\u05D5\u05DF \u05E8\u05D1 \u05D0\u05EA \u05D4\u05DE\u05E1\u05DE\u05DA \u05D4\u05DE\u05E6\u05D5\u05E8\u05E3. \u05D0\u05EA\u05E8 \u05D0\u05EA \u05D4\u05DE\u05E9\u05D1\u05E6\u05D5\u05EA \u05D5\u05D4\u05E9\u05D3\u05D5\u05EA \u05D4\u05DE\u05DE\u05D5\u05E1\u05E4\u05E8\u05D9\u05DD \u05D4\u05DE\u05D3\u05D5\u05D9\u05E7\u05D9\u05DD \u05D1\u05D8\u05D5\u05E4\u05E1 106 \u05D5\u05D4\u05D7\u05D6\u05E8 \u05D0\u05EA \u05D4\u05E2\u05E8\u05DB\u05D9\u05DD:

\u05D4\u05E0\u05D7\u05D9\u05D5\u05EA \u05DC\u05D0\u05D9\u05EA\u05D5\u05E8 \u05D4\u05E9\u05D3\u05D5\u05EA:
- "taxYear": \u05E9\u05E0\u05EA \u05D4\u05DE\u05E1 (\u05DE\u05D5\u05E4\u05D9\u05E2 \u05D1\u05E8\u05D0\u05E9 \u05D4\u05D8\u05D5\u05E4\u05E1, \u05DC\u05D3\u05D5\u05D2\u05DE\u05D4 2024, 2023, 2022, 2021, 2020).
- "employerName": \u05E9\u05DD \u05D4\u05DE\u05E2\u05E1\u05D9\u05E7/\u05D4\u05D7\u05D1\u05E8\u05D4 \u05D4\u05DE\u05E0\u05E4\u05D9\u05E7\u05D4 (\u05D1\u05E8\u05D0\u05E9 \u05D4\u05D8\u05D5\u05E4\u05E1 \u05E1\u05E2\u05D9\u05E3 \u05D0').
- "employeeName": \u05E9\u05DD \u05D4\u05E2\u05D5\u05D1\u05D3/\u05EA \u05D5\u05DE\u05E1\u05E4\u05E8 \u05D6\u05D4\u05D5\u05EA (\u05E1\u05E2\u05D9\u05E3 \u05D1').
- "grossSalary": \u05E1\u05DA \u05DE\u05E9\u05DB\u05D5\u05E8\u05EA \u05D1\u05E8\u05D5\u05D8\u05D5 \u05E9\u05E0\u05EA\u05D9\u05EA \u05DB\u05D5\u05DC\u05DC\u05EA. \u05D7\u05E4\u05E9 \u05E9\u05D3\u05D4 \u05DE\u05DE\u05D5\u05E1\u05E4\u05E8 158 \u05D0\u05D5 158/172 ("\u05DE\u05E9\u05DB\u05D5\u05E8\u05EA \u05D5\u05E1\u05E2\u05D9\u05E4\u05D9\u05DD \u05D0\u05D7\u05E8\u05D9\u05DD"), \u05D0\u05D5 \u05E9\u05D3\u05D4 244 \u05D0\u05D5 \u05E9\u05D3\u05D4 258. \u05E9\u05D9\u05DD \u05DC\u05D1 \u05D1\u05DE\u05D9\u05D5\u05D7\u05D3: \u05D0\u05DD \u05DE\u05D5\u05E4\u05D9\u05E2\u05D9\u05DD \u05DE\u05E1\u05E4\u05E8 \u05E9\u05D3\u05D5\u05EA \u05E9\u05DB\u05E8 \u05D0\u05D5 \u05E9\u05DB\u05E8 \u05DE\u05D1\u05D5\u05D8\u05D7 \u05DC\u05E6\u05D3 \u05E9\u05D3\u05D5\u05EA 158/172, \u05E7\u05D7 \u05D1\u05DE\u05D3\u05D5\u05D9\u05E7 \u05D0\u05EA \u05D4\u05E1\u05DB\u05D5\u05DD \u05D4\u05E6\u05DE\u05D5\u05D3 \u05DC\u05E7\u05D5\u05D3 158 (\u05D0\u05D5 158/172 - \u05DE\u05E9\u05DB\u05D5\u05E8\u05EA \u05D7\u05D9\u05D9\u05D1\u05EA \u05D1\u05DE\u05E1 \u05E2\u05D1\u05D5\u05D3\u05D4) \u05D5\u05DC\u05D0 \u05E9\u05D3\u05D5\u05EA \u05E9\u05DC \u05E9\u05DB\u05E8 \u05DE\u05D1\u05D5\u05D8\u05D7 \u05D0\u05D5 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05E4\u05D8\u05D5\u05E8\u05D4. \u05D0\u05DD \u05D0\u05D9\u05DF \u05E9\u05D3\u05D4 \u05DE\u05DE\u05D5\u05E1\u05E4\u05E8, \u05D0\u05EA\u05E8 \u05D0\u05EA \u05E9\u05D5\u05E8\u05EA "\u05E1\u05D4\u05F4\u05DB \u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD/\u05DE\u05E9\u05DB\u05D5\u05E8\u05EA".
- "taxDeducted": \u05E1\u05DA \u05DE\u05E1 \u05D4\u05DB\u05E0\u05E1\u05D4 \u05E9\u05E0\u05D5\u05DB\u05D4 \u05D1\u05E4\u05D5\u05E2\u05DC. \u05D7\u05E4\u05E9 \u05E9\u05D3\u05D4 \u05DE\u05DE\u05D5\u05E1\u05E4\u05E8 042 ("\u05E0\u05D9\u05DB\u05D5\u05D9 \u05DE\u05E1 \u05D4\u05DB\u05E0\u05E1\u05D4") \u05D0\u05D5 \u05E9\u05D3\u05D4 142.
- "creditPoints": \u05E0\u05E7\u05D5\u05D3\u05D5\u05EA \u05D4\u05D6\u05D9\u05DB\u05D5\u05D9 \u05E9\u05D7\u05D5\u05E9\u05D1\u05D5 \u05D1\u05EA\u05DC\u05D5\u05E9 (\u05E9\u05D3\u05D4 \u05DE\u05DE\u05D5\u05E1\u05E4\u05E8 024) - \u05DE\u05E1\u05E4\u05E8 \u05E2\u05E9\u05E8\u05D5\u05E0\u05D9 \u05DB\u05D2\u05D5\u05DF 2.25, 2.75, 4.25 \u05D5\u05DB\u05D3'.
- "pensionEmployee": \u05D4\u05E4\u05E8\u05E9\u05D5\u05EA \u05D4\u05E2\u05D5\u05D1\u05D3 \u05DC\u05E4\u05E0\u05E1\u05D9\u05D4/\u05E7\u05E6\u05D1\u05D4. \u05D7\u05E4\u05E9 \u05E9\u05D3\u05D4 \u05DE\u05DE\u05D5\u05E1\u05E4\u05E8 045 \u05D0\u05D5 \u05E9\u05D3\u05D4 086 (\u05E0\u05D9\u05DB\u05D5\u05D9 \u05DC\u05E7\u05D5\u05E4\u05EA \u05D2\u05DE\u05DC \u05DC\u05E7\u05E6\u05D1\u05D4 - \u05D7\u05DC\u05E7 \u05E2\u05D5\u05D1\u05D3).
- "pensionEmployer": \u05D4\u05E4\u05E8\u05E9\u05D5\u05EA \u05DE\u05E2\u05D1\u05D9\u05D3 \u05DC\u05E7\u05E6\u05D1\u05D4 \u05E9\u05D7\u05D5\u05D9\u05D1\u05D5 \u05D1\u05DE\u05E1 \u05DE\u05E2\u05DC \u05D4\u05EA\u05E7\u05E8\u05D4. \u05D7\u05E4\u05E9 \u05E9\u05D3\u05D4 \u05DE\u05DE\u05D5\u05E1\u05E4\u05E8 036 \u05D0\u05D5 \u05E9\u05D3\u05D4 081.
- "section47Deduction": \u05E0\u05D9\u05DB\u05D5\u05D9 \u05D1\u05E2\u05D3 \u05EA\u05E9\u05DC\u05D5\u05DE\u05D9\u05DD \u05DC\u05E7\u05E6\u05D1\u05D4 \u05DC\u05E4\u05D9 \u05E1\u05E2\u05D9\u05E3 47 (\u05E9\u05D3\u05D4 \u05DE\u05DE\u05D5\u05E1\u05E4\u05E8 047) \u05D0\u05DD \u05E7\u05D9\u05D9\u05DD.
- "nationalInsuranceDeducted": \u05E1\u05DA \u05D3\u05DE\u05D9 \u05D1\u05D9\u05D8\u05D5\u05D7 \u05DC\u05D0\u05D5\u05DE\u05D9 \u05D5\u05DE\u05E1 \u05D1\u05E8\u05D9\u05D0\u05D5\u05EA \u05E9\u05E0\u05D5\u05DB\u05D5 (\u05E9\u05D3\u05D5\u05EA \u05DE\u05DE\u05D5\u05E1\u05E4\u05E8\u05D9\u05DD 021 \u05D5-022).
- "insuredSalary": \u05E9\u05DB\u05E8 \u05DE\u05D1\u05D5\u05D8\u05D7 \u05DC\u05E4\u05E0\u05E1\u05D9\u05D4 / \u05DE\u05E9\u05DB\u05D5\u05E8\u05EA \u05E7\u05D5\u05D1\u05E2\u05EA (\u05DE\u05D5\u05E4\u05D9\u05E2 \u05DC\u05E8\u05D5\u05D1 \u05D1\u05D7\u05DC\u05E7 \u05D3' \u05D0\u05D5 \u05D4' \u05EA\u05D7\u05EA \u05E0\u05EA\u05D5\u05E0\u05D9 \u05E7\u05D5\u05E4\u05D5\u05EA \u05D2\u05DE\u05DC).
- "nonInsuredSalary": \u05E9\u05DB\u05E8 \u05E9\u05D0\u05D9\u05E0\u05D5 \u05DE\u05D1\u05D5\u05D8\u05D7 \u05DC\u05E7\u05E6\u05D1\u05D4 (\u05DE\u05D5\u05E4\u05D9\u05E2 \u05DC\u05E2\u05D9\u05EA\u05D9\u05DD \u05DE\u05E4\u05D5\u05E8\u05E9\u05D5\u05EA \u05D0\u05D5 \u05D4\u05D4\u05E4\u05E8\u05E9 \u05D1\u05D9\u05DF \u05E9\u05D3\u05D4 158 \u05DC\u05E9\u05DB\u05E8 \u05D4\u05DE\u05D1\u05D5\u05D8\u05D7).
- "confidence": \u05D4\u05E2\u05E8\u05DB\u05EA \u05D0\u05D9\u05DB\u05D5\u05EA \u05D4\u05E7\u05E8\u05D9\u05D0\u05D4: "high" \u05D0\u05DD \u05D4\u05DE\u05E1\u05E4\u05E8\u05D9\u05DD \u05D5\u05D4\u05E9\u05D3\u05D5\u05EA \u05D6\u05D5\u05D4\u05D5 \u05D1\u05D1\u05D9\u05E8\u05D5\u05E8, "medium" \u05D0\u05DD \u05D7\u05DC\u05E7\u05DD \u05D6\u05D5\u05D4\u05D5, "low" \u05D0\u05DD \u05D4\u05EA\u05DE\u05D5\u05E0\u05D4 \u05DE\u05D8\u05D5\u05E9\u05D8\u05E9\u05EA.
- "notes": \u05D4\u05E2\u05E8\u05D5\u05EA \u05E7\u05E6\u05E8\u05D5\u05EA \u05D5\u05D1\u05E8\u05D5\u05E8\u05D5\u05EA \u05D1\u05E2\u05D1\u05E8\u05D9\u05EA \u05E2\u05DC \u05DE\u05D4 \u05E9\u05D6\u05D5\u05D4\u05D4 \u05D1\u05DE\u05E1\u05DE\u05DA (\u05DC\u05DE\u05E9\u05DC "\u05D6\u05D5\u05D4\u05D4 \u05D8\u05D5\u05E4\u05E1 106 \u05DC\u05E9\u05E0\u05EA 2024 \u05E9\u05DC \u05DE\u05E2\u05E1\u05D9\u05E7 X, \u05E9\u05DB\u05E8 158 \u05D5\u05DE\u05E1 042 \u05D6\u05D5\u05D4\u05D5 \u05D1\u05D4\u05E6\u05DC\u05D7\u05D4").`;
    const candidateModels = ["gemini-3.8-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];
    let lastError = null;
    let parsedData = null;
    for (const modelName of candidateModels) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          console.log(`Attempting Form 106 OCR with model: ${modelName} (attempt ${attempt})`);
          const response = await ai.models.generateContent({
            model: modelName,
            contents: {
              parts: [
                {
                  inlineData: {
                    data: cleanBase64,
                    mimeType: resolvedMime
                  }
                },
                { text: prompt }
              ]
            },
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  taxYear: { type: "INTEGER" },
                  employerName: { type: "STRING" },
                  employeeName: { type: "STRING" },
                  grossSalary: { type: "NUMBER" },
                  taxDeducted: { type: "NUMBER" },
                  creditPoints: { type: "NUMBER" },
                  pensionEmployee: { type: "NUMBER" },
                  pensionEmployer: { type: "NUMBER" },
                  section47Deduction: { type: "NUMBER" },
                  nationalInsuranceDeducted: { type: "NUMBER" },
                  insuredSalary: { type: "NUMBER" },
                  nonInsuredSalary: { type: "NUMBER" },
                  confidence: { type: "STRING" },
                  notes: { type: "STRING" }
                },
                required: ["grossSalary", "taxDeducted"]
              }
            }
          });
          const outputText = response.text || "{}";
          try {
            parsedData = JSON.parse(outputText);
          } catch {
            const cleaned = outputText.replace(/```json/g, "").replace(/```/g, "").trim();
            parsedData = JSON.parse(cleaned);
          }
          if (parsedData && (parsedData.grossSalary !== void 0 || parsedData.taxDeducted !== void 0)) {
            console.log(`OCR Successful using ${modelName}`);
            return res.json({ success: true, data: parsedData, modelUsed: modelName });
          }
        } catch (err) {
          const errObj = err;
          lastError = err instanceof Error ? err : new Error(String(err));
          console.warn(`Model ${modelName} attempt ${attempt} encountered error:`, errObj.message?.slice(0, 120));
          const isHighDemand = errObj.message?.includes("503") || errObj.message?.includes("high demand") || errObj.message?.includes("UNAVAILABLE") || errObj.message?.includes("429");
          if (isHighDemand) {
            await new Promise((r) => setTimeout(r, 1e3));
            break;
          }
        }
      }
    }
    if (!parsedData) {
      const isCapacityError = lastError?.message?.includes("503") || lastError?.message?.includes("high demand") || lastError?.message?.includes("UNAVAILABLE");
      const friendlyMessage = isCapacityError ? "\u05E2\u05D5\u05DE\u05E1 \u05D6\u05DE\u05E0\u05D9 \u05D1\u05E9\u05E8\u05EA \u05D4-AI \u05E9\u05DC \u05D2\u05D5\u05D2\u05DC. \u05DC\u05D7\u05E5 '\u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1' \u05DB\u05D3\u05D9 \u05DC\u05E0\u05E1\u05D5\u05EA \u05E9\u05E0\u05D9\u05EA." : lastError?.message || "\u05DC\u05D0 \u05D4\u05E6\u05DC\u05D7\u05E0\u05D5 \u05DC\u05E4\u05E2\u05E0\u05D7 \u05D0\u05EA \u05D4\u05D8\u05D5\u05E4\u05E1, \u05E0\u05E1\u05D4 \u05E9\u05D5\u05D1 \u05D0\u05D5 \u05D4\u05D6\u05DF \u05D9\u05D3\u05E0\u05D9\u05EA";
      return res.status(503).json({
        error: friendlyMessage,
        details: lastError?.message
      });
    }
  } catch (err) {
    console.error("Error analyzing Form 106:", err);
    const message = err instanceof Error ? err.message : "\u05E9\u05D2\u05D9\u05D0\u05D4 \u05D1\u05E0\u05D9\u05EA\u05D5\u05D7 \u05D4\u05DE\u05E1\u05DE\u05DA";
    res.status(500).json({ error: message });
  }
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
