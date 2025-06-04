"use client";

function ControlPanel({
  config,
  onConfigChange,
  isProcessing,
  availableAttributes = [],
  selectedColorAttribute = null,
}) {
  const handleChange = (key, value) => {
    onConfigChange({ [key]: Number(value) });
  };

  const handleColorAttributeChange = (attributeName) => {
    onConfigChange({ colorAttribute: attributeName });
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h3 className="text-white font-semibold mb-4">Parameters</h3>

      <div className="space-y-4">
        {/* Color Control */}
        <div className="border-b border-slate-600 pb-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Color by Attribute
            </label>
            <select
              value={selectedColorAttribute || ""}
              onChange={(e) =>
                handleColorAttributeChange(e.target.value || null)
              }
              disabled={isProcessing}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Default (no coloring)</option>
              {availableAttributes.map((attr) => (
                <option key={attr} value={attr}>
                  {attr}
                </option>
              ))}
            </select>
            {selectedColorAttribute && (
              <p className="text-xs text-slate-400 mt-1">
                Coloring points by: {selectedColorAttribute}
              </p>
            )}
          </div>
        </div>

        {/* Embedding Manipulation Controls */}
        <div className="border-b border-slate-600 pb-4 mb-4">
          <h4 className="text-slate-200 font-medium mb-3 text-sm">
            Embedding Adjustments
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Language: {config.languageAdjustment}
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={config.languageAdjustment}
                onChange={(e) =>
                  handleChange("languageAdjustment", e.target.value)
                }
                disabled={isProcessing}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Increase emphasis</span>
                <span>Reduce emphasis</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Sentiment: {config.sentimentAdjustment}
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={config.sentimentAdjustment}
                onChange={(e) =>
                  handleChange("sentimentAdjustment", e.target.value)
                }
                disabled={isProcessing}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Increase emphasis</span>
                <span>Reduce emphasis</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bio: {config.bioAdjustment}
              </label>
              <input
                type="range"
                min="-2"
                max="2"
                step="0.1"
                value={config.bioAdjustment}
                onChange={(e) => handleChange("bioAdjustment", e.target.value)}
                disabled={isProcessing}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Increase emphasis</span>
                <span>Reduce emphasis</span>
              </div>
            </div>
          </div>
        </div>

        {/* UMAP Parameters */}
        <div>
          <h4 className="text-slate-200 font-medium mb-3 text-sm">
            UMAP Parameters
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                UMAP Neighbors: {config.umapNeighbors}
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={config.umapNeighbors}
                onChange={(e) => handleChange("umapNeighbors", e.target.value)}
                disabled={isProcessing}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                UMAP Min Distance: {config.umapMinDist}
              </label>
              <input
                type="range"
                min="0.01"
                max="1"
                step="0.01"
                value={config.umapMinDist}
                onChange={(e) => handleChange("umapMinDist", e.target.value)}
                disabled={isProcessing}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel;
