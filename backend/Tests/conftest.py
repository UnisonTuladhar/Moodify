import sys
import os
import pytest
from unittest.mock import MagicMock, patch

# ── Make sure the backend folder is on sys.path so we can import app.py ──────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


# ─────────────────────────────────────────────────────────────────────────────
# Patch heavy / hardware dependencies BEFORE app.py is imported.
# This prevents TensorFlow and OpenCV from trying to open a real camera or GPU.
# ─────────────────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session", autouse=True)
def patch_heavy_imports():
    """Patch ML model loading and mail so tests run without hardware."""

    mock_model = MagicMock()
    mock_model.predict.return_value = [[0.1, 0.7, 0.05, 0.1, 0.05]]  # 'Happy'

    mock_cascade = MagicMock()

    with patch("tensorflow.keras.models.load_model", return_value=mock_model), \
         patch("cv2.CascadeClassifier", return_value=mock_cascade), \
         patch("flask_mail.Mail.send", return_value=None):
        yield


# ─────────────────────────────────────────────────────────────────────────────
# Flask test client
# ─────────────────────────────────────────────────────────────────────────────
@pytest.fixture(scope="session")
def app():
    import app as flask_app
    flask_app.app.config["TESTING"] = True
    flask_app.app.config["MAIL_SUPPRESS_SEND"] = True   # never actually send email
    return flask_app.app


@pytest.fixture
def client(app):
    return app.test_client()


# ─────────────────────────────────────────────────────────────────────────────
# Reusable DB mock factory
# ─────────────────────────────────────────────────────────────────────────────
def make_db_mock(fetchone_return=None, fetchall_return=None):
    """
    Returns a mock that behaves like a mysql-connector connection.
    Pass the values you want cursor.fetchone() / fetchall() to return.
    """
    mock_cursor = MagicMock()
    mock_cursor.fetchone.return_value = fetchone_return
    mock_cursor.fetchall.return_value = fetchall_return or []

    mock_conn = MagicMock()
    mock_conn.cursor.return_value = mock_cursor
    mock_conn.is_connected.return_value = True

    return mock_conn, mock_cursor
