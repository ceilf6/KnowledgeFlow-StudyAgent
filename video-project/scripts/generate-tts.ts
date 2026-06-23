import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { config } from 'dotenv';

config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://yunwu.ai/v1';
const SCRIPT_PATH = 'scripts/narration-script.txt';
const OUTPUT_PATH = 'assets/audio/narration.mp3';

async function main() {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set in .env');
  }

  mkdirSync('assets/audio', { recursive: true });
  const text = readFileSync(SCRIPT_PATH, 'utf-8').trim();
  console.log(`Generating TTS for ${text.length} chars of text...`);
  console.log(`Using API: ${OPENAI_BASE_URL}`);

  const response = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'nova',
      response_format: 'mp3',
      speed: 1.0,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`TTS API error ${response.status}: ${errText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(OUTPUT_PATH, buffer);
  console.log(`Saved: ${OUTPUT_PATH} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
