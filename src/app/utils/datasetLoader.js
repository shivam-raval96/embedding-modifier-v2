const DATASETS = {
  data1: () => loadJSONDataset("./data/data1.json"),
  data2: () => loadJSONDataset("./data/data2.json"),
};

export async function loadDataset(datasetId) {
  if (!DATASETS[datasetId]) {
    throw new Error(`Dataset ${datasetId} not found`);
  }

  try {
    return await DATASETS[datasetId]();
  } catch (error) {
    console.warn(
      `Failed to load ${datasetId}, falling back to sample data:`,
      error
    );
    return generateSampleData();
  }
}

async function loadJSONDataset(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Validate data format
    if (!Array.isArray(data) || !data[0]?.embedding || !data[0]?.text) {
      throw new Error(
        "Invalid data format. Expected array with embedding and text fields."
      );
    }

    return data;
  } catch (error) {
    console.error(`Error loading dataset from ${path}:`, error);
    throw error;
  }
}
