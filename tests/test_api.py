import json
from fastapi.testclient import TestClient
from api.index import app

client = TestClient(app)

def parse_sse(text: str):
    return [json.loads(line.removeprefix("data: ")) for line in text.splitlines() if line.startswith("data: ")]

def test_health_is_explicitly_demo_mode():
    response = client.get('/api/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok', 'mode': 'demo', 'version': '0.1.0'}

def test_golden_run_stops_at_human_gate():
    response = client.get('/api/stream?mode=golden')
    events = parse_sse(response.text)
    recommendation = next(e for e in events if e['type'] == 'recommendation.proposed')
    assert recommendation['final'] is False
    assert events[-1]['type'] == 'human_gate.required'

def test_degraded_run_preserves_partial_results_and_withholds_recommendation():
    response = client.get('/api/stream?mode=degraded')
    events = parse_sse(response.text)
    failed = next(e for e in events if e['type'] == 'step.failed')
    paused = events[-1]
    assert failed['preserved']['controls'] == 12
    assert failed['preserved']['evidence_items'] == 2
    assert paused['type'] == 'run.paused'
    assert paused['recommendation'] is None
    assert not any(e['type'] == 'recommendation.proposed' for e in events)

def test_human_decision_records_prior_recommendation():
    response = client.post('/api/decision', json={
        'run_id': 'run_7H3K92',
        'decision': 'Recommendation overridden',
        'note': 'Annual DR cadence not yet evidenced.'
    })
    body = response.json()
    assert response.status_code == 200
    assert body['autonomous'] is False
    assert body['prior_recommendation'] == 'Conditional approval'
    assert body['decision'] == 'Recommendation overridden'
