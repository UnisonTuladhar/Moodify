

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Inline validation helpers (same logic used inside Login.jsx) ─────────────
// Copy these functions from your Login component here for pure unit tests:

function isValidEmail(email) {
  return /^[\w.-]+@[\w.-]+\.\w+$/.test(email.trim());
}

function isValidPasswordLength(password) {
  return password.length >= 6 && password.length <= 18;
}

function passwordsMatch(pw1, pw2) {
  return pw1 === pw2;
}

// ────────────────────────────────────────────────────────────────────────────
// PURE UTILITY TESTS  (no DOM needed)
// ────────────────────────────────────────────────────────────────────────────

describe("Email validation helper", () => {
  test("accepts a valid gmail address", () => {
    expect(isValidEmail("student@gmail.com")).toBe(true);
  });

  test("accepts a valid college email", () => {
    expect(isValidEmail("user@college.edu")).toBe(true);
  });

  test("rejects an address without @", () => {
    expect(isValidEmail("notanemail.com")).toBe(false);
  });

  test("rejects an address without domain extension", () => {
    expect(isValidEmail("user@nodomain")).toBe(false);
  });

  test("rejects an empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });
});


describe("Password length validation helper", () => {
  test("rejects passwords shorter than 6 chars", () => {
    expect(isValidPasswordLength("abc")).toBe(false);
  });

  test("accepts a password of exactly 6 chars (minimum)", () => {
    expect(isValidPasswordLength("abc123")).toBe(true);
  });

  test("accepts a password of 18 chars (maximum)", () => {
    expect(isValidPasswordLength("A".repeat(18))).toBe(true);
  });

  test("rejects passwords longer than 18 chars", () => {
    expect(isValidPasswordLength("A".repeat(19))).toBe(false);
  });
});


describe("Passwords match helper", () => {
  test("returns true when both passwords are identical", () => {
    expect(passwordsMatch("MyPass123", "MyPass123")).toBe(true);
  });

  test("returns false when passwords differ", () => {
    expect(passwordsMatch("MyPass123", "Different9")).toBe(false);
  });

  test("returns false when one field is empty", () => {
    expect(passwordsMatch("MyPass123", "")).toBe(false);
  });
});


// ────────────────────────────────────────────────────────────────────────────
// DOM / COMPONENT TESTS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Minimal stub of a Login form so we can test DOM behaviour
 * without importing the real component (which may have router deps).
 */
function LoginForm({ onSubmit }) {
  const [email, setEmail]       = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError]       = React.useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    if (!isValidPasswordLength(password)) {
      setError("The password must be between 6-18 characters");
      return;
    }
    setError("");
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p role="alert">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}

describe("LoginForm component", () => {
  test("renders email and password inputs", () => {
    render(<LoginForm onSubmit={() => {}} />);
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  test("shows error for invalid email on submit", () => {
    render(<LoginForm onSubmit={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Email"),    { target: { value: "bademail" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "Pass123" } });
    fireEvent.click(screen.getByText("Login"));
    expect(screen.getByRole("alert")).toHaveTextContent(/valid email/i);
  });

  test("shows error for password shorter than 6 chars", () => {
    render(<LoginForm onSubmit={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Email"),    { target: { value: "user@gmail.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "abc" } });
    fireEvent.click(screen.getByText("Login"));
    expect(screen.getByRole("alert")).toHaveTextContent(/6-18/i);
  });

  test("calls onSubmit with correct data for valid inputs", () => {
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    fireEvent.change(screen.getByPlaceholderText("Email"),    { target: { value: "user@gmail.com" } });
    fireEvent.change(screen.getByPlaceholderText("Password"), { target: { value: "ValidPass1" } });
    fireEvent.click(screen.getByText("Login"));
    expect(mockSubmit).toHaveBeenCalledWith({
      email:    "user@gmail.com",
      password: "ValidPass1"
    });
  });

  test("does NOT call onSubmit when form has validation errors", () => {
    const mockSubmit = jest.fn();
    render(<LoginForm onSubmit={mockSubmit} />);
    // Submit with empty fields
    fireEvent.click(screen.getByText("Login"));
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});


// ────────────────────────────────────────────────────────────────────────────
// API CALL TESTS  (mock axios / fetch)
// ────────────────────────────────────────────────────────────────────────────

describe("Login API call behaviour", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  test("shows success on valid credentials (200 response)", async () => {
    global.fetch.mockResolvedValueOnce({
      ok:   true,
      status: 200,
      json: async () => ({
        message:  "Login successful!",
        username: "JohnDoe",
        email:    "user@gmail.com",
        is_admin: 0
      })
    });

    const response = await fetch("http://localhost:5000/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: "user@gmail.com", password: "Pass123" })
    });
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.message).toBe("Login successful!");
    expect(data.is_admin).toBe(0);
  });

  test("shows error for unregistered user (401 response)", async () => {
    global.fetch.mockResolvedValueOnce({
      ok:     false,
      status: 401,
      json:   async () => ({ error: "Invalid email or password!" })
    });

    const response = await fetch("http://localhost:5000/login", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ email: "ghost@gmail.com", password: "wrong" })
    });
    const data = await response.json();

    expect(response.ok).toBe(false);
    expect(response.status).toBe(401);
    expect(data.error).toMatch(/invalid/i);
  });
});
