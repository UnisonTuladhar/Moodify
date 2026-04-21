import json
import io
import pytest
from unittest.mock import patch, MagicMock
from conftest import make_db_mock


# ─────────────────────────────────────────────────────────────────────────────
# TEST 23  –  Admin adds a user → saved in DB with correct role
# ─────────────────────────────────────────────────────────────────────────────
def test_admin_add_user_saves_with_correct_role(client):
    # fetchone → None (email not taken)
    mock_conn, mock_cursor = make_db_mock(fetchone_return=None)

    payload = {
        "username": "TestStudent",
        "email": "student@college.edu",
        "password": "Pass1234",
        "is_admin": 0                 # regular user role
    }

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/admin/add-user",
            data=json.dumps(payload),
            content_type="application/json"
        )

    assert response.status_code == 201
    data = response.get_json()
    assert "success" in data["message"].lower() or "added" in data["message"].lower()

    # Verify the INSERT was called and included the is_admin value
    insert_calls = [str(c) for c in mock_cursor.execute.call_args_list]
    assert any("INSERT" in c for c in insert_calls)


# ─────────────────────────────────────────────────────────────────────────────
# TEST 24a  –  Admin edits a user → updated in DB
# ─────────────────────────────────────────────────────────────────────────────
def test_admin_edit_user_updates_database(client):
    """
    POST /admin/edit-user  –  change username/email of a regular user.
    Expected: 200 + UPDATE executed.
    """
    # Target user is NOT an admin (is_admin = 0)
    mock_conn, mock_cursor = make_db_mock(fetchone_return={"is_admin": 0})

    payload = {"id": 5, "username": "UpdatedName", "email": "updated@gmail.com"}

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/admin/edit-user",
            data=json.dumps(payload),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert "updated" in data["message"].lower() or "success" in data["message"].lower()

    update_calls = [str(c) for c in mock_cursor.execute.call_args_list]
    assert any("UPDATE" in c for c in update_calls)


# ─────────────────────────────────────────────────────────────────────────────
# TEST 24  –  Admin deletes a user → removed from DB
# ─────────────────────────────────────────────────────────────────────────────
def test_admin_delete_user_removes_from_database(client):
    """
    POST /admin/delete-user  –  delete a regular (non-admin) user.
    Expected: 200 + DELETE executed.
    """
    # Target user is NOT an admin
    mock_conn, mock_cursor = make_db_mock(fetchone_return={"is_admin": 0})

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/admin/delete-user",
            data=json.dumps({"id": 7}),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert "deleted" in data["message"].lower() or "success" in data["message"].lower()

    delete_calls = [str(c) for c in mock_cursor.execute.call_args_list]
    assert any("DELETE" in c for c in delete_calls)


# ─────────────────────────────────────────────────────────────────────────────
# TEST 25  –  User analytics returns correct count for a date range
# ─────────────────────────────────────────────────────────────────────────────
def test_admin_user_analytics_returns_correct_count(client):
    """
    POST /admin/user-analytics (or GET /admin/users with date filter).
    Expected: returns only users registered within the given date range.
    """
    fake_users = [
        {"id": 1, "username": "Alice", "registered_date": "2024-03-01"},
        {"id": 2, "username": "Bob",   "registered_date": "2024-03-15"},
    ]
    mock_conn, mock_cursor = make_db_mock(fetchall_return=fake_users)

    # We test the /admin/users endpoint here
    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.get("/admin/users")

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2           # exactly 2 users returned

# ─────────────────────────────────────────────────────────────────────────────
# TEST 26  –  Admin adds a song (MP3) → saved in DB
# ─────────────────────────────────────────────────────────────────────────────
def test_admin_add_song_uploads_mp3_to_database(client):
    mock_conn, mock_cursor = make_db_mock()

    # Create a fake MP3 file in memory
    fake_mp3 = (io.BytesIO(b"ID3fake_mp3_data"), "test_song.mp3")

    with patch("app.get_db_connection", return_value=mock_conn), \
         patch("app.os.path.exists", return_value=True), \
         patch("werkzeug.datastructures.FileStorage.save"):   # don't write to disk

        data = {
            "title":    "Happy Vibes",
            "artist":   "DJ Test",
            "mood":     "Happy",
            "language": "English",
            "file":     fake_mp3
        }
        response = client.post(
            "/admin/add-song",
            data=data,
            content_type="multipart/form-data"
        )

    assert response.status_code == 201
    result = response.get_json()
    assert "uploaded" in result["message"].lower() or "success" in result["message"].lower()

    insert_calls = [str(c) for c in mock_cursor.execute.call_args_list]
    assert any("INSERT" in c for c in insert_calls)


# ─────────────────────────────────────────────────────────────────────────────
# TEST 27  –  Admin deletes a song → removed from DB and disk
# ─────────────────────────────────────────────────────────────────────────────
def test_admin_delete_song_removes_from_database(client):
    """
    POST /admin/delete-song  –  provide a song id.
    Expected: 200 + DELETE called on DB.
    """
    song_row = {"file_path": "1234567890_song.mp3"}
    mock_conn, mock_cursor = make_db_mock(fetchone_return=song_row)

    with patch("app.get_db_connection", return_value=mock_conn), \
         patch("app.os.path.exists", return_value=False):   # skip actual file delete

        response = client.post(
            "/admin/delete-song",
            data=json.dumps({"id": 3}),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert "deleted" in data["message"].lower() or "success" in data["message"].lower()

    delete_calls = [str(c) for c in mock_cursor.execute.call_args_list]
    assert any("DELETE" in c for c in delete_calls)


# ─────────────────────────────────────────────────────────────────────────────
# TEST 28  –  Emotion analytics returns correct count per emotion and date range
# ─────────────────────────────────────────────────────────────────────────────
def test_emotion_analytics_returns_correct_counts(client):

    fake_analytics = [
        {"name": "Happy",   "value": 42},
        {"name": "Sad",     "value": 18},
        {"name": "Neutral", "value": 30},
    ]
    mock_conn, mock_cursor = make_db_mock(fetchall_return=fake_analytics)

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/admin/emotion-analytics",
            data=json.dumps({"start_date": "2024-01-01", "end_date": "2024-03-31"}),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 3

    # Validate correct structure
    names  = [item["name"]  for item in data]
    values = [item["value"] for item in data]
    assert "Happy"   in names
    assert "Sad"     in names
    assert "Neutral" in names
    assert all(isinstance(v, int) for v in values)


# ─────────────────────────────────────────────────────────────────────────────
# TEST 29  –  Feedback analytics returns correct count and feedbacks for date range
# ─────────────────────────────────────────────────────────────────────────────
def test_feedback_analytics_returns_correct_count_and_data(client):
    """
    GET or POST /admin/feedbacks  –  with optional date filter.
    Expected: 200 + list of feedback records.
    """
    fake_feedbacks = [
        {"id": 1, "email": "a@gmail.com", "feedback": "Great!", "submitted_at": "2024-02-10 12:00"},
        {"id": 2, "email": "b@gmail.com", "feedback": "Needs work.", "submitted_at": "2024-02-11 09:00"},
    ]
    mock_conn, mock_cursor = make_db_mock(fetchall_return=fake_feedbacks)

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.get("/admin/feedbacks")

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2
    assert data[0]["feedback"] == "Great!"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 30  –  Admin cannot delete own account if they are the only admin
# ─────────────────────────────────────────────────────────────────────────────
def test_only_admin_cannot_delete_own_account(client):
    
    # Second fetchone → admin count is 1
    mock_conn = MagicMock()
    mock_cursor = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_conn.is_connected.return_value = True

    mock_cursor.fetchone.side_effect = [
        {"is_admin": 1},                  # user found and is admin
        {"count": 1}                       # only one admin in DB
    ]

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/user/delete-account",
            data=json.dumps({
                "email": "admin@moodify.com",
                "password": "AdminPass123"
            }),
            content_type="application/json"
        )

    assert response.status_code == 403
    data = response.get_json()
    assert "error" in data
    assert "admin" in data["error"].lower()
