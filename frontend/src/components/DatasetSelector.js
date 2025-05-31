"use client";

export default function DatasetSelector({
  selectedDataset,
  onDatasetChange,
  isLoading,
}) {
  const datasets = [
    {
      id: "data1",
      name: "Eng-Fr texts train",
      description: "Some synthetic data",
    },
    {
      id: "data2",
      name: "Eng-Fr texts test",
      description: "Some synthetic data2.",
    },
  ];

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-4">Dataset Selection</h3>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Choose Dataset
        </label>

        <select
          value={selectedDataset}
          onChange={(e) => onDatasetChange(e.target.value)}
          disabled={isLoading}
          className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
        >
          {datasets.map((dataset) => (
            <option key={dataset.id} value={dataset.id}>
              {dataset.name}
            </option>
          ))}
        </select>

        {selectedDataset && (
          <div className="text-sm text-slate-400 mt-2">
            {datasets.find((d) => d.id === selectedDataset)?.description}
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-400 mt-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
            Loading dataset...
          </div>
        )}
      </div>
    </div>
  );
}
