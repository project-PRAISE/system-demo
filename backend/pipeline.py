from model_config import (
    generation_config_extraction,
    generation_config_matching,
    generation_config_grouping,
    generation_config_heartbeat
)
import google.generativeai as genai
import json
import pandas as pd
from concurrent.futures import ThreadPoolExecutor
from prompts import (
    system_prompt_extract,
    system_prompt_match,
    grouping_prompt
)

# Initialize models
extraction_model = genai.GenerativeModel(
    model_name = "gemini-2.0-flash",
    generation_config = generation_config_extraction,
    system_instruction = system_prompt_extract
)

matching_model = genai.GenerativeModel(
    model_name = "gemini-2.0-flash",
    generation_config = generation_config_matching,
    system_instruction = system_prompt_match
)

grouping_model = genai.GenerativeModel(
    model_name = "gemini-2.0-flash",
    generation_config = generation_config_grouping,
    system_instruction = grouping_prompt
)

test_model = genai.GenerativeModel(
    model_name = "gemini-1.5-flash-8b",
    generation_config=generation_config_heartbeat
)

def check_heartbeat_status():
    """Check if API is responsive."""
    try:
        test_model.generate_content("test").text
    except Exception as e:
        return "heartbeat failed"
    return "heartbeat success"

def extract_factual_product_details(review):
    """Extract factual details from a product review."""
    try:
        response = extraction_model.generate_content(f"Extract factual product details from the review: \n{review}")
        return json.loads(response.text)
    except Exception as e:
        return {"error": str(e), "extracted_attributes": []}

def get_table_match(product_description, extracted_attributes):
    """Match extracted attributes against the seller description."""
    prompt = f"""
Seller Description:
{product_description}

Extracted Attributes:
{json.dumps(extracted_attributes)}"""
    try:
        response = matching_model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        return {"error": str(e), "result": []}

from prompts import grouping_prompt # Import the prompt

def group_attributes(attributes):
    """Group attributes into logical categories."""
    try:
        # Explicitly include the prompt in the content, like in run_exp.py
        response_text = grouping_model.generate_content(grouping_prompt + "\n\nattributes: " + str(attributes)).text

        # Robust parsing
        categories = {}
        if '<answer>' in response_text and '</answer>' in response_text:
            answer_part = response_text.split('<answer>', 1)[1].split('</answer>', 1)[0].strip()
            lines = answer_part.split('\n')
            for line in lines:
                if ':' in line:
                    parts = line.split(':', 1) # Split only on the first colon
                    attribute = parts[0].strip()
                    category = parts[1].strip()
                    if attribute: # Ensure attribute is not empty
                        categories[attribute] = category
                else:
                    print(f"Warning: Skipping malformed line in grouping response: {line}")
            if not categories:
                 print(f"Warning: Could not parse any categories from response: {response_text}")
                 # Optionally, return an error or default categories here
                 # return {"error": "Failed to parse categories from LLM response"}
            return categories
        else:
            print(f"Error: Could not find <answer> tags in grouping response: {response_text}")
            return {"error": "Invalid format from grouping model"}

    except Exception as e:
        print(f"Error during attribute grouping: {str(e)}") # Log the specific error
        return {"error": f"Failed during grouping: {str(e)}"}

def extract_review_attributes(reviews) -> list:
    """
    Step 1: Extract factual details from multiple product reviews.
    
    Args:
        reviews (list[str]): List of product reviews
        
    Returns:
        list: List of extracted attributes from each review
    """
    print("Starting attribute extraction...")
    with ThreadPoolExecutor(max_workers=15) as executor:
        responses = list(executor.map(lambda review: extract_factual_product_details(review), reviews))
    extracted_attributes = [resp.get('extracted_attributes', []) for resp in responses]
    print(f"Extracted attributes from {len(reviews)} reviews")
    return extracted_attributes

def match_with_description(seller_desc, extracted_attributes_list):
    """
    Step 2: Match extracted attributes against seller description.
    
    Args:
        seller_desc (str): The seller's product description
        extracted_attributes_list (list): List of extracted attributes from reviews
        
    Returns:
        list: Dataframes containing matched attributes
    """
    print("Starting attribute matching...")
    with ThreadPoolExecutor(max_workers=15) as executor:
        review_matchings = list(executor.map(
            lambda extracted_attribute: get_table_match(seller_desc, extracted_attribute), 
            extracted_attributes_list
        ))
    print("Attribute matching completed")
    
    # Create dataframes from matching results, ensuring one DF per review
    all_dataframes = []
    for resp in review_matchings:
        # Create DataFrame from 'result' list, or an empty list if 'result' is missing/empty
        # This ensures we have a DataFrame (potentially empty) for each review
        matched_data = resp.get('result', [])
        all_dataframes.append(pd.DataFrame(matched_data))

    return all_dataframes

def categorize_attributes(all_dataframes):
    """
    Step 3: Group attributes into logical categories.
    
    Args:
        all_dataframes (list): List of dataframes with matched attributes
        
    Returns:
        tuple: (categories dict, list of all unique attributes)
    """
    # Collect all attributes for grouping, handling empty/malformed DFs
    all_attributes = []
    for df in all_dataframes:
        if not df.empty and 'attribute' in df.columns: # Check if DF is valid
             # Ensure attributes are strings and handle potential NaN/None
            valid_attributes = df['attribute'].dropna().astype(str).unique()
            all_attributes.extend(valid_attributes)
        else:
            print(f"Warning: Skipping empty or malformed DataFrame in categorize_attributes.")

    all_attributes = list(set(all_attributes)) # Get unique attributes

    if not all_attributes:
        print("No attributes found in reviews")
        return {}, []
    
    print("Starting attribute grouping...")
    # Convert list of attributes to a string
    attribute_str = ", ".join(all_attributes)
    
    # Attempt grouping with retries
    max_attempts = 5
    categories = {}
    for attempt in range(max_attempts):
        try:
            categories = group_attributes(attribute_str)
            if isinstance(categories, dict) and not categories.get('error'):
                break
            print(f"Retry {attempt+1}/{max_attempts} for grouping")
        except Exception as e:
            print(f"Grouping attempt {attempt+1} failed: {str(e)}")
        
        if attempt == max_attempts - 1:
            print("Failed to group attributes after multiple attempts")
            categories = {attr: "uncategorized" for attr in all_attributes}
    
    return categories, all_attributes

def organize_results(all_dataframes, categories):
    """
    Step 4: Organize results by matching status and category.
    
    Args:
        all_dataframes (list): List of dataframes with matched attributes
        categories (dict): Mapping from attribute to category
        
    Returns:
        dict: Organized results by status and category
    """
    # Separate attributes by matching status
    missing = []
    matching = []
    contradictory = []
    partially_matching = []

    # --- Robust DataFrame Processing ---
    for i, df in enumerate(all_dataframes):
        if isinstance(df, pd.DataFrame) and not df.empty:
            # Check if 'status' column exists
            if 'status' in df.columns:
                try:
                    # Filter and extend safely
                    missing.extend(df[df['status'] == 'missing'].to_dict('records'))
                    matching.extend(df[df['status'] == 'matching'].to_dict('records'))
                    contradictory.extend(df[df['status'] == 'contradictory'].to_dict('records'))
                    partially_matching.extend(df[df['status'] == 'partially_matching'].to_dict('records'))
                except Exception as e:
                    print(f"Warning: Error processing DataFrame #{i} in organize_results: {str(e)}")
            else:
                 print(f"Warning: DataFrame #{i} missing 'status' column in organize_results.")
        # else: # Optional: Log if a non-dataframe or empty dataframe is encountered
        #    print(f"Warning: Skipping invalid or empty DataFrame #{i} in organize_results.")

    # --- Robust Category Application ---
    combined_items = missing + matching + contradictory + partially_matching
    for item in combined_items:
        # Check if item is a dict and has 'attribute' key
        if isinstance(item, dict) and 'attribute' in item:
            attr = item['attribute']
            # Check if categories is a dict and attr exists
            if isinstance(categories, dict) and attr in categories:
                 item['category'] = categories[attr]
            else:
                 item['category'] = "uncategorized"
                 if not isinstance(categories, dict):
                      print(f"Warning: 'categories' is not a dictionary in organize_results.")
                 elif attr not in categories:
                      print(f"Warning: Attribute '{attr}' not found in categories dict.")
        else:
             print(f"Warning: Skipping invalid item in category application: {item}")
             # Decide how to handle invalid items, e.g., assign default category or skip
             if isinstance(item, dict): item['category'] = "invalid_item"


    # Group by categories
    result = {
        "missing": {},
        "matching": {},
        "contradictory": {},
        "partially_matching": {}
    }
    
    # Organize by category
    for status, items in [("missing", missing), ("matching", matching), 
                        ("contradictory", contradictory), ("partially_matching", partially_matching)]:
        category_items = {}
        for item in items:
            category = item['category']
            if category not in category_items:
                category_items[category] = []
            category_items[category].append({k: v for k, v in item.items() if k != 'category'})
        result[status] = category_items
    
    return result

def complete_pipeline(seller_desc, reviews):
    """
    Complete product review analysis pipeline that calls each step in sequence.
    
    Args:
        seller_desc (str): The seller's product description
        reviews (list[str]): List of product reviews
        
    Returns:
        dict: Categorized product attributes with matching status
    """
    # Step 1: Extract factual details from reviews
    extracted_attributes = extract_review_attributes(reviews)
    
    # Step 2: Match extracted attributes with seller description
    all_dataframes = match_with_description(seller_desc, extracted_attributes)
    
    if not all_dataframes:
        print("No valid matching results found")
        return {}
    
    # Step 3: Group attributes by category
    categories, all_attributes = categorize_attributes(all_dataframes)
    
    if not all_attributes:
        return {}
    
    # Step 4: Organize results by category
    result = organize_results(all_dataframes, categories)
    
    print("Pipeline completed successfully")
    return result
