from fastapi import APIRouter, Query
from app.services.kiwi_service import kiwi_service

router = APIRouter(prefix="/api", tags=["API"])


@router.get("/hierarchy/projects")
async def get_projects():
    products = kiwi_service.get_products()
    return {
        "code": 0,
        "message": "success",
        "data": [
            {
                "id": p["id"],
                "name": p["name"],
                "description": p.get("description", "")
            }
            for p in products
        ]
    }


@router.get("/hierarchy/projects/{project_id}/worksheets")
async def get_worksheets(project_id: int):
    test_plans = kiwi_service.get_test_plans(project_id)
    return {
        "code": 0,
        "message": "success",
        "data": [
            {
                "id": tp["id"],
                "name": tp["name"],
                "description": tp.get("text", "")
            }
            for tp in test_plans
        ]
    }


@router.get("/hierarchy/projects/{project_id}/worksheets/{worksheet_id}/categories")
async def get_categories(project_id: int, worksheet_id: int):
    categories = kiwi_service.get_categories(project_id)
    return {
        "code": 0,
        "message": "success",
        "data": [
            {
                "id": c["id"],
                "name": c["name"]
            }
            for c in categories
        ]
    }


@router.get("/kiwi/cases")
async def get_test_cases(category_id: int = Query(None)):
    test_cases = kiwi_service.get_test_cases(category_id=category_id)
    return {
        "code": 0,
        "message": "success",
        "data": test_cases
    }