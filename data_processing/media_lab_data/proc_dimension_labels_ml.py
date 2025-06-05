import os
import json
import pandas as pd
import logging
from dotenv import load_dotenv
import openai
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# -----------------------------------------------------------------------------
# 1) Configure logging
# -----------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# 2) Load environment variables (OpenAI API key) from .env
# -----------------------------------------------------------------------------
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    logger.error("OPENAI_API_KEY not found in environment. Please add it to your .env file.")
    raise RuntimeError("OPENAI_API_KEY not found in environment.")

# -----------------------------------------------------------------------------
# 3) Load the Media Lab JSON file into a DataFrame
# -----------------------------------------------------------------------------
json_path = "allprojects_media_lab_102323_cleaned_public.json"
logger.info(f"Loading projects from {json_path}...")
with open(json_path, "r") as f:
    data = json.load(f)

df = pd.DataFrame(data["projects"])
logger.info(f"Loaded {len(df)} projects into DataFrame.")

# -----------------------------------------------------------------------------
# 4) Define the nine dimensions (with their allowed labels)
# -----------------------------------------------------------------------------
dimensions = {
    "Technology Focus": [
        "AI/ML",
        "Robotics & Automation",
        "Synthetic Biology",
        "Virtual/Augmented Reality",
        "IoT & Connected Devices",
        "Digital Fabrication",
        "Data Visualization & Interface Design",
    ],
    "Application Domain": [
        "Healthcare & Wellbeing",
        "Sustainability & Environment",
        "Urban Planning & Mobility",
        "Education & Learning",
        "Entertainment & Creative Arts",
        "Media & Communication",
        "Social Justice & Equity",
    ],
    "Stage of Development": [
        "Fundamental Research",
        "Exploratory Prototyping",
        "Advanced Prototyping",
        "Ready for Commercialization",
    ],
    "Collaboration Type": [
        "Academic-led",
        "Industry Partnership",
        "Community or Social Collaboration",
        "Interdisciplinary (cross-group, cross-departmental)",
    ],
    "Geographic Relevance": [
        "North America",
        "Europe",
        "Asia-Pacific",
        "Africa & Middle East",
        "Latin America",
        "Global / No specific geographic focus",
    ],
    "Methodology Type": [
        "Experimental",
        "Computational/Simulative",
        "Qualitative Research",
        "Quantitative Research",
        "Mixed Methods",
    ],
    "Impact Level": [
        "Individual Level (personal tech, user experience)",
        "Community Level (local impacts, small-scale adoption)",
        "Societal Level (large-scale systemic impacts)",
    ],
    "Emotional or Experiential Dimension": [
        "Playful / Exploratory",
        "Functional / Utilitarian",
        "Provocative / Critical",
        "Empowering / Inclusive",
    ],
}

# Create nine new columns (one per dimension) and initialize them as empty strings
for dim_name in dimensions:
    df[dim_name] = ""

# -----------------------------------------------------------------------------
# 5) Helper function to strip Markdown code fences if present
# -----------------------------------------------------------------------------
def strip_code_fences(text: str) -> str:
    """
    If `text` starts and ends with triple backticks, remove those lines.
    """
    lines = text.splitlines()
    if len(lines) >= 3 and lines[0].startswith("```") and lines[-1].startswith("```"):
        # Drop the first and last lines
        content_lines = lines[1:-1]
        return "\n".join(content_lines).strip()
    return text.strip()

# -----------------------------------------------------------------------------
# 6) Helper function to call GPT-4o for a single project
# -----------------------------------------------------------------------------
def label_project_with_gpt(project: dict) -> dict:
    """
    Given a single project dict (with at least 'title' and 'description'),
    calls GPT-4o and returns a dict mapping each dimension to one chosen label.
    If parsing fails, returns an empty dict.
    """
    title = project.get("title", "").strip().replace("\n", " ")
    description = project.get("description", "").strip().replace("\n", " ")

    prompt = (
        "You are given details about a Media Lab project. "
        "Please assign exactly one label for each of the following nine dimensions, "
        "using only the provided options. Return your answer as a JSON object "
        "with keys matching the dimension names.\n\n"
        f"Project Title: {title}\n"
        f"Project Description: {description}\n\n"
        "Dimensions and Options:\n"
    )

    for dim_name, options in dimensions.items():
        prompt += f"\n{dim_name}:\n"
        for opt in options:
            prompt += f"- {opt}\n"

    prompt += (
        "\nReturn your answer strictly in JSON format, e.g.:\n"
        "{\n"
        '  "Technology Focus": "AI/ML",\n'
        '  "Application Domain": "Healthcare & Wellbeing",\n'
        "  ...\n"
        "}\n"
    )

    try:
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a helpful assistant that classifies Media Lab projects "
                        "into predefined categories."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
        )
    except Exception as e:
        logger.error(f"OpenAI API Error for project '{title}': {e}")
        return {}

    # Extract the raw content (may include Markdown fences)
    raw_content = response.choices[0].message.content.strip()
    cleaned = strip_code_fences(raw_content)

    try:
        labels = json.loads(cleaned)
    except json.JSONDecodeError:
        logger.warning(
            f"Could not parse JSON response for project '{title}'.\n"
            f"Raw response was:\n{raw_content}"
        )
        return {}
    return labels

# -----------------------------------------------------------------------------
# 7) Worker wrapper to safely call label_project_with_gpt and catch errors
# -----------------------------------------------------------------------------
def worker(idx: int, project_row: pd.Series) -> (int, dict):
    """
    Called inside each thread. Takes the DataFrame index (idx)
    and the row (as a Series), converts it to a dict, calls GPT,
    and returns (idx, labels_dict). If there is an exception, returns (idx, {}).
    """
    project_dict = project_row.to_dict()
    try:
        labels = label_project_with_gpt(project_dict)
    except Exception as e:
        title = project_dict.get("title", "")
        logger.error(f"Exception labeling project at index {idx} (title: '{title}'): {e}")
        labels = {}
    return idx, labels

# -----------------------------------------------------------------------------
# 8) Parallelize across up to 100 workers
# -----------------------------------------------------------------------------
max_workers = 100
logger.info(f"Submitting {len(df)} projects to ThreadPoolExecutor with max_workers={max_workers}.")

with ThreadPoolExecutor(max_workers=max_workers) as executor:
    # Submit each row to the pool
    future_to_idx = {
        executor.submit(worker, idx, df.loc[idx]): idx
        for idx in df.index
    }
    futures = list(future_to_idx.keys())

    # As each future completes, write its labels into the DataFrame,
    # and show progress via tqdm.
    for future in tqdm(as_completed(futures),
                       total=len(futures),
                       desc="Labeling projects"):
        idx = future_to_idx[future]
        try:
            returned_idx, gpt_labels = future.result()
        except Exception as exc:
            logger.error(f"Index {idx} generated an exception: {exc}")
            gpt_labels = {}
            returned_idx = idx

        # Update the DataFrame for each dimension if GPT provided a label
        if isinstance(gpt_labels, dict):
            for dim_name in dimensions:
                if dim_name in gpt_labels:
                    df.at[returned_idx, dim_name] = gpt_labels[dim_name]

# -----------------------------------------------------------------------------
# 9) Save the updated DataFrame (with 9 new columns) to a CSV file
# -----------------------------------------------------------------------------
output_csv = "media_lab_projects_labeled_parallel.csv"
df.to_csv(output_csv, index=False)
logger.info(f"✅ Done! Labeled CSV saved to {output_csv}")
