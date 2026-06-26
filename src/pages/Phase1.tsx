from __future__ import annotations
from typing import Optional
from pydantic import BaseModel


class KnowledgeNugget(BaseModel):
    type: str
    text: str
    source: str = ""
    rationale: str = ""
    color: str = "#EF4444"


class Phase1Data(BaseModel):
    id: Optional[str] = None
    brief_id: Optional[str] = None
    platform: Optional[str] = None
    niche: Optional[str] = None
    sub_niche: Optional[str] = None
    topic: Optional[str] = None
    viral_reference_url: Optional[str] = None
    copy_elements: Optional[list[str]] = None
    time_to_value: Optional[str] = None
    content_style: Optional[str] = None
    hook_text: Optional[str] = None
    knowledge_nuggets: Optional[list[KnowledgeNugget]] = None
    blacklist_words: Optional[list[str]] = None
    ai_generated: bool = False
    batch_id: Optional[str] = None
    production_date: Optional[str] = None
    on_camera_actor: Optional[str] = None
    brand_company: Optional[str] = None
    reference_description: Optional[str] = None
    selected_nugget_index: Optional[int] = None
    nugget_rationale: Optional[str] = None
    language: Optional[str] = None
    content_creator: Optional[str] = None
    number_of_actors: Optional[int] = None
    aspect_ratio: Optional[str] = None
    estimated_length: Optional[str] = None
    actor_brief: Optional[str] = None


class Phase1CreateRequest(BaseModel):
    platform: Optional[str] = None
    niche: Optional[str] = None
    sub_niche: Optional[str] = None
    topic: Optional[str] = None
    viral_reference_url: Optional[str] = None
    copy_elements: Optional[list[str]] = None
    time_to_value: Optional[str] = None
    content_style: Optional[str] = None
    hook_text: Optional[str] = None
    knowledge_nuggets: Optional[list[KnowledgeNugget]] = None
    blacklist_words: Optional[list[str]] = None
    ai_generated: Optional[bool] = None
    batch_id: Optional[str] = None
    production_date: Optional[str] = None
    on_camera_actor: Optional[str] = None
    brand_company: Optional[str] = None
    reference_description: Optional[str] = None
    selected_nugget_index: Optional[int] = None
    nugget_rationale: Optional[str] = None
    language: Optional[str] = None
    content_creator: Optional[str] = None
    number_of_actors: Optional[int] = None
    aspect_ratio: Optional[str] = None
    estimated_length: Optional[str] = None
    actor_brief: Optional[str] = None


class HookValidationRequest(BaseModel):
    hook_text: str


class HookValidationResponse(BaseModel):
    valid: bool
    score: int
    issues: list[str] = []
    suggestions: list[str] = []


class NuggetExtractionRequest(BaseModel):
    topic: str
    research_text: str = ""
