from __future__ import annotations

import asyncio
import json
from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

app = FastAPI(title="Agent Review Console API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

EVIDENCE = [
    {"id": "enc", "control": "SEC-04", "status": "supported", "document": "Acme_SOC2_2026.pdf", "page": 34},
    {"id": "pam", "control": "IAM-07", "status": "supported", "document": "Security_Questionnaire.pdf", "page": 12},
    {"id": "dr", "control": "BCP-03", "status": "partial", "document": "Acme_SOC2_2026.pdf", "page": 71},
    {"id": "sub", "control": "TPRM-11", "status": "missing", "document": None, "page": None},
]

class DecisionRequest(BaseModel):
    run_id: str
    decision: Literal["Conditional approval confirmed", "Request evidence", "Recommendation overridden", "Rejected"]
    note: str | None = None

@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "mode": "demo", "version": "0.1.0"}

@app.get("/api/case")
def case() -> dict:
    return {
        "case_id": "TPR-2026-1842",
        "vendor": "Acme Payments GmbH",
        "synthetic": True,
        "evidence": EVIDENCE,
        "policy": "TPRM v2026.4",
    }

async def event_stream(mode: str, retry: bool = False):
    events = [
        (0.0, {"type": "run.started", "run_id": "run_API01", "mode": mode}),
        (0.08, {"type": "step.completed", "step": "ControlRetriever", "controls": 12, "duration_ms": 184}),
        (0.10, {"type": "step.completed", "step": "EvidenceFinder", "sources": 7, "spans": 9, "duration_ms": 821}),
    ]
    if mode == "degraded" and not retry:
        events = events[:2] + [
            (0.10, {"type": "evidence.partial", "items": EVIDENCE[:2]}),
            (0.10, {"type": "step.failed", "step": "EvidenceFinder", "error": "vendor_document_service_unavailable", "http_status": 503, "preserved": {"controls": 12, "evidence_items": 2}}),
            (0.0, {"type": "run.paused", "reason": "upstream_dependency_failure", "recommendation": None}),
        ]
    else:
        events += [
            (0.08, {"type": "step.completed", "step": "EvidenceAssessor", "supported": 8, "partial": 1, "missing": 3, "duration_ms": 642}),
            (0.08, {"type": "recommendation.proposed", "outcome": "Conditional approval", "confidence": 0.84, "final": False}),
            (0.0, {"type": "human_gate.required", "decision_right": "trained_reviewer"}),
        ]
    for delay, payload in events:
        await asyncio.sleep(delay)
        yield f"data: {json.dumps(payload)}\n\n"

@app.get("/api/stream")
async def stream(mode: Literal["golden", "degraded"] = Query("golden"), retry: bool = False):
    return StreamingResponse(event_stream(mode, retry), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})

@app.post("/api/decision")
def decision(request: DecisionRequest) -> dict:
    if not request.run_id.startswith("run_"):
        raise HTTPException(status_code=400, detail="invalid run id")
    return {
        "status": "finalized",
        "run_id": request.run_id,
        "actor": "human_reviewer_demo",
        "decision": request.decision,
        "prior_recommendation": "Conditional approval",
        "note": request.note,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "autonomous": False,
    }
