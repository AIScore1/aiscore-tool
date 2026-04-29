export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  return Response.json({
    hasKey: !!apiKey,
    keyLength: apiKey?.length ?? 0,
    keyPrefix: apiKey?.substring(0, 20) ?? 'MISSING',
  });
}
