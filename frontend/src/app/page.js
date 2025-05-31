"use client";

import EmbeddingVisualizer from "../components/EmbeddingVisualizer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <EmbeddingVisualizer />
      </div>
    </main>
  );
}
