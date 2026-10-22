export default function Home() {
  return (
    <main style={{ fontFamily: "sans-serif", maxWidth: 720, margin: "80px auto", padding: 24 }}>
      <h1>Formly API</h1>
      <p>Le backend Next.js fonctionne.</p>
      <p>Vérifie <a href="/api/health">/api/health</a> pour tester l’API.</p>
    </main>
  );
}
