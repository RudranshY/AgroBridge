// server/services/cropPredictorServices.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios"); // kept for any auxiliary calls

// local simple fallback predictor (keeps the feature usable without Gemini)
function localPredictor(soil, altitude, temp, humidity, rainfall) {
  const s = (soil || "").toLowerCase();
  const a = Number(altitude); // assume same unit your controller uses (document it)
  const t = Number(temp);
  const h = Number(humidity);
  const r = Number(rainfall);

  const crops = [];

  if (s.includes("clay") || s.includes("loam") || s.includes("alluvial")) {
    if (t >= 20 && t <= 35 && r >= 800) crops.push("Rice");
    if (t >= 10 && t <= 25 && r >= 400 && r < 800) crops.push("Wheat");
  }

  if (s.includes("sandy")) {
    if (t >= 25 && r < 700) crops.push("Millet", "Groundnut");
  }

  if (s.includes("loam")) {
    crops.push("Maize", "Vegetables");
  }

  if (a > 1500) {
    crops.push("Potato");
  }

  if (crops.length === 0) {
    crops.push("Maize", "Millet", "Vegetables");
  }

  const uniq = [...new Set(crops)].slice(0, 6);
  return `Local fallback suggestions: ${uniq.join(", ")}. (Enable GEMINI_API_KEY for AI-based predictions.)`;
}

/**
 * Use Google Generative AI SDK to call model.  
 * The SDK returns model outputs in various shapes; we attempt to extract JSON or text.
 */
async function callGemini(soil, altitude, temp, humidity, rainfall) {
  // must have API key configured
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set");
  }

  // initialize client (the SDK expects the API key env var; passing it again is optional)
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  // choose model name. `gemini-pro` might require billing/whitelisting.
  // You can override with GEMINI_MODEL env var if needed.
  const modelName = process.env.GEMINI_MODEL || "gemini-pro";

  const model = genAI.getGenerativeModel({ model: modelName });

  // Compose a prompt that explicitly requests strict JSON array of objects.
  // This increases chance we can parse the model output reliably.
  const prompt = `
You are an expert agronomist. Given the inputs below, return a JSON array of up to 6 objects.
Each object must be exactly: {"crop":"<crop name>","reason":"<one line reason why it's suitable>"}
Return JSON only, no extra explanation or text.

Inputs:
Soil: ${soil}
Altitude: ${altitude}
Temperature (°C): ${temp}
Humidity (%): ${humidity}
Rainfall (mm/year): ${rainfall}

Constraints:
- JSON only (no commentary)
- Use crop common names (e.g. "Rice", "Wheat", "Maize", "Millet")
- Provide brief one-line reasons
`;

  // call model (adjust generate API usage depending on SDK version)
  const result = await model.generateContent(prompt, {
    temperature: 0.2,
    maxOutputTokens: 400,
  });

  // depending on SDK/versions, result.response may be a promise or immediate object
  // the SDK usually provides a .response() or .text() method — check your installed version.
  const response = await result.response;
  let text = "";
  try {
    // the SDK may present different shapes; try common variants
    if (typeof response.text === "function") {
      text = response.text();
    } else if (response.output && Array.isArray(response.output)) {
      // some outputs include output[0].content or similar
      text = response.output.map(o => (o.content || JSON.stringify(o))).join("\n");
    } else if (response.candidates && response.candidates.length > 0) {
      text = response.candidates.map(c => c.output || c.content || JSON.stringify(c)).join("\n");
    } else {
      text = JSON.stringify(response);
    }
  } catch (err) {
    text = String(response);
  }

  // Try to extract JSON substring and parse it
  try {
    const start = text.indexOf("[");
    const end = text.lastIndexOf("]");
    if (start !== -1 && end !== -1 && end > start) {
      const maybeJson = text.slice(start, end + 1);
      const parsed = JSON.parse(maybeJson);
      // convert parsed array to friendly string
      if (Array.isArray(parsed)) {
        return parsed.map(p => `${p.crop}: ${p.reason}`).join("; ");
      } else {
        return JSON.stringify(parsed);
      }
    } else {
      // If no JSON found, return the raw text
      return text.trim();
    }
  } catch (err) {
    // parsing failed — return raw text
    console.error("Failed to parse Gemini output as JSON:", err.message || err);
    return text.trim();
  }
}

/**
 * Main exported service
 */
async function cropPredictorServices(soil, altitude, temperature, humidity, rainfall) {
  // Basic validation: ensure presence and numeric ranges
  if (!soil || altitude == null || temperature == null || humidity == null || rainfall == null) {
    throw new Error("Missing parameters");
  }
  const altitudeNum = Number(altitude);
  const temperatureNum = Number(temperature);
  const humidityNum = Number(humidity);
  const rainfallNum = Number(rainfall);

  if (
    Number.isNaN(altitudeNum) ||
    Number.isNaN(temperatureNum) ||
    Number.isNaN(humidityNum) ||
    Number.isNaN(rainfallNum)
  ) {
    throw new Error("Invalid numeric parameters");
  }

  // If GEMINI key present, try AI; otherwise fallback
  if (process.env.GEMINI_API_KEY) {
    try {
      const aiResult = await callGemini(soil, altitudeNum, temperatureNum, humidityNum, rainfallNum);
      return aiResult;
    } catch (err) {
      console.error("Gemini call failed:", err.message || err);
      return localPredictor(soil, altitudeNum, temperatureNum, humidityNum, rainfallNum);
    }
  } else {
    return localPredictor(soil, altitudeNum, temperatureNum, humidityNum, rainfallNum);
  }
}

module.exports = { cropPredictorServices };


