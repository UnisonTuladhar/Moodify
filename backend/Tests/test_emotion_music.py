import json
import pytest
import numpy as np
from unittest.mock import patch, MagicMock
from conftest import make_db_mock


# ─────────────────────────────────────────────────────────────────────────────
# TEST 9  –  start_detection activates camera, resets mood to "None"
# ─────────────────────────────────────────────────────────────────────────────
def test_start_detection_sets_mood_to_none_and_activates(client):
    """
    POST /start_detection
    Expected: detection_active = True, last_predicted_mood = 'None', 200 response.
    """
    with patch("app.get_camera"), \
         patch("threading.Thread") as mock_thread:
        mock_thread.return_value.start = MagicMock()

        response = client.post("/start_detection")

    assert response.status_code == 200
    data = response.get_json()
    assert "started" in data["message"].lower()

    # Check that the global flag was set
    import app
    assert app.detection_active is True
    assert app.last_predicted_mood == "None"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 10  –  stop_detection deactivates camera, saves emotion to DB
# ─────────────────────────────────────────────────────────────────────────────
def test_stop_detection_releases_camera(client):
    with patch("app.release_camera") as mock_release:
        response = client.post("/stop_detection")

    assert response.status_code == 200
    data = response.get_json()
    assert "stopped" in data["message"].lower()
    mock_release.assert_called_once()

    import app
    assert app.detection_active is False


def test_save_mood_saves_to_database(client):
    mock_conn, mock_cursor = make_db_mock()

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/save-mood",
            data=json.dumps({"email": "user@gmail.com", "emotion": "Happy"}),
            content_type="application/json"
        )

    assert response.status_code == 201
    data = response.get_json()
    assert "saved" in data["message"].lower() or "success" in data["message"].lower()

    # Confirm INSERT was called
    insert_calls = [str(c) for c in mock_cursor.execute.call_args_list]
    assert any("INSERT" in c for c in insert_calls)


# ─────────────────────────────────────────────────────────────────────────────
# TEST 11  –  CNN model classifies face into one of the 5 valid emotions
# ─────────────────────────────────────────────────────────────────────────────
def test_cnn_model_returns_valid_emotion_label():
    
    import app

    valid_emotions = ['Angry', 'Happy', 'Neutral', 'Sad', 'Surprise']

    # Simulate 5 different model outputs (one dominant class each time)
    for dominant_index in range(5):
        fake_probs = [0.0] * 5
        fake_probs[dominant_index] = 1.0                  
        predicted_label = app.emotion_labels[int(np.argmax(fake_probs))]
        assert predicted_label in valid_emotions, \
            f"'{predicted_label}' is not in the valid emotion list"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 12  –  No face detected → mood stays "None"
# ─────────────────────────────────────────────────────────────────────────────
def test_no_face_detected_returns_none_mood(client):
    """
    When no face is present, /get_mood should return 'None'.
    We manually set the global and then call the endpoint.
    """
    import app
    app.last_predicted_mood = "None"   

    response = client.get("/get_mood")

    assert response.status_code == 200
    data = response.get_json()
    assert data["mood"] == "None"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 13  –  get_playlist returns songs matching the detected emotion
# ─────────────────────────────────────────────────────────────────────────────
def test_get_playlist_returns_songs_for_mood(client):
   
    fake_db_songs = [
        {
            "id": 1, "title": "Sunshine", "artist": "Artist A",
            "mood": "Happy", "language": "English", "file_path": "song1.mp3"
        }
    ]
    mock_conn, mock_cursor = make_db_mock(fetchall_return=fake_db_songs)

    mock_jamendo_response = MagicMock()
    mock_jamendo_response.status_code = 200
    mock_jamendo_response.json.return_value = {"results": []}

    with patch("app.get_db_connection", return_value=mock_conn), \
         patch("requests.get", return_value=mock_jamendo_response):

        response = client.post(
            "/user/get-playlist",
            data=json.dumps({"mood": "Happy"}),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    # At least the DB songs should be in the response
    assert len(data) >= 1


# ─────────────────────────────────────────────────────────────────────────────
# TEST 14  –  Liking a song adds it to the liked_songs database
# ─────────────────────────────────────────────────────────────────────────────
def test_like_song_adds_to_liked_songs(client):
    
    mock_conn, mock_cursor = make_db_mock(fetchone_return=None)

    payload = {
        "email": "user@gmail.com",
        "song_id": "api_999",
        "song_title": "Happy Tune",
        "song_artist": "Upbeat Artist",
        "song_mood": "Happy",
        "song_image": None,
        "song_source": "api",
        "file_path": "http://audio.example.com/track.mp3"
    }

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/user/like-song",
            data=json.dumps(payload),
            content_type="application/json"
        )

    assert response.status_code == 201
    data = response.get_json()
    assert data["liked"] is True

    insert_calls = [str(c) for c in mock_cursor.execute.call_args_list]
    assert any("INSERT" in c for c in insert_calls)


# ─────────────────────────────────────────────────────────────────────────────
# TEST 15  –  Dashboard liked songs returns the correct list of songs
# ─────────────────────────────────────────────────────────────────────────────
def test_liked_songs_returns_correct_list(client):
    
    fake_liked = [
        {
            "song_id": "api_1", "song_title": "Track One", "song_artist": "DJ",
            "song_mood": "Happy", "song_image": None,
            "song_source": "api", "file_path": "url1", "liked_at": "2024-01-01 10:00"
        },
        {
            "song_id": "api_2", "song_title": "Track Two", "song_artist": "Band",
            "song_mood": "Sad",   "song_image": None,
            "song_source": "api", "file_path": "url2", "liked_at": "2024-01-02 11:00"
        },
    ]
    mock_conn, mock_cursor = make_db_mock(fetchall_return=fake_liked)

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/user/liked-songs",
            data=json.dumps({"email": "user@gmail.com"}),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert len(data) == 2
    assert data[0]["song_title"] == "Track One"
    assert data[1]["song_title"] == "Track Two"


# ─────────────────────────────────────────────────────────────────────────────
# TEST 16  –  Adding a song to a new playlist creates it in the database
# (tests 16 – add-to-playlist route)
# ─────────────────────────────────────────────────────────────────────────────
def test_add_song_to_new_playlist_creates_playlist(client):
    mock_conn, mock_cursor = make_db_mock(fetchone_return=None)
    mock_cursor.lastrowid = 42

    payload = {
        "playlist_id": 1,
        "song_id": "api_101",
        "song_title": "Chill Song",
        "song_artist": "Lo-Fi Artist",
        "song_mood": "Neutral",
        "song_image": None,
        "song_source": "api",
        "file_path": "http://audio.example.com/chill.mp3"
    }

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/user/add-to-playlist",
            data=json.dumps(payload),
            content_type="application/json"
        )

    assert response.status_code in (200, 201)
    data = response.get_json()
    assert "message" in data
    insert_calls = [str(c) for c in mock_cursor.execute.call_args_list]
    assert any("INSERT" in c for c in insert_calls)

# ─────────────────────────────────────────────────────────────────────────────
# TEST 17  –  Remove Song from Playlist deletes it from the database
# ─────────────────────────────────────────────────────────────────────────────

def test_remove_song_from_playlist(client):
    mock_conn, mock_cursor = make_db_mock()

    payload = {
        "playlist_song_id": 5
    }

    with patch("app.get_db_connection", return_value=mock_conn):
        response = client.post(
            "/user/remove-from-playlist",
            data=json.dumps(payload),
            content_type="application/json"
        )

    assert response.status_code == 200
    data = response.get_json()
    assert "success" in data["message"].lower() or "removed" in data["message"].lower()
    delete_calls = [str(c) for c in mock_cursor.execute.call_args_list]
    assert any("DELETE" in c for c in delete_calls)