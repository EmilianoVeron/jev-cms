import { beforeEach, describe, expect, it, vi } from "vitest";

const systemOneMock = vi.fn();

vi.mock("@typesafe-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@typesafe-ai/sdk")>();
  return {
    ...actual,
    TypeSafeClient: vi.fn().mockImplementation(() => ({ systemOne: systemOneMock })),
  };
});

const { createJevCatalog } = await import("./client.js");

describe("createJevCatalog", () => {
  beforeEach(() => {
    systemOneMock.mockReset();
  });

  it("resolves a choice question from the catalog", async () => {
    systemOneMock.mockResolvedValue({
      answers: {
        "blog-article.topicCategory": {
          type: "choice",
          choice: "technology",
          confidence: 0.9,
          probabilities: { technology: 0.9 },
        },
      },
    });

    const jev = createJevCatalog({ apiKey: "test-key" });
    const result = await jev.choice("blog-article.topicCategory", "some article text");

    expect(result.choice).toBe("technology");
    expect(systemOneMock).toHaveBeenCalledWith(
      expect.objectContaining({ state: "some article text" }),
    );
  });

  it("resolves a noul question from the catalog", async () => {
    systemOneMock.mockResolvedValue({
      answers: { "blog-article.readyToPublish": { type: "noul", noul: 0.8 } },
    });

    const jev = createJevCatalog({ apiKey: "test-key" });
    const result = await jev.noul("blog-article.readyToPublish", "some article text");

    expect(result.noul).toBe(0.8);
  });

  it("resolves a score question from the catalog", async () => {
    systemOneMock.mockResolvedValue({
      answers: { "blog-article.brandVoice": { type: "score", score: 2.4, confidence: 0.85 } },
    });

    const jev = createJevCatalog({ apiKey: "test-key" });
    const result = await jev.score("blog-article.brandVoice", "some article text");

    expect(result.score).toBe(2.4);
  });

  it("throws when calling the wrong resolver for a question's actual type", async () => {
    const jev = createJevCatalog({ apiKey: "test-key" });

    await expect(jev.noul("blog-article.topicCategory", "text")).rejects.toThrow(
      /is type "choice", not "noul"/,
    );
    expect(systemOneMock).not.toHaveBeenCalled();
  });

  it("throws for an unknown catalog id without calling Jev", async () => {
    const jev = createJevCatalog({ apiKey: "test-key" });

    await expect(jev.choice("nonexistent.id", "text")).rejects.toThrow(/unknown catalog question id/);
    expect(systemOneMock).not.toHaveBeenCalled();
  });

  it("lists catalog entries by domain without calling Jev", () => {
    const jev = createJevCatalog({ apiKey: "test-key" });

    const entries = jev.list({ domain: "blog-article" });

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.every((entry) => entry.domain === "blog-article")).toBe(true);
    expect(systemOneMock).not.toHaveBeenCalled();
  });
});
