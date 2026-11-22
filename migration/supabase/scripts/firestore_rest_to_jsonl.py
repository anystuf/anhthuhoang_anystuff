#!/usr/bin/env python3
"""Offline Firestore REST JSON -> JSONL. NO NETWORK, NO DATABASE WRITES.

Input: exported Firestore REST listDocuments response with `documents` array,
a list of Firestore REST documents, or one Firestore REST document. Keeps
original typed fields and document names for audit, including subcollection
paths. NEVER commit real exports, output JSONL, credentials, or research data.
"""
import argparse
from collections import Counter
import hashlib
import json
import pathlib
import sys

SOURCE_PROJECT = "nutrio-app-jarvis-2025"
REST_PREFIX = f"projects/{SOURCE_PROJECT}/databases/(default)/documents/"

def decode_value(v):
    if "nullValue" in v: return None
    if "stringValue" in v: return v["stringValue"]
    if "booleanValue" in v: return v["booleanValue"]
    if "integerValue" in v: return int(v["integerValue"])
    if "doubleValue" in v:
        value = v["doubleValue"]
        if str(value) in ("NaN", "Infinity", "-Infinity"):
            return {"__firestore_type": "double", "value": str(value)}
        return float(value)
    if "timestampValue" in v:
        return {"__firestore_type": "timestamp", "iso": v["timestampValue"]}
    if "referenceValue" in v:
        return {"__firestore_type": "reference", "path": v["referenceValue"]}
    if "bytesValue" in v:
        return {"__firestore_type": "bytes", "base64": v["bytesValue"]}
    if "geoPointValue" in v:
        return {"__firestore_type": "geo_point", **v["geoPointValue"]}
    if "arrayValue" in v:
        return [decode_value(x) for x in v["arrayValue"].get("values", [])]
    if "mapValue" in v:
        return {k: decode_value(x) for k, x in v["mapValue"].get("fields", {}).items()}
    raise ValueError("Unknown Firestore typed value; refusing a lossy conversion")

def extract_document(doc):
    name = doc.get("name", "")
    if not name.startswith(REST_PREFIX):
        raise ValueError("Source document belongs to unexpected Firebase project/database")
    path = name[len(REST_PREFIX):]
    parts = path.split("/")
    if len(parts) < 2 or len(parts) % 2 or any(not p for p in parts):
        raise ValueError("Invalid Firestore document path")
    fields = {k: decode_value(v) for k, v in doc.get("fields", {}).items()}
    return {
        "source_project": SOURCE_PROJECT,
        "firestore_path": path,
        "collection_path": "/".join(parts[:-1]),
        "document_id": parts[-1],
        "firestore_fields": fields,
        "raw_firestore_document": doc,
        "firestore_create_time": doc.get("createTime"),
        "firestore_update_time": doc.get("updateTime")
    }

def load_docs(path):
    with path.open("r", encoding="utf-8") as stream:
        data = json.load(stream)
    if isinstance(data, list): return data
    if isinstance(data, dict) and "documents" in data:
        if data.get("nextPageToken"):
            raise ValueError("Export is paginated: complete ALL pages before conversion")
        return data["documents"]
    if isinstance(data, dict) and "name" in data:
        return [data]
    if isinstance(data, dict) and not data:
        return []
    raise ValueError("Input must be a list or Firestore REST listDocuments JSON")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=pathlib.Path)
    parser.add_argument("output", type=pathlib.Path)
    args = parser.parse_args()
    if args.input.resolve() == args.output.resolve():
        parser.error("Input and output paths must differ")
    rows = [extract_document(d) for d in load_docs(args.input)]
    paths = [row["firestore_path"] for row in rows]
    if len(paths) != len(set(paths)):
        parser.error("Duplicate Firestore document paths in input")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8", newline="\n") as stream:
        for row in rows:
            stream.write(json.dumps(row, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n")
    counts = dict(Counter(r["collection_path"] for r in rows))
    digest = hashlib.sha256(args.output.read_bytes()).hexdigest()
    print(json.dumps({"imported_to_supabase": False, "converted": len(rows),
                      "collections": counts, "output_sha256": digest},
                     indent=2, ensure_ascii=False))
    print("PRIVATE DATA: do not upload exports or JSONL to public GitHub.", file=sys.stderr)

if __name__ == "__main__":
    main()
