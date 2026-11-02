"""Import the supplied CSV and reconcile it with its KML companion.

Usage: python scripts/import-destinations.py source.csv source.kml
No coordinates are inferred for research leads.
"""
import csv
import hashlib
import json
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

csv_path, kml_path = map(Path, sys.argv[1:3])
with csv_path.open(encoding="utf-8-sig", newline="") as source:
    rows = list(csv.DictReader(source))
ns = {"k": "http://www.opengis.net/kml/2.2"}
kml_rows = []
for placemark in ET.parse(kml_path).findall(".//k:Placemark", ns):
    kml_rows.append({item.attrib["name"]: item.findtext("k:value", "", ns)
                     for item in placemark.findall("k:ExtendedData/k:Data", ns)})
if len(rows) != len(kml_rows):
    raise ValueError("CSV/KML entry counts disagree")
kml_by_name = {row["name"]: row for row in kml_rows}
destinations = []
for index, row in enumerate(rows, 1):
    if row["name"] not in kml_by_name:
        raise ValueError("KML is missing " + row["name"])
    for key, value in row.items():
        if kml_by_name[row["name"]].get(key, "") != value:
            raise ValueError("CSV/KML disagreement: " + row["name"] + " / " + key)
    lat = float(row["latitude"]) if row["latitude"] else None
    lon = float(row["longitude"]) if row["longitude"] else None
    if (lat is None) != (lon is None) or (lat is not None and not (-90 <= lat <= 90 and -180 <= lon <= 180)):
        raise ValueError("Invalid coordinate pair: " + row["name"])
    destinations.append({"id": "alberta-" + hashlib.sha256(row["name"].encode("utf-8")).hexdigest()[:12], "name": row["name"],
        "category": row["category"], "region": row["region"], "access": row["access_status"],
        "lat": lat, "lon": lon, "confidence": row["coordinate_confidence"],
        "approach": row["approach_reference"], "hikeDistance": row["hike_distance"],
        "source": row["source"], "mapLink": row["map_link"], "gpsStatus": row["gps_status"],
        "precision": row["map_precision"], "display": row["map_display"],
        "overnight": row["overnight_note"], "provenance": "User-supplied CSV reconciled with KML; source claims not independently reverified"})
result = {"format": "trailbound-destinations", "version": 1,
    "sourceFiles": [{"name": p.name, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()}
                    for p in (csv_path, kml_path)], "destinations": destinations}
output = Path(__file__).resolve().parent.parent / "public/data/destinations.json"
output.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print(json.dumps({"entries": len(destinations), "mapped": sum(d["lat"] is not None for d in destinations), "reconciled": True}))
