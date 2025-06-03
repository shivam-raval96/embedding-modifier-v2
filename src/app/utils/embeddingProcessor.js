import { UMAP } from "umap-js";

export async function processEmbeddings(data, config) {
  const embeddings = data.map((d) => d.embedding);
  const texts = data.map((d) => d.text);

  // Apply embedding adjustments BEFORE UMAP reduction
  const adjustedEmbeddings = await adjustEmbeddings(embeddings, config);

  // Simulate UMAP reduction to 2D using adjusted embeddings
  const reduced2D = await realUMAP(adjustedEmbeddings, config);

  // Get available attributes for coloring (exclude embedding, text, id)
  const availableAttributes = getAvailableAttributes(data);

  return {
    processedData: data.map((item, i) => ({
      ...item,
      x: reduced2D[i][0],
      y: reduced2D[i][1],
      id: i,
    })),
    availableAttributes,
  };
}

function getAvailableAttributes(data) {
  if (!data || data.length === 0) return [];

  // Get all keys from the first item
  const allKeys = Object.keys(data[0]);

  // Filter out embedding, text, and id
  const excludedKeys = ["embedding", "text", "id"];
  const availableAttributes = allKeys.filter(
    (key) => !excludedKeys.includes(key)
  );

  return availableAttributes;
}

export function getColorByAttribute(data, attributeName) {
  if (!attributeName || !data || data.length === 0) {
    return data.map(() => 0); // Default color
  }

  const values = data.map((item) => item[attributeName]);

  // Check if the attribute contains numeric values
  const isNumeric = values.every(
    (val) => val !== null && val !== undefined && !isNaN(Number(val))
  );

  if (isNumeric) {
    // For numeric values, normalize to 0-1 range
    const numericValues = values.map((val) => Number(val));
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const range = max - min;

    if (range === 0) {
      return numericValues.map(() => 0);
    }

    return numericValues.map((val) => (val - min) / range);
  } else {
    // For categorical values, assign unique indices
    const uniqueValues = [...new Set(values)];
    const valueToIndex = {};
    uniqueValues.forEach((val, index) => {
      valueToIndex[val] = index / Math.max(1, uniqueValues.length - 1);
    });

    return values.map((val) => valueToIndex[val] || 0);
  }
}

export function getAttributeInfo(data, attributeName) {
  if (!attributeName || !data || data.length === 0) {
    return { type: "none", values: [] };
  }

  const values = data
    .map((item) => item[attributeName])
    .filter((val) => val !== null && val !== undefined);
  const isNumeric = values.every((val) => !isNaN(Number(val)));

  if (isNumeric) {
    const numericValues = values.map((val) => Number(val));
    return {
      type: "numeric",
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      values: numericValues,
    };
  } else {
    const uniqueValues = [...new Set(values)];
    return {
      type: "categorical",
      categories: uniqueValues,
      values: values,
    };
  }
}

async function realUMAP(embeddings, config) {
  const umap = new UMAP({
    nNeighbors: config.umapNeighbors,
    minDist: config.umapMinDist,
    nComponents: 2,
  });

  return await umap.fitAsync(embeddings);
}

async function adjustEmbeddings(embeddings, config) {
  // If no adjustments needed, return original embeddings
  if (config.languageAdjustment === 0 && config.sentimentAdjustment === 0) {
    return embeddings;
  }

  let adjustedEmbeddings = embeddings.map((emb) => [...emb]); // Deep copy

  // Load and apply language adjustment
  if (config.languageAdjustment !== 0) {
    const languageVector = await loadVector("data/language_vector.json");
    if (languageVector) {
      adjustedEmbeddings = projectOutDirection(
        adjustedEmbeddings,
        languageVector,
        config.languageAdjustment
      );
    } else {
      console.warn("Language vector not found, skipping language adjustment");
    }
  }

  // Load and apply sentiment adjustment
  if (config.sentimentAdjustment !== 0) {
    const sentimentVector = await loadVector("data/sentiment_vector.json");
    if (sentimentVector) {
      adjustedEmbeddings = projectOutDirection(
        adjustedEmbeddings,
        sentimentVector,
        config.sentimentAdjustment
      );
    } else {
      console.warn("Sentiment vector not found, skipping sentiment adjustment");
    }
  }

  return adjustedEmbeddings;
}

function projectOutDirection(data, steeringVector, strength) {
  /**
   * Remove the component of data along the steering vector direction
   *
   * @param {number[][]} data - Array of embeddings (n_samples, n_features)
   * @param {number[]} steeringVector - Steering vector (n_features) - will be unit normalized
   * @param {number} strength - Strength of the projection removal
   * @returns {number[][]} projected_data - Array with steering direction removed
   */

  // Ensure steering vector is unit normalized
  const norm = Math.sqrt(
    steeringVector.reduce((sum, val) => sum + val * val, 0)
  );
  if (norm === 0) {
    console.warn("Steering vector has zero norm, returning original data");
    return data;
  }

  const steeringUnit = steeringVector.map((val) => val / norm);

  // Compute projection coefficients for all points
  const projections = data.map((embedding) => {
    // Dot product: embedding · steering_unit
    return embedding.reduce(
      (sum, val, idx) => sum + val * steeringUnit[idx],
      0
    );
  });

  // Subtract the projection along steering direction
  const projectedData = data.map((embedding, i) => {
    const projection = projections[i];
    return embedding.map(
      (val, j) => val - strength * projection * steeringUnit[j]
    );
  });

  return projectedData;
}

// Helper function to load vector files
async function loadVector(filename) {
  try {
    const response = await fetch(filename);
    if (!response.ok) {
      throw new Error(`Failed to load ${filename}: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error loading vector ${filename}:`, error);
    return null;
  }
}
