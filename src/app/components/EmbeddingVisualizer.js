// components/EmbeddingVisualizer.js
"use client";

import { useState, useEffect, useRef } from "react";
import ScatterPlot from "./ScatterPlot";
import ControlPanel from "./ControlPanel";
import DatasetSelector from "./DatasetSelector";
import { processEmbeddings } from "../utils/embeddingProcessor";
import { loadDataset } from "../utils/datasetLoader";

export default function EmbeddingVisualizer() {
  const [data, setData] = useState(null);
  const [processedData, setProcessedData] = useState(null);
  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState("data_mit");
  const [config, setConfig] = useState({
    umapNeighbors: 15,
    umapMinDist: 0.1,
    colorAttribute: null,
    languageAdjustment: 0,
    sentimentAdjustment: 0,
    bioAdjustment: 0,
  });

  const onConfigChange = (changes) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      ...changes,
    }));
  };

  useEffect(() => {
    // Load default dataset on mount
    loadSelectedDataset("data_mit");
  }, []);

  useEffect(() => {
    if (data) {
      processData();
    }
  }, [
    data,
    config.umapNeighbors,
    config.umapMinDist,
    config.languageAdjustment,
    config.sentimentAdjustment,
    config.bioAdjustment,
  ]);

  const processData = async () => {
    if (!data) return;

    setIsProcessing(true);
    try {
      const result = await processEmbeddings(data, config);
      // Handle the new return format from processEmbeddings
      if (result.processedData && result.availableAttributes) {
        setProcessedData(result.processedData);
        setAvailableAttributes(result.availableAttributes);
      } else {
        // Fallback for old format
        setProcessedData(result);
        setAvailableAttributes([]);
      }
    } catch (error) {
      console.error("Error processing data:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSelectedDataset = async (datasetName) => {
    setIsProcessing(true);
    try {
      const newData = await loadDataset(datasetName);
      setData(newData);
      setSelectedPoints([]);
      setSelectedDataset(datasetName);
    } catch (error) {
      console.error("Error loading dataset:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-1">
            Embedding Visual Modifier
          </h1>
          <p className="text-slate-600 text-sm mb-4">
            Modify the embeddings based on concepts
          </p>
        </div>

        <DatasetSelector
          selectedDataset={selectedDataset}
          onDatasetChange={loadSelectedDataset}
          isLoading={isProcessing}
        />

        <ControlPanel
          config={config}
          onConfigChange={onConfigChange}
          isProcessing={isProcessing}
          availableAttributes={availableAttributes}
          selectedColorAttribute={config.colorAttribute}
        />

        {selectedPoints.length > 0 && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-slate-800 font-semibold mb-3">
              Selected Points ({selectedPoints.length})
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-2 custom-scrollbar">
              {selectedPoints.map((point, idx) => (
                <div
                  key={idx}
                  className="text-sm text-slate-700 p-2 bg-white rounded border border-slate-200"
                >
                  <div className="font-medium">
                    {point.text?.substring(0, 50)}...
                  </div>
                  <div className="text-xs text-slate-500">
                    {config.colorAttribute && point[config.colorAttribute] && (
                      <>
                        {config.colorAttribute}: {point[config.colorAttribute]}{" "}
                        |{" "}
                      </>
                    )}
                    ID: {point.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-3">
        <div className="bg-white rounded-lg border-2 border-black overflow-hidden">
          {isProcessing ? (
            <div className="h-96 flex items-center justify-center bg-white">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-slate-700">Processing embeddings...</p>
              </div>
            </div>
          ) : processedData ? (
            <ScatterPlot
              data={processedData}
              colorAttribute={config.colorAttribute}
              onSelectionChange={setSelectedPoints}
            />
          ) : (
            <div className="h-96 flex items-center justify-center text-slate-500 bg-white">
              Select a dataset to begin visualization
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
