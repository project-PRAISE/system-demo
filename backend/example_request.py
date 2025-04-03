import requests
import json

heartbeat_api_url = "http://localhost:8000/heartbeat"

extraction_api_url = "http://localhost:8000/extract"
matching_api_url = "http://localhost:8000/match"
grouping_api_url = "http://localhost:8000/categorize"

complete_pipeline_api_url = "http://localhost:8000/full_pipeline"

payload = {
    "seller_description": "Fintie Slimshell Case for Kindle Paperwhite - The Thinnest and Lightest PU Leather Cover with Auto Sleep/Wake for all-new Amazon Kindle Paperwhite (Fits all 2012, 2013, 2015 and 2016 Versions), black - EKD0021AD-US",
    "reviews": [
        "Yes, I love this slimshell case. Sometime I worry because it does feel a bit slippery to hold. And I'll be curious to see how long it lasts. I bought a Fintie case in August 2013 for my first Kindle, and it held up really well. For reference, I've attached photos of both. The blue Fintie felt sturdier and stronger. As I said, we shall see!",
        "As pretty as it is functional. No sign of wear after almost 6 months of use.",
        "Its a real optical illusion! it looks so cute like a real small notebook, my 9 year old has been using it and the kindle is still safe!",
        "Lovely case. Very pretty. Works well.\r\n\r\nA piece broke off in the lower right corner 3 weeks after receipt.  I wonder how long before more of it breaks.",
        "I am in love with the design, I saw in the comments that someone asked if the 8th gen would work and someone responded it did so I ordered it. It Does NOT work it is way too big and the top doesn't completely shut?\r\n\r\nBut because I could not find any other \"heart\" design for a cover , I am keeping this one. I am still able to make it work and works well enough for what it's for, the kindle just doesn't \"snap in\"  as it should, and since it doesn't clip and hold the kindle it tends to slid a little.\r\n\r\nI just fell in love with this cover the moment I saw it.",
        "A very nice case.  Replaces my previous one which was falling apart after 3 years of active service.",
        "Nice, inexpensive alternative to the $40 official Kindle case",
    ]
}


try:
    response = requests.get(heartbeat_api_url)
    response.raise_for_status()

    extracted_attributes_response = requests.post(extraction_api_url, json=payload)
    extracted_attributes_response.raise_for_status()
    
    matching_response = requests.post(matching_api_url, json= {
        "seller_description": payload["seller_description"],
        "extracted_attributes": json.loads(extracted_attributes_response.content)['extracted_attributes']
    })
    matching_response.raise_for_status()
    all_dfs = json.loads(matching_response.content)['all_dataframes']
    
    final_response = requests.post(grouping_api_url, json= {
        "all_dataframes": all_dfs
    })
    final_response.raise_for_status()
    
    json.loads(final_response.content)
    print("Results:")
    print(json.dumps(final_response.json(), indent=2))

except requests.exceptions.HTTPError as err:
    print(f"HTTP Error: {err}")

except Exception as err:
    print(f"Error: {err}")
