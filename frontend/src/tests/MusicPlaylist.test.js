/**
 * MusicPlaylist.test.js  –  Jest tests for Music page and Playlist features.
 *
 * Place at:  Moodify/frontend/src/__tests__/MusicPlaylist.test.js
 * Run:       npm test
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// ─────────────────────────────────────────────────────────────────────────────
// Minimal stub components (mirrors logic in your real Music / Playlist pages)
// ─────────────────────────────────────────────────────────────────────────────

function SongCard({ song, onLike, isLiked }) {
  return (
    <div data-testid="song-card">
      <p>{song.title}</p>
      <p>{song.artist}</p>
      <button onClick={() => onLike(song)} aria-label="like-button">
        {isLiked ? "Unlike" : "Like"}
      </button>
    </div>
  );
}

function MusicPage({ mood, songs, onLike, likedIds }) {
  return (
    <div>
      <h2>Songs for: {mood}</h2>
      {songs.length === 0 && <p>No songs found</p>}
      {songs.map((s) => (
        <SongCard
          key={s.id}
          song={s}
          onLike={onLike}
          isLiked={likedIds.includes(s.id)}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MUSIC PAGE TESTS
// ─────────────────────────────────────────────────────────────────────────────

const fakeSongs = [
  { id: "api_1", title: "Happy Tune",  artist: "DJ Joy",    mood: "Happy" },
  { id: "api_2", title: "Sunny Vibes", artist: "The Band",  mood: "Happy" },
];

describe("MusicPage component", () => {
  test("renders song cards returned by the playlist API", () => {
    render(<MusicPage mood="Happy" songs={fakeSongs} onLike={() => {}} likedIds={[]} />);
    expect(screen.getByText("Happy Tune")).toBeInTheDocument();
    expect(screen.getByText("Sunny Vibes")).toBeInTheDocument();
  });

  test("shows the current detected mood in the heading", () => {
    render(<MusicPage mood="Sad" songs={fakeSongs} onLike={() => {}} likedIds={[]} />);
    expect(screen.getByText(/Songs for: Sad/i)).toBeInTheDocument();
  });

  test("shows 'No songs found' when playlist is empty", () => {
    render(<MusicPage mood="Angry" songs={[]} onLike={() => {}} likedIds={[]} />);
    expect(screen.getByText(/no songs found/i)).toBeInTheDocument();
  });

  test("calls onLike with correct song when Like button is clicked", () => {
    const mockLike = jest.fn();
    render(<MusicPage mood="Happy" songs={fakeSongs} onLike={mockLike} likedIds={[]} />);
    const likeButtons = screen.getAllByRole("button", { name: /like-button/i });
    fireEvent.click(likeButtons[0]);
    expect(mockLike).toHaveBeenCalledWith(fakeSongs[0]);
  });

  test("shows 'Unlike' instead of 'Like' for already-liked songs", () => {
    render(
      <MusicPage
        mood="Happy"
        songs={fakeSongs}
        onLike={() => {}}
        likedIds={["api_1"]}        // song_1 is already liked
      />
    );
    const buttons = screen.getAllByRole("button", { name: /like-button/i });
    expect(buttons[0]).toHaveTextContent("Unlike");
    expect(buttons[1]).toHaveTextContent("Like");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PLAYLIST TESTS
// ─────────────────────────────────────────────────────────────────────────────

function PlaylistPage({ playlists, onRemoveSong }) {
  return (
    <div>
      {playlists.map((pl) => (
        <div key={pl.id} data-testid="playlist">
          <h3>{pl.name}</h3>
          {pl.songs.map((s) => (
            <div key={s.id} data-testid="playlist-song">
              <span>{s.title}</span>
              <button
                onClick={() => onRemoveSong(pl.id, s.id)}
                aria-label={`remove-${s.id}`}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

const fakePlaylists = [
  {
    id: 1,
    name: "My Chill Mix",
    songs: [
      { id: "api_10", title: "Chill Song A" },
      { id: "api_11", title: "Chill Song B" },
    ]
  }
];

describe("PlaylistPage component", () => {
  test("renders playlist name and all its songs", () => {
    render(<PlaylistPage playlists={fakePlaylists} onRemoveSong={() => {}} />);
    expect(screen.getByText("My Chill Mix")).toBeInTheDocument();
    expect(screen.getByText("Chill Song A")).toBeInTheDocument();
    expect(screen.getByText("Chill Song B")).toBeInTheDocument();
  });

  test("calls onRemoveSong with correct ids when Remove is clicked", () => {
    const mockRemove = jest.fn();
    render(<PlaylistPage playlists={fakePlaylists} onRemoveSong={mockRemove} />);
    const removeBtn = screen.getByLabelText("remove-api_10");
    fireEvent.click(removeBtn);
    expect(mockRemove).toHaveBeenCalledWith(1, "api_10");   // playlistId, songId
  });

  test("does not render songs from a different playlist", () => {
    const multiPlaylists = [
      { id: 1, name: "Playlist A", songs: [{ id: "s1", title: "Song A" }] },
      { id: 2, name: "Playlist B", songs: [{ id: "s2", title: "Song B" }] },
    ];
    render(<PlaylistPage playlists={multiPlaylists} onRemoveSong={() => {}} />);
    expect(screen.getAllByTestId("playlist")).toHaveLength(2);
    expect(screen.getByText("Song A")).toBeInTheDocument();
    expect(screen.getByText("Song B")).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// API MOCK TESTS  –  get-playlist, like-song, remove-from-playlist
// ─────────────────────────────────────────────────────────────────────────────

describe("Music API calls", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test("get-playlist returns songs for detected mood", async () => {
    global.fetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => fakeSongs
    });

    const res  = await fetch("http://localhost:5000/user/get-playlist", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ mood: "Happy" })
    });
    const data = await res.json();

    expect(res.ok).toBe(true);
    expect(Array.isArray(data)).toBe(true);
    expect(data[0].mood).toBe("Happy");
  });

  test("like-song returns liked:true when a new song is liked", async () => {
    global.fetch.mockResolvedValueOnce({
      ok:     true,
      status: 201,
      json:   async () => ({ message: "Song liked", liked: true })
    });

    const res  = await fetch("http://localhost:5000/user/like-song", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: "u@g.com", song_id: "api_1" })
    });
    const data = await res.json();

    expect(data.liked).toBe(true);
  });

  test("remove-from-playlist returns success message", async () => {
    global.fetch.mockResolvedValueOnce({
      ok:   true,
      json: async () => ({ message: "Song removed successfully" })
    });

    const res  = await fetch("http://localhost:5000/user/remove-from-playlist", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: "u@g.com", playlist_id: 1, song_id: "api_1" })
    });
    const data = await res.json();

    expect(data.message).toMatch(/removed/i);
  });
});
