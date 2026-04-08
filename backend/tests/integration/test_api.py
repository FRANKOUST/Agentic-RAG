from __future__ import annotations

from fastapi.testclient import TestClient

from backend.app.main import create_app


def test_static_assets_are_served_under_static_prefix(data_dir):
    app = create_app(data_dir=data_dir, demo_pdf_path=None)
    client = TestClient(app)

    assert client.get('/').status_code == 200
    assert client.get('/static/styles.css').status_code == 200
    assert client.get('/static/app.js').status_code == 200


def test_chat_api_round_trip(data_dir):
    app = create_app(data_dir=data_dir, demo_pdf_path=None)
    client = TestClient(app)

    assert client.get('/').status_code == 200
    assert client.get('/styles.css').status_code == 200
    assert client.get('/app.js').status_code == 200

    reindex = client.post('/api/knowledge/reindex')
    assert reindex.status_code == 200

    session_response = client.post('/api/sessions', json={'title': 'Nike demo'})
    assert session_response.status_code == 201
    session_id = session_response.json()['session_id']

    chat_response = client.post(
        '/api/chat',
        json={
            'session_id': session_id,
            'message': "What were Nike's total revenues in fiscal 2023?",
            'mode': 'two-step',
            'search_mode': 'balanced',
            'stream': False,
        },
    )
    assert chat_response.status_code == 200
    payload = chat_response.json()
    assert payload['mode'] == 'two-step'
    assert payload['sources']

    sessions = client.get('/api/sessions')
    assert sessions.status_code == 200
    assert sessions.json()

    messages = client.get(f"/api/sessions/{session_id}/messages")
    assert messages.status_code == 200
    assert len(messages.json()) >= 2

    documents = client.get('/api/knowledge/documents')
    assert documents.status_code == 200
    assert documents.json()['count'] >= 1

    health = client.get('/api/health')
    assert health.status_code == 200
    assert health.json()['status'] == 'ok'
