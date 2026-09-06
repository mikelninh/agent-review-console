from api.index import EVIDENCE

MATERIAL_CONTROLS = {'SEC-04', 'IAM-07', 'BCP-03', 'TPRM-11'}

def test_material_controls_are_all_explicitly_assessed():
    assert {item['control'] for item in EVIDENCE} == MATERIAL_CONTROLS

def test_supported_and_partial_claims_have_provenance():
    for item in EVIDENCE:
        if item['status'] in {'supported', 'partial'}:
            assert item['document'], item
            assert isinstance(item['page'], int) and item['page'] > 0

def test_missing_evidence_is_not_mislabeled_supported():
    missing = [item for item in EVIDENCE if item['status'] == 'missing']
    assert missing
    assert all(item['document'] is None for item in missing)

def test_partial_evidence_is_not_promoted_to_supported():
    dr = next(item for item in EVIDENCE if item['control'] == 'BCP-03')
    assert dr['status'] == 'partial'
