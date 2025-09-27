import Mermaid from "@/components/ui/Mermaid";

export default function Home() {
  const knowledgeGraph = `
  graph TD
      Alice["Alice (Person)"] -->|knows| Bob["Bob (Person)"]
      Alice -->|works at| ACME["ACME Corp (Company)"]
      Bob -->|lives in| Paris["Paris (City)"]
      ACME -->|based in| Paris
      Alice -->|likes| AI["Artificial Intelligence (Field)"]
  `;  

  return (
    <main className="p-6 bg-white">
      <h1 className="text-xl font-bold mb-4">Mermaid Demo</h1>
      <Mermaid chart={knowledgeGraph} />
    </main>
  );
}
