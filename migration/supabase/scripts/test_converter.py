"""Synthetic-only safety tests; no production data or network."""
import sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from firestore_rest_to_jsonl import decode_value, extract_document
P = "projects/nutrio-app-jarvis-2025/databases/(default)/documents/"
doc = {"name": P + "allowed_students/student%40example.edu.vn",
       "createTime": "2026-05-11T01:02:03Z",
       "fields": {"active": {"booleanValue": True},
                  "count": {"integerValue": "12"},
                  "nested": {"mapValue": {"fields": {"a": {"arrayValue": {
                    "values": [{"doubleValue": 1.5}]}}}}},
                  "when": {"timestampValue": "2026-01-01T00:00:00Z"}}}
row = extract_document(doc)
assert row["document_id"] == "student%40example.edu.vn"
assert row["firestore_fields"]["active"] is True
assert row["firestore_fields"]["count"] == 12
assert row["firestore_fields"]["nested"]["a"] == [1.5]
assert row["firestore_fields"]["when"]["__firestore_type"] == "timestamp"
assert row["raw_firestore_document"] == doc
assert decode_value({"doubleValue": "NaN"}) == {"__firestore_type": "double", "value": "NaN"}
try:
    extract_document({"name": "projects/OTHER/databases/(default)/documents/foo/bar"})
except ValueError:
    pass
else:
    raise AssertionError("Foreign Firestore project was not rejected")
print("PASS: loss-preserving typed decode, paths, project boundary")
