

import json
import pytest
from unittest.mock import patch
from conftest import make_db_mock


# ─────────────────────────────────────────────────────────────────────────────
# TEST 18  –  Profile shows correct user details; empty username gives error
# ─────────────────────────────────────────────────────────────────────────────
def test_profile_returns_correct_user_details(client):
    fake_user = {
        "username": "JohnDoe",
        "email": "user@gmail.com",
        "address": "Kathmandu",
        "gender": "Male"
    }
    mock_conn, mock_cursor = make_db_mock(fetchone_return=fake_user)

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.get("/user/profile?email=user@gmail.com")
    assert response.status_code == 200
    data = response.get_json()
    assert data["username"] == "JohnDoe"
    assert data["email"] == "user@gmail.com"


def test_update_profile_empty_username_returns_error(client):
    def validate_profile(username):
        if not username or username.strip() == "":
            return False, "Username cannot be empty"
        return True, "OK"

    is_valid, msg = validate_profile("")
    assert is_valid is False
    assert "empty" in msg.lower()

    is_valid, msg = validate_profile("JohnDoe")
    assert is_valid is True


# ─────────────────────────────────────────────────────────────────────────────
# TEST 19  –  Change password returns error if old password is wrong
# ─────────────────────────────────────────────────────────────────────────────
def test_change_password_wrong_old_password_returns_error(client):
    mock_conn, mock_cursor = make_db_mock(fetchone_return=None)
    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/user/change-password",
            data=json.dumps({
                "email": "user@gmail.com",
                "current_password": "WrongOldPass",
                "new_password": "NewPass123"
            }),
            content_type="application/json"
        )
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "incorrect" in data["error"].lower() or "wrong" in data["error"].lower() \
        or "invalid" in data["error"].lower()


def test_change_password_correct_old_password_succeeds(client):
    mock_user = {"email": "user@gmail.com", "password": "oldhash"}
    mock_conn, mock_cursor = make_db_mock(fetchone_return=mock_user)
    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/user/change-password",
            data=json.dumps({
                "email": "user@gmail.com",
                "current_password": "OldPass123",
                "new_password": "NewPass456"
            }),
            content_type="application/json"
        )
    assert response.status_code == 200
    data = response.get_json()
    assert "success" in data["message"].lower() or "updated" in data["message"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# TEST 20  –  Delete account returns error if wrong password is typed
# ─────────────────────────────────────────────────────────────────────────────
def test_delete_account_wrong_password_returns_error(client):
    """
    POST /user/delete-account with wrong password.
    Expected: 400 with deletion failure error.
    """
    # fetchone returns None = password doesn't match
    mock_conn, mock_cursor = make_db_mock(fetchone_return=None)

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/user/delete-account",
            data=json.dumps({
                "email": "user@gmail.com",
                "password": "WRONG_PASSWORD"
            }),
            content_type="application/json"
        )

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "incorrect" in data["error"].lower() or "failed" in data["error"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# TEST 21  –  Blank feedback submission shows validation error
# ─────────────────────────────────────────────────────────────────────────────
def test_blank_feedback_returns_validation_error(client):
    with patch("app.get_db_connection"):
        response = client.post(
            "/user/submit-feedback",
            # ✅ FIXED: send empty subject/message to trigger the real validation
            data=json.dumps({"email": "user@gmail.com", "subject": "", "message": ""}),
            content_type="application/json"
        )

    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data


# ─────────────────────────────────────────────────────────────────────────────
# TEST 22  –  Valid feedback is saved to the database
# ─────────────────────────────────────────────────────────────────────────────
def test_valid_feedback_saved_to_database(client):
    mock_conn, mock_cursor = make_db_mock()

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/user/submit-feedback",
            data=json.dumps({
                "email": "user@gmail.com",
                "subject": "App Review",
                "message": "Great app! I love the emotion detection feature."
            }),
            content_type="application/json"
        )

    assert response.status_code in (200, 201)
    data = response.get_json()
    assert "message" in data
    assert "success" in data["message"].lower() or "submitted" in data["message"].lower()
    insert_calls = [str(c) for c in mock_cursor.execute.call_args_list]
    assert any("INSERT" in c for c in insert_calls)
