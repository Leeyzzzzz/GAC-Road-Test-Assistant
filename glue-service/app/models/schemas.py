
from pydantic import BaseModel
from typing import Optional, List


class Project(BaseModel):
    id: int
    name: str
    description: Optional[str] = None


class Worksheet(BaseModel):
    id: int
    name: str
    description: Optional[str] = None


class Category(BaseModel):
    id: int
    name: str


class TestCase(BaseModel):
    id: int
    summary: str
    category: Optional[int] = None
    case_status: Optional[int] = None
    priority: Optional[int] = None
    is_automated: Optional[bool] = None
    script: Optional[str] = None
    arguments: Optional[str] = None
    extra_link: Optional[str] = None
    notes: Optional[str] = None
    text: Optional[str] = None
    setup: Optional[str] = None
    breakdown: Optional[str] = None


class TestCaseCreate(BaseModel):
    summary: str
    category: int
    case_status: Optional[int] = None
    priority: Optional[int] = None
    is_automated: Optional[bool] = None
    script: Optional[str] = None
    arguments: Optional[str] = None
    extra_link: Optional[str] = None
    notes: Optional[str] = None
    text: Optional[str] = None
    setup: Optional[str] = None
    breakdown: Optional[str] = None


class TestCaseUpdate(BaseModel):
    summary: Optional[str] = None
    category: Optional[int] = None
    case_status: Optional[int] = None
    priority: Optional[int] = None
    is_automated: Optional[bool] = None
    script: Optional[str] = None
    arguments: Optional[str] = None
    extra_link: Optional[str] = None
    notes: Optional[str] = None
    text: Optional[str] = None
    setup: Optional[str] = None
    breakdown: Optional[str] = None


class TestCaseDeleteRequest(BaseModel):
    ids: List[int]
