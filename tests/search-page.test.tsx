/** @vitest-environment happy-dom */

import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { fireEvent } from "@testing-library/react";
import SearchClient from "../src/app/repositories/[id]/search/SearchClient";

const REPO_ID = "test-repo";

describe("SearchClient frontend logic", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    (global as any).fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("never fires a request when query is empty", async () => {
    render(<SearchClient repoId={REPO_ID} />);

    const input = screen.getByLabelText("Search repository");

    await act(async () => {
      await userEvent.type(input, "GotOptions");
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      await userEvent.clear(input);
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("only applies the latest response after rapid typing", async () => {
    const mockResults = {
      GotOptions: [
        { fileId: "1", path: "source/index.ts", line: 1, snippet: "interface GotOptions {}" },
      ],
      Got: [
        { fileId: "2", path: "source/http.ts", line: 5, snippet: "export const Got = ..." },
      ],
    };

    let resolveFirst: (v: any) => void;
    const promiseFirst = new Promise((resolve) => {
      resolveFirst = resolve;
    });

    const responseSecond = {
      ok: true,
      json: async () => mockResults.Got,
    };

    (global.fetch as any).mockImplementation((url: string) => {
      if (url.includes("q=GotOptions")) {
        return promiseFirst.then(() => ({
          ok: true,
          json: async () => mockResults.GotOptions,
        }));
      }
      if (url.includes("q=Got")) {
        return Promise.resolve(responseSecond);
      }
      return Promise.resolve({
        ok: true,
        json: async () => [],
      });
    });

    render(<SearchClient repoId={REPO_ID} />);

    const input = screen.getByLabelText("Search repository");

    await act(async () => {
      fireEvent.change(input, { target: { value: "GotOptions" } });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      fireEvent.change(input, { target: { value: "Got" } });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(global.fetch).toHaveBeenCalledTimes(2);

    // Resolve the FIRST (stale) request AFTER the second has completed
    resolveFirst!(undefined);

    await waitFor(() => {
      expect(screen.getByText("source/http.ts")).toBeDefined();
    });
  });

  it("debounces requests: does not fire immediately, fires after delay", async () => {
    render(<SearchClient repoId={REPO_ID} />);

    const input = screen.getByLabelText("Search repository");

    await act(async () => {
      fireEvent.change(input, { target: { value: "test" } });
    });

    expect(global.fetch).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("announces result count via an aria-live region once results arrive", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        { fileId: "1", path: "source/index.ts", line: 1, snippet: "match" },
        { fileId: "2", path: "source/http.ts", line: 5, snippet: "match" },
      ],
    });

    const { container } = render(<SearchClient repoId={REPO_ID} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).not.toBeNull();

    const input = screen.getByLabelText("Search repository");

    await act(async () => {
      fireEvent.change(input, { target: { value: "match" } });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    await waitFor(() => {
      expect(liveRegion!.textContent).toBe("2 results found.");
    });
  });

  it("announces zero results via the aria-live region", async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const { container } = render(<SearchClient repoId={REPO_ID} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');

    const input = screen.getByLabelText("Search repository");

    await act(async () => {
      fireEvent.change(input, { target: { value: "nomatch" } });
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    await waitFor(() => {
      expect(liveRegion!.textContent).toBe("No matches found.");
    });
  });
});
