
import requests
import json

base_url = "http://localhost:8000"

print("=== Test 1: Get projects ===")
try:
    response = requests.get(f"{base_url}/api/hierarchy/projects")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")

print("\n=== Test 2: Get worksheets for project 1 ===")
try:
    response = requests.get(f"{base_url}/api/hierarchy/projects/1/worksheets")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")

print("\n=== Test 3: Get categories for project 1, worksheet 1 ===")
try:
    response = requests.get(f"{base_url}/api/hierarchy/projects/1/worksheets/1/categories")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")

print("\n=== Test 4: Get test cases (all) ===")
try:
    response = requests.get(f"{base_url}/api/testcases")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")

print("\n=== Test 5: Get test cases by category 1 ===")
try:
    response = requests.get(f"{base_url}/api/testcases", params={"category_id": 1})
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")

