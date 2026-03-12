const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 30;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    emotion: { type: 'string' },
    keywords: {
      type: 'array',
      items: { type: 'string' }
    },
    summary: { type: 'string' }
  },
  required: ['emotion', 'keywords', 'summary']
};

const buildPrompt = (text) => `Analyze the emotional tone of this journal entry and respond with strict JSON only. Use this schema: {"emotion":"string","keywords":["string"],"summary":"string"}. Keep keywords short and return 3 to 5 values. Journal entry: ${text}`;

const parseJsonResponse = (content) => {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('LLM response did not include JSON');
  }

  const parsed = JSON.parse(match[0]);
  return {
    emotion: parsed.emotion ?? 'reflective',
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 5) : [],
    summary: parsed.summary ?? 'No summary available.'
  };
};

const callOpenAICompatibleApi = async ({ apiKey, baseUrl, model, text }) => {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You analyze journal entries and must answer with valid JSON only.'
        },
        {
          role: 'user',
          content: buildPrompt(text)
        }
      ]
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${errorBody}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('LLM response content was empty');
  }

  return parseJsonResponse(content);
};

const callGeminiApi = async ({ apiKey, model, text }) => {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: buildPrompt(text) }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${errorBody}`);
  }

  const payload = await response.json();
  const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('Gemini response content was empty');
  }

  return parseJsonResponse(content);
};

const callOllamaApi = async ({ baseUrl, model, text }) => {
  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      prompt: buildPrompt(text),
      stream: false,
      format: 'json',
      options: {
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Ollama request failed: ${response.status} ${errorBody}`);
  }

  const payload = await response.json();
  const content = payload.response;

  if (!content) {
    throw new Error('Ollama response content was empty');
  }

  return parseJsonResponse(content);
};

const resolveProvider = () => {
  const preferredProvider = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (preferredProvider) {
    return [preferredProvider];
  }

  const providers = [];

  if (process.env.GROQ_API_KEY) {
    providers.push('groq');
  }
  if (process.env.GEMINI_API_KEY) {
    providers.push('gemini');
  }
  if (process.env.OPENAI_API_KEY) {
    providers.push('openai');
  }

  return providers;
};

const analyzeWithProvider = async (provider, text) => {
  switch (provider) {
    case 'gemini':
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      return callGeminiApi({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash-lite',
        text
      });
    case 'groq':
      if (!process.env.GROQ_API_KEY) {
        throw new Error('GROQ_API_KEY is not configured');
      }
      return callOpenAICompatibleApi({
        apiKey: process.env.GROQ_API_KEY,
        baseUrl: process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1',
        model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
        text
      });
    case 'openai':
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not configured');
      }
      return callOpenAICompatibleApi({
        apiKey: process.env.OPENAI_API_KEY,
        baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        text
      });
    case 'ollama':
      return callOllamaApi({
        baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL ?? 'gemma3:1b',
        text
      });
    default: {
      const error = new Error(`Unsupported LLM provider: ${provider}`);
      error.status = 500;
      throw error;
    }
  }
};

const analyzeJournalText = async (text) => {
  const normalizedText = text.trim();
  const cacheKey = normalizedText.toLowerCase();
  const cached = cache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.value, cached: true };
  }

  const providers = resolveProvider();
  if (providers.length === 0) {
    const error = new Error('No LLM provider configured. Set LLM_PROVIDER=groq, gemini, openai, or ollama and add the matching credentials.');
    error.status = 503;
    throw error;
  }

  const providerErrors = [];

  for (const provider of providers) {
    try {
      const analysis = await analyzeWithProvider(provider, normalizedText);
      const result = {
        ...analysis,
        provider
      };

      cache.set(cacheKey, {
        value: result,
        expiresAt: Date.now() + CACHE_TTL_MS
      });

      return { ...result, cached: false };
    } catch (error) {
      providerErrors.push(`${provider}: ${error.message}`);
    }
  }

  const failure = new Error(`All configured LLM providers failed. ${providerErrors.join(' | ')}`);
  failure.status = 503;
  throw failure;
};

export { analyzeJournalText };
