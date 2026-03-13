'use client';

export default function DeveloperPage() {
  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-900 text-lg">Kyozo API</span>
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">v1</span>
        </div>
        <a
          href="/api/v1/openapi.json"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-purple-600 font-mono"
        >
          openapi.json ↗
        </a>
      </header>
      <div className="flex-1 overflow-hidden">
        <SwaggerFrame />
      </div>
    </div>
  );
}

function SwaggerFrame() {
  return (
    <iframe
      srcDoc={`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>KyozoVerse API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
  <style>
    body { margin: 0; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #7c3aed; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/v1/openapi.json',
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
      layout: 'BaseLayout',
      deepLinking: true,
      tryItOutEnabled: true,
      persistAuthorization: true,
    });
  </script>
</body>
</html>`}
      className="w-full h-full border-0"
      title="KyozoVerse API Documentation"
    />
  );
}
