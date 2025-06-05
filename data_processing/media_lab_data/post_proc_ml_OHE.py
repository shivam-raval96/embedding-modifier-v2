import pandas as pd

# -----------------------------------------------------------------------------
# 1) Load the labeled CSV from the previous step
# -----------------------------------------------------------------------------
input_csv = "media_lab_projects_labeled.csv"
df = pd.read_csv(input_csv)

# -----------------------------------------------------------------------------
# 2) List of dimension columns to one-hot encode
# -----------------------------------------------------------------------------
dimensions = [
    "Technology Focus",
    "Application Domain",
    "Stage of Development",
    "Collaboration Type",
    "Geographic Relevance",
    "Methodology Type",
    "Impact Level",
    "Emotional or Experiential Dimension"
]

# -----------------------------------------------------------------------------
# 3) For each dimension, create one-hot columns (as 0/1 ints) and drop the original column
# -----------------------------------------------------------------------------
for dim in dimensions:
    # Use get_dummies to one-hot encode, then cast to int
    dummies = pd.get_dummies(
        df[dim].fillna(""),            # fillna in case there are missing values
        prefix=dim,
        prefix_sep=": "
    ).astype(int)  # ensure 0/1 instead of True/False

    # Concatenate the new one-hot columns to the DataFrame
    df = pd.concat([df, dummies], axis=1)

    # Drop the original categorical column
    df.drop(columns=[dim], inplace=True)

# -----------------------------------------------------------------------------
# 4) Save the expanded DataFrame to a new CSV
# -----------------------------------------------------------------------------
output_csv = "media_lab_projects_onehot.csv"
df.to_csv(output_csv, index=False)

print(f"One-hot‐encoded CSV saved to: {output_csv}")
