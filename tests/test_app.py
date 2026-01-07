import copy
import pytest
from fastapi.testclient import TestClient

import src.app as app_module

client = TestClient(app_module.app)

# snapshot of initial activities to restore before each test
_original_activities = copy.deepcopy(app_module.activities)

@pytest.fixture(autouse=True)
def reset_activities():
    # restore original in-memory DB before each test
    app_module.activities = copy.deepcopy(_original_activities)
    yield


def test_get_activities():
    res = client.get('/activities')
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    assert 'Chess Club' in data
    assert 'participants' in data['Chess Club']


def test_signup_and_unregister_flow():
    activity = 'Basketball Team'
    email = 'test_user@example.com'

    # ensure user not already present
    res = client.get('/activities')
    assert res.status_code == 200
    assert email not in res.json()[activity]['participants']

    # sign up
    res = client.post(f"/activities/{activity}/signup?email={email}")
    assert res.status_code == 200
    assert f"Signed up {email} for {activity}" in res.json().get('message', '')

    # confirm present
    res = client.get('/activities')
    assert email in res.json()[activity]['participants']

    # unregister
    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 200
    assert f"Unregistered {email} from {activity}" in res.json().get('message', '')

    # confirm removed
    res = client.get('/activities')
    assert email not in res.json()[activity]['participants']


def test_signup_already_registered():
    activity = 'Chess Club'
    # pick an existing participant
    existing = app_module.activities[activity]['participants'][0]

    res = client.post(f"/activities/{activity}/signup?email={existing}")
    assert res.status_code == 400
    assert 'Student already signed up' in res.json().get('detail', '')


def test_unregister_not_registered():
    activity = 'Gym Class'
    email = 'nonexistent@example.com'

    res = client.delete(f"/activities/{activity}/participants?email={email}")
    assert res.status_code == 404
    assert 'Student not registered' in res.json().get('detail', '')
