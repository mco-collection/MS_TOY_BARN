#!/usr/bin/env python3
"""Back up verified Mercari image URLs into the MTB repository."""
import json
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
for batch in ("001","002","003","004"):
    manifest=ROOT/"migration"/f"waiting-batch-{batch}.json"
    if not manifest.exists(): continue
    doc=json.loads(manifest.read_text(encoding="utf-8"))
    changed=False
    for entry in doc.get("items",[]):
        urls=entry.get("photoUrls") or []
        if not urls: continue
        paths=[]
        for idx,source in enumerate(urls,1):
            if urlsplit(source).hostname!="static.mercdn.net":
                raise ValueError("Unexpected image host")
            target=ROOT/"migration"/"images"/f"{entry['sourceMercariId']}_{idx}.jpg"
            target.parent.mkdir(parents=True,exist_ok=True)
            if not target.is_file():
                url=source.replace("/item/detail/webp/photos/","/item/detail/orig/photos/")
                req=Request(url,headers={"User-Agent":"Mozilla/5.0"})
                with urlopen(req,timeout=25) as res: content=res.read(10_000_001)
                if len(content)>10_000_000 or not content.startswith(bytes([255,216,255])):
                    raise ValueError(f"Invalid JPEG for {entry['sourceMercariId']} photo {idx}")
                target.write_bytes(content)
            paths.append(str(target.relative_to(ROOT)).replace("\\\\","/"))
        entry["photoPaths"]=paths
        entry["photosBackedUp"]=True
        entry["migrationStatus"]="photos_backed_up"
        changed=True
    if changed: manifest.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
