import ssl
from tcms_api.xmlrpc import TCMSXmlrpc

ssl._create_default_https_context = ssl._create_unverified_context


class KiwiService:
    def __init__(self):
        print("Connecting to Kiwi at https://localhost:8443/xml-rpc/...")
        try:
            self.rpc_impl = TCMSXmlrpc(
                "admin",
                "a646455547",
                "https://localhost:8443/xml-rpc/"
            )
            self.rpc_impl.login()
            self.rpc = self.rpc_impl.server
            print("Kiwi connected successfully!")
        except Exception as e:
            print(f"ERROR: Failed to connect to Kiwi: {type(e).__name__}: {e}")
            raise

    def get_products(self):
        return self.rpc.Product.filter({})

    def get_test_plans(self, product_id: int):
        return self.rpc.TestPlan.filter({"product": product_id})

    def get_categories(self, product_id: int):
        return self.rpc.Category.filter({"product": product_id})

    def get_test_cases(self, plan_id: int = None, category_id: int = None):
        query = {}
        if plan_id:
            query["plan"] = plan_id
        if category_id:
            query["category"] = category_id
        cases = self.rpc.TestCase.filter(query)
        return [self._format_test_case(case) for case in cases]

    def get_test_case(self, case_id: int):
        case = self.rpc.TestCase.filter({"id": case_id})[0]
        return self._format_test_case(case)
    
    def _format_test_case(self, case):
        formatted = {
            "id": case.get("id"),
            "summary": case.get("summary"),
            "category": case.get("category"),
            "priority": case.get("priority"),
            "case_status": case.get("case_status"),
            "is_automated": case.get("is_automated", False),
            "script": case.get("script", ""),
            "arguments": case.get("arguments", ""),
            "extra_link": case.get("extra_link"),
            "notes": case.get("notes", ""),
            "text": case.get("text", ""),
            "setup": case.get("setup", ""),
            "breakdown": case.get("breakdown", ""),
        }
        create_date = case.get("create_date")
        if create_date:
            if isinstance(create_date, dict) and "value" in create_date:
                formatted["create_date"] = create_date["value"]
            else:
                formatted["create_date"] = str(create_date)
        return formatted

    def create_test_case(self, case_data: dict):
        case = self.rpc.TestCase.create(case_data)
        return self._format_test_case(case)

    def update_test_case(self, case_id: int, case_data: dict):
        self.rpc.TestCase.update(case_id, case_data)
        case = self.rpc.TestCase.filter({"id": case_id})[0]
        return self._format_test_case(case)

    def delete_test_case(self, case_id: int):
        return self.rpc.TestCase.remove({'id': case_id})


kiwi_service = KiwiService()
