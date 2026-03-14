from fastapi import APIRouter, Query, HTTPException
from app.services.kiwi_service import kiwi_service
from app.models.schemas import TestCaseCreate, TestCaseUpdate, TestCaseDeleteRequest
import traceback

router = APIRouter(prefix="/api/testcases", tags=["TestCases"])


@router.get("")
async def get_test_cases(
    plan_id: int = Query(None, description="按测试计划筛选"),
    category_id: int = Query(None, description="按分类筛选")
):
    test_cases = kiwi_service.get_test_cases(plan_id=plan_id, category_id=category_id)
    return {
        "code": 0,
        "message": "success",
        "data": test_cases
    }


@router.get("/{case_id}")
async def get_test_case(case_id: int):
    try:
        test_case = kiwi_service.get_test_case(case_id)
        return {
            "code": 0,
            "message": "success",
            "data": test_case
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Test case {case_id} not found")


@router.post("")
async def create_test_case(case_data: TestCaseCreate):
    try:
        data = case_data.model_dump(exclude_none=True)
        print(f"[DEBUG] Received create data: {data}")
        new_case = kiwi_service.create_test_case(data)
        return {
            "code": 0,
            "message": "success",
            "data": new_case
        }
    except Exception as e:
        print(f"[ERROR] Create failed: {type(e).__name__}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{case_id}")
async def update_test_case(case_id: int, case_data: TestCaseUpdate):
    try:
        updated_case = kiwi_service.update_test_case(
            case_id,
            case_data.model_dump(exclude_none=True)
        )
        return {
            "code": 0,
            "message": "success",
            "data": updated_case
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{case_id}")
async def delete_test_case(case_id: int):
    try:
        kiwi_service.delete_test_case(case_id)
        return {
            "code": 0,
            "message": "success",
            "data": None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/batch-delete")
async def batch_delete_test_cases(request: TestCaseDeleteRequest):
    results = []
    for case_id in request.ids:
        try:
            kiwi_service.delete_test_case(case_id)
            results.append({"id": case_id, "success": True})
        except Exception as e:
            results.append({"id": case_id, "success": False, "error": str(e)})
    return {
        "code": 0,
        "message": "success",
        "data": results
    }
