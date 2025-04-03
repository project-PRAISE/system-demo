from google.ai.generativelanguage_v1beta.types import content

generation_config_extraction = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_schema": content.Schema(
    type = content.Type.OBJECT,
    required = ["chain_of_thought", "discarded_opinions", "extracted_attributes"],
    properties = {
        "chain_of_thought": content.Schema(
            type = content.Type.STRING,
        ),
        "discarded_opinions": content.Schema(
            type = content.Type.ARRAY,
            items = content.Schema(
            type = content.Type.STRING,
            ),
        ),
        "extracted_attributes": content.Schema(
            type = content.Type.ARRAY,
            items = content.Schema(
            type = content.Type.OBJECT,
            required = ["attribute", "value"],
            properties = {
                "attribute": content.Schema(
                type = content.Type.STRING,
                ),
                "value": content.Schema(
                type = content.Type.STRING,
                ),
            },
            ),
        ),
    },
  ),
  "response_mime_type": "application/json",
}

generation_config_matching = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_schema": content.Schema(
    type = content.Type.OBJECT,
    required = ["reasoning", "result"],
    properties = {
        "reasoning": content.Schema(
            type = content.Type.STRING,
        ),
        "result": content.Schema(
            type = content.Type.ARRAY,
            items = content.Schema(
                type = content.Type.OBJECT,
                required = ["attribute", "value", "status", "evidence"],
                properties = {
                    "attribute": content.Schema(
                        type = content.Type.STRING, 
                    ),
                    "value": content.Schema(
                        type = content.Type.STRING,
                    ),
                    "status": content.Schema(
                        type = content.Type.STRING,
                    ),
                    "evidence": content.Schema(
                        type = content.Type.STRING,
                    ),
                },
            ),
        ),
    },
  ),
  "response_mime_type": "application/json",
}

generation_config_grouping = {
  "temperature": 0.4,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
}

generation_config_heartbeat = {
  "temperature": 0,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 1,
}
