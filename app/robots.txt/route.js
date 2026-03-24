export async function GET() {
  const body = `User-agent: *
Allow: /

Sitemap: https://www.thedrydown.io/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}
