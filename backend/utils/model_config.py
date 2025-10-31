"""
Model Configuration Utilities
Handles AI model parameter configuration based on model type
"""

from typing import Dict, Any, Optional


def get_default_params_for_model(model_id: str) -> Dict[str, Any]:
    """
    Get default parameters for a given AI model
    
    Args:
        model_id: Model identifier (e.g., 'openai/gpt-5')
        
    Returns:
        Dictionary of default parameters
    """
    model_lower = model_id.lower()
    
    # GPT-5 Models (New Responses API with verbosity/reasoning_effort)
    # GPT-5 does NOT use temperature - uses verbosity + reasoning_effort instead
    if 'gpt-5' in model_lower and 'mini' not in model_lower and 'oss' not in model_lower:
        return {
            "verbosity": "high",
            "reasoning_effort": "high",
            "max_tokens": 4000,
            "max_completion_tokens": 4000,
            "top_p": 0.9,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
    
    # GPT-5 Mini (No temperature)
    if 'gpt-5-mini' in model_lower:
        return {
            "verbosity": "medium",
            "reasoning_effort": "medium",
            "max_tokens": 4000,
            "max_completion_tokens": 4000,
            "top_p": 0.9
        }
    
    # o3 and o3-mini Reasoning Models (NO temperature, NO verbosity)
    if 'o3-mini' in model_lower:
        return {
            "reasoning_effort": "high",
            "max_completion_tokens": 4000,
            "max_tokens": 4000
        }
    
    if 'openai/o3' == model_lower or ('/o3' in model_lower and 'mini' not in model_lower):
        return {
            "reasoning_effort": "high",
            "max_completion_tokens": 8000,
            "max_tokens": 8000
        }
    
    # GPT-4.1 Models
    if 'gpt-4.1' in model_lower:
        return {
            "temperature": 0.7,
            "max_tokens": 4000,
            "top_p": 0.9
        }
    
    # GPT-OSS Models (Open Source)
    if 'gpt-oss' in model_lower:
        return {
            "temperature": 0.7,
            "max_tokens": 8000 if '120b' in model_lower else 4000,
            "top_p": 0.9
        }
    
    # Claude Models (all versions)
    if 'claude' in model_lower:
        return {
            "temperature": 0.7,
            "max_tokens": 4096,
            "max_completion_tokens": 4096,
            "top_p": 0.9,
            "top_k": 250,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
    
    # Gemini Models (uses max_output_tokens not max_tokens)
    if 'gemini' in model_lower:
        return {
            "temperature": 0.8,
            "max_output_tokens": 8192,
            "max_completion_tokens": 8192,
            "top_p": 0.95,
            "top_k": 40,
            "frequency_penalty": 0.0,
            "presence_penalty": 0.0
        }
    
    # Grok Models (xAI - with web search)
    if 'grok' in model_lower or 'x-ai' in model_lower:
        return {
            "temperature": 0.7,
            "max_tokens": 4000,
            "top_p": 0.9,
            "web_search": True  # Grok's unique feature
        }
    
    # MiniMax Models
    if 'minimax' in model_lower:
        return {
            "temperature": 0.7,
            "max_tokens": 4000,
            "top_p": 0.9
        }
    
    # Zhipu AI (GLM)
    if 'glm' in model_lower or 'z-ai' in model_lower:
        return {
            "temperature": 0.7,
            "max_tokens": 4000,
            "top_p": 0.9
        }
    
    # DeepSeek Models
    if 'deepseek' in model_lower:
        return {
            "temperature": 0.7,
            "max_tokens": 4000,
            "top_p": 0.9
        }
    
    # Qwen Models
    if 'qwen' in model_lower:
        return {
            "temperature": 0.7,
            "max_tokens": 8000,
            "top_p": 0.9,
            "repetition_penalty": 1.1
        }
    
    # Llama Models (Meta/Nvidia)
    if 'llama' in model_lower or 'nemotron' in model_lower:
        return {
            "temperature": 0.7,
            "max_tokens": 4000,
            "top_p": 0.9,
            "repetition_penalty": 1.1
        }
    
    # Mistral/Mixtral
    if 'mistral' in model_lower or 'mixtral' in model_lower:
        return {
            "temperature": 0.7,
            "max_tokens": 4000,
            "top_p": 0.9
        }
    
    # Default for unknown models
    return {
        "temperature": 0.7,
        "max_tokens": 4000,
        "max_completion_tokens": 4000,
        "top_p": 0.9,
        "frequency_penalty": 0.0,
        "presence_penalty": 0.0
    }


def validate_model_params(model_id: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and sanitize parameters for a given model
    
    Args:
        model_id: Model identifier
        params: User-provided parameters
        
    Returns:
        Validated parameters dictionary
    """
    model_lower = model_id.lower()
    validated = {}
    
    # Temperature validation (skip for reasoning models)
    if 'o3-mini' not in model_lower and 'qwq' not in model_lower:
        if 'temperature' in params:
            temp = float(params['temperature'])
            validated['temperature'] = max(0.0, min(2.0, temp))
    
    # Max tokens validation
    if 'max_tokens' in params:
        validated['max_tokens'] = max(1, min(32000, int(params['max_tokens'])))
    
    if 'max_output_tokens' in params:
        validated['max_output_tokens'] = max(1, min(32000, int(params['max_output_tokens'])))
    
    # Top-p validation
    if 'top_p' in params:
        validated['top_p'] = max(0.0, min(1.0, float(params['top_p'])))
    
    # Top-k validation (Claude/Gemini)
    if 'top_k' in params:
        validated['top_k'] = max(1, min(500, int(params['top_k'])))
    
    # GPT-5 specific parameters
    if 'verbosity' in params and params['verbosity'] in ['low', 'medium', 'high']:
        validated['verbosity'] = params['verbosity']
    
    if 'reasoning_effort' in params and params['reasoning_effort'] in ['minimal', 'low', 'medium', 'high']:
        validated['reasoning_effort'] = params['reasoning_effort']
    
    # Penalties
    if 'frequency_penalty' in params:
        validated['frequency_penalty'] = max(-2.0, min(2.0, float(params['frequency_penalty'])))
    
    if 'presence_penalty' in params:
        validated['presence_penalty'] = max(-2.0, min(2.0, float(params['presence_penalty'])))
    
    if 'repetition_penalty' in params:
        validated['repetition_penalty'] = max(0.0, min(2.0, float(params['repetition_penalty'])))
    
    # Grok-specific
    if 'web_search' in params and 'grok' in model_lower:
        validated['web_search'] = bool(params['web_search'])
    
    return validated


def merge_params_with_defaults(model_id: str, user_params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Merge user parameters with model defaults
    
    Args:
        model_id: Model identifier
        user_params: User-provided parameters (optional)
        
    Returns:
        Merged and validated parameters
    """
    defaults = get_default_params_for_model(model_id)
    
    if not user_params:
        return defaults
    
    # Merge user params over defaults
    merged = {**defaults, **user_params}
    
    # Validate the merged params
    return validate_model_params(model_id, merged)


def get_model_type(model_id: str) -> str:
    """
    Determine model type category
    
    Args:
        model_id: Model identifier
        
    Returns:
        Model type: 'gpt5-new', 'reasoning', 'claude', 'gemini', 'grok', 'standard'
    """
    model_lower = model_id.lower()
    
    # GPT-5 Models (no temperature, uses verbosity + reasoning_effort)
    if 'gpt-5' in model_lower and 'oss' not in model_lower:
        return 'gpt5-new'
    
    # Reasoning Models (no temperature, only reasoning_effort)
    if 'o3' in model_lower or 'qwq' in model_lower:
        return 'reasoning'
    
    if 'claude' in model_lower:
        return 'claude'
    
    if 'gemini' in model_lower:
        return 'gemini'
    
    if 'grok' in model_lower or 'x-ai' in model_lower:
        return 'grok'
    
    return 'standard'


# Parameter templates for UI
PARAMETER_TEMPLATES = {
    'gpt5-new': {
        'name': 'GPT-5 (No Temperature)',
        'supports_temperature': False,
        'supports_verbosity': True,
        'supports_reasoning_effort': True,
        'recommended': {
            'verbosity': 'high',
            'reasoning_effort': 'high',
            'max_tokens': 4000
        }
    },
    'reasoning': {
        'name': 'Reasoning Models (o3, QwQ)',
        'supports_temperature': False,
        'supports_verbosity': False,
        'supports_reasoning_effort': True,
        'recommended': {
            'reasoning_effort': 'high',
            'max_tokens': 4000
        }
    },
    'claude': {
        'name': 'Claude Models',
        'supports_temperature': True,
        'supports_top_k': True,
        'recommended': {
            'temperature': 0.7,
            'max_tokens': 4096,
            'top_p': 0.9,
            'top_k': 250
        }
    },
    'gemini': {
        'name': 'Gemini Models',
        'supports_temperature': True,
        'uses_max_output_tokens': True,
        'recommended': {
            'temperature': 0.8,
            'max_output_tokens': 8192,
            'top_p': 0.95,
            'top_k': 40
        }
    },
    'grok': {
        'name': 'Grok Models (xAI)',
        'supports_temperature': True,
        'supports_web_search': True,
        'recommended': {
            'temperature': 0.7,
            'max_tokens': 4000,
            'web_search': True
        }
    },
    'standard': {
        'name': 'Standard Models',
        'supports_temperature': True,
        'recommended': {
            'temperature': 0.7,
            'max_tokens': 4000,
            'top_p': 0.9
        }
    }
}

