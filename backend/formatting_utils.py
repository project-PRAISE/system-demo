import pandas as pd

def step1_markdown(extracted_attributes):
    markdown_output = """"""
    for i, review in enumerate(extracted_attributes):
        markdown_output += f"### Review {i+1}:\n\n"
        table = pd.DataFrame(review)
        table.columns = [col.capitalize() for col in table.columns]
        table = table.to_markdown(index=False)
        markdown_output += table + "\n\n"
        del table

    return markdown_output

def shorten_evidence(evidence):
    if len(evidence) > 75:
        return evidence[:75] + "..."
    return evidence

def step2_markdown(all_dfs):
    markdown_output = """"""
    # Define expected headers for consistency, even for empty tables
    headers = ["Attribute", "Evidence", "Status", "Value"]
    empty_table_markdown = "| " + " | ".join(headers) + " |\n" + "| " + " | ".join(["---"] * len(headers)) + " |\n"

    for i, df_data in enumerate(all_dfs):
        df = pd.DataFrame(df_data)
        markdown_output += f"### Review {i+1}:\n\n"

        if df.empty:
            # Append the predefined empty table markdown
            markdown_output += empty_table_markdown + "\n"
        else:
            # Ensure 'evidence' column exists before applying shorten_evidence
            if 'evidence' in df.columns:
                 # Handle potential None values in evidence before applying len()
                 df['evidence'] = df['evidence'].fillna('').astype(str).apply(shorten_evidence)
            else:
                 # Add empty evidence column if missing, maybe with None/NaN? Or empty string?
                 df['evidence'] = '' # Add empty evidence if column missing

            # Ensure all expected columns exist before capitalizing, add if missing
            for col in ['attribute', 'evidence', 'status', 'value']:
                 if col not in df.columns:
                      df[col] = '' # Or pd.NA or None depending on desired output

            # Capitalize columns that exist
            df.columns = [col.capitalize() for col in df.columns]

            # Select and reorder columns to match headers before converting to markdown
            # Use capitalized headers here
            df_markdown = df.reindex(columns=headers, fill_value='').to_markdown(index=False)
            markdown_output += df_markdown + "\n\n"

    return markdown_output

def step3_markdown(groups):
    markdown_output = """"""
    # Check if groups is a dictionary before iterating
    if not isinstance(groups, dict):
        print("Warning: step3_markdown received non-dict input for groups.")
        return "*Error: Invalid data format for categorization results.*\n"

    for key in groups.keys(): # e.g., 'missing', 'matching'
        markdown_output += f"## {str(key).capitalize()}\n\n" # Capitalize status, ensure key is string
        status_group = groups[key]

        # Check if the status group is a dictionary
        if isinstance(status_group, dict) and status_group:
            for category in status_group.keys(): # categories
                markdown_output += f"### {str(category).capitalize()}\n\n" # Capitalize category, ensure key is string
                category_data = status_group[category]

                # Check if category_data is a list and not empty
                if isinstance(category_data, list) and category_data:
                    try:
                        df = pd.DataFrame(category_data)
                        # Ensure DataFrame is not empty before proceeding
                        if not df.empty:
                            # Check if 'evidence' column exists before applying shorten_evidence
                            if 'evidence' in df.columns:
                                 # Handle potential None/NaN before applying len() in shorten_evidence
                                 df['evidence'] = df['evidence'].fillna('').astype(str).apply(shorten_evidence)
                            else:
                                 # Add empty evidence column if missing for consistent markdown output
                                 df['evidence'] = '' # Assign empty string

                            # Define expected columns (Capitalized) AFTER potential evidence creation
                            expected_cols = ['Attribute', 'Value', 'Evidence']

                            # Capitalize existing columns AFTER potentially adding 'evidence'
                            df.columns = [str(col).capitalize() for col in df.columns]
                            df.drop(columns=['Status'], inplace=True)
                            # Add any other missing expected columns and reorder
                            for col in expected_cols:
                                 if col not in df.columns:
                                      df[col] = '' # Add missing column with empty string

                            # Reindex to ensure order and include all expected columns
                            # Use capitalized expected_cols for reindexing
                            df_markdown = df.reindex(columns=expected_cols, fill_value='').to_markdown(index=False)
                            markdown_output += df_markdown + "\n\n"
                        else:
                             markdown_output += f"*No data found for {str(category).capitalize()} under {str(key).capitalize()}.*\n\n"

                    except Exception as e:
                        markdown_output += f"*Error generating table for {str(key).capitalize()}/{str(category).capitalize()}: {str(e)}*\n\n"
                        print(f"Error creating DataFrame/Markdown for {key}/{category}: {str(e)}")
                else:
                     markdown_output += f"*No data found for {str(category).capitalize()} under {str(key).capitalize()}.*\n\n" # Handle empty category data list
        else:
             markdown_output += f"*No categories found for {str(key).capitalize()}.*\n\n" # Handle empty or non-dict status group

        markdown_output += "---\n\n" # Separator after each status group

    return markdown_output