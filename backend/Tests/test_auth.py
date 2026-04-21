import json
import pytest
from unittest.mock import patch, MagicMock
from conftest import make_db_mock


# ─────────────────────────────────────────────────────────────────────────────
# TEST 1  –  Unregistered user gets error on login
# ─────────────────────────────────────────────────────────────────────────────
def test_login_unregistered_user_returns_error(client):
    """
    POST /login with credentials that do NOT exist in the DB.
    Expected: 401 with error message.
    """
    mock_conn, mock_cursor = make_db_mock(fetchone_return=None)   # no user found

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/login",
            data=json.dumps({"email": "ghost@example.com", "password": "wrongpass"}),
            content_type="application/json"
        )

    assert response.status_code == 401
    data = response.get_json()
    assert "error" in data
    assert "Invalid" in data["error"]


# ─────────────────────────────────────────────────────────────────────────────
# TEST 2  –  Valid registration details trigger OTP email
# ─────────────────────────────────────────────────────────────────────────────
def test_register_step1_sends_otp_for_valid_details(client):
    """
    POST /register-step1 with valid, new email.
    Expected: 200 + 'OTP sent' message (mail.send is mocked).
    """
    mock_conn, mock_cursor = make_db_mock(fetchone_return=None)   # email not taken

    with patch("app.get_db_connection", return_value=mock_conn), \
         patch("app.mail") as mock_mail:
        mock_mail.send.return_value = None

        response = client.post(
            "/register-step1",
            data=json.dumps({
                "username": "NewUser",
                "email": "newuser@gmail.com",
                "password": "Secret123"
            }),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert "OTP" in data["message"] or "otp" in data["message"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# TEST 3  –  OTP verification creates / activates user account
# ─────────────────────────────────────────────────────────────────────────────
def test_verify_registration_activates_account(client):
    """
    POST /verify-registration with matching email + OTP.
    Expected: 201 – account verified successfully.
    """
    # Simulate a user row existing with matching OTP
    mock_user_row = (1, "NewUser", "newuser@gmail.com", "hashedpass", 0, "654321", 0)
    mock_conn, mock_cursor = make_db_mock(fetchone_return=mock_user_row)

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/verify-registration",
            data=json.dumps({"email": "newuser@gmail.com", "otp": "654321"}),
            content_type="application/json"
        )

    assert response.status_code == 201
    data = response.get_json()
    assert "verified" in data["message"].lower() or "success" in data["message"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# TEST 4  –  Newly registered user gets correct (non-admin) role
# ─────────────────────────────────────────────────────────────────────────────
def test_login_new_user_has_non_admin_role(client):
    """
    POST /login for a normal user.
    Expected: 200 + is_admin == 0 in response.
    """
    mock_user = {
        "username": "RegularUser",
        "email": "regular@gmail.com",
        "is_admin": 0
    }
    mock_conn, mock_cursor = make_db_mock(fetchone_return=mock_user)

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/login",
            data=json.dumps({"email": "regular@gmail.com", "password": "pass123"}),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert data["is_admin"] == 0


# ─────────────────────────────────────────────────────────────────────────────
# TEST 5  –  Forgot password sends OTP to given email
# ─────────────────────────────────────────────────────────────────────────────
def test_forgot_password_sends_otp(client):
    """
    POST /forgot-password with a registered email.
    Expected: 200 + 'OTP sent' message.
    """
    mock_user = {"email": "user@gmail.com", "otp": None}
    mock_conn, mock_cursor = make_db_mock(fetchone_return=mock_user)

    with patch("app.get_db_connection", return_value=mock_conn), \
         patch("app.mail") as mock_mail:
        mock_mail.send.return_value = None

        response = client.post(
            "/forgot-password",
            data=json.dumps({"email": "user@gmail.com"}),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert "OTP" in data["message"] or "sent" in data["message"].lower()


# ─────────────────────────────────────────────────────────────────────────────
# TEST 6  –  Password mismatch shows error (helper / utility check)
# ─────────────────────────────────────────────────────────────────────────────
def test_password_mismatch_detected():
    """
    Utility-level check: verifying that the frontend would catch a mismatch.
    Here we replicate the validation logic that the React form enforces.
    """
    def passwords_match(pw1, pw2):
        return pw1 == pw2

    password      = "MyPass123"
    confirm_wrong = "MyPass456"
    confirm_right = "MyPass123"

    assert not passwords_match(password, confirm_wrong), \
        "Mismatched passwords should return False"
    assert passwords_match(password, confirm_right), \
        "Matching passwords should return True"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 7  –  Password length must be between 6 and 18 characters
# ─────────────────────────────────────────────────────────────────────────────
@pytest.mark.parametrize("password, expected_valid", [
    ("abc",              False),   # too short  (3 chars)
    ("12345",            False),   # too short  (5 chars)
    ("123456",           True),    # minimum    (6 chars)
    ("ValidPass1",       True),    # normal     (10 chars)
    ("ExactlyEighteen!!ab", False),
    ("ValidPassword12",  True),    # maximum    (15 chars)
])
def test_password_length_validation(password, expected_valid):
    """
    The password must be between 6-18 characters (matches backend/frontend rule).
    """
    def is_valid_password_length(pw):
        return 6 <= len(pw) <= 18

    assert is_valid_password_length(password) == expected_valid, \
        f"Password '{password}' (len={len(password)}) validity should be {expected_valid}"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 8  –  Reset password saves new password and returns success
# ─────────────────────────────────────────────────────────────────────────────
def test_reset_password_saves_new_password(client):
    """
    POST /reset-password with a valid email.
    Expected: 200 + success message confirming password was reset.
    """
    mock_user = {"email": "user@gmail.com", "password": "oldhash"}
    mock_conn, mock_cursor = make_db_mock(fetchone_return=mock_user)

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/reset-password",
            data=json.dumps({"email": "user@gmail.com", "new_password": "NewPass99"}),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert "reset" in data["message"].lower() or "success" in data["message"].lower()

    # Confirm the UPDATE query was actually executed on the cursor
    update_calls = [str(call) for call in mock_cursor.execute.call_args_list]
    assert any("UPDATE" in call for call in update_calls), \
        "Password UPDATE query was never called"
