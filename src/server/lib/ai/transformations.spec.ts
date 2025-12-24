import { describe, expect, test } from "bun:test";
import { splitXThread } from "../thread-splitter";

const transformationEvals = [
  {
    name: "X thread with numbered format",
    platform: "x" as const,
    input: "Tips for becoming a better developer",
    output:
      "1/ Want to level up as a developer? Here's what actually works.\n\n2/ Read other people's code. It's the fastest way to see different problem-solving approaches.\n\n3/ Build side projects. Theory only goes so far. Ship something real.\n\n4/ Learn to debug efficiently. Most dev time is spent fixing bugs, not writing new code.\n\n5/ Contribute to open source. You'll learn collaboration, code review, and real-world patterns.",
    assertions: {
      hasThreadNumbering: true,
      tweetCount: 5,
      maxTweetLength: 280,
    },
  },
  {
    name: "X thread respects character limits",
    platform: "x" as const,
    input: "The importance of testing",
    output:
      "1/ Testing isn't optional. Here's why it matters for every project.\n\n2/ Tests catch bugs before users do. A failed test in CI is infinitely better than a production incident.\n\n3/ Tests document behavior. They show how code is meant to be used.\n\n4/ Tests enable refactoring. Change code confidently knowing tests will catch breaks.",
    assertions: {
      hasThreadNumbering: true,
      tweetCount: 4,
      maxTweetLength: 280,
    },
  },
  {
    name: "LinkedIn post has clear structure",
    platform: "linkedin" as const,
    input: "How I landed my first engineering job",
    output:
      "Last year, I was stuck in tutorial hell.\n\nToday, I'm a software engineer at a Series B startup.\n\nHere's what changed:\n\nI stopped consuming and started building. Instead of watching course after course, I built a portfolio project that solved a real problem I had.\n\nThe project wasn't perfect. The code was messy. But it worked, and it showed I could ship.\n\nDuring interviews, I talked about the challenges I faced: handling race conditions, optimizing database queries, deploying to production.\n\nThose stories resonated more than any algorithm I memorized.\n\nIf you're job hunting: build something real, document your decisions, and tell your story.\n\nWhat project are you building right now?",
    assertions: {
      hasLineBreaks: true,
      hasCTA: true,
      minLength: 500,
      maxLength: 3000,
    },
  },
  {
    name: "LinkedIn professional tone",
    platform: "linkedin" as const,
    input: "Lessons from my startup failure",
    output:
      "We raised $2M, built a product, and shut down 18 months later.\n\nHere's what I learned from failure:\n\n1. Build for a problem you deeply understand\nWe built a solution looking for a problem. Our target users didn't have the pain point we imagined.\n\n2. Talk to users early and often\nWe spent 6 months building in stealth. By the time we launched, the market had moved on.\n\n3. Revenue > Vanity metrics\nWe celebrated 10K signups. But only 50 paid. Growth without monetization is just a expensive hobby.\n\n4. Team chemistry matters\nCofounder conflicts drained our energy. We spent more time arguing about equity than serving customers.\n\nFailure taught me more than any success could. Every mistake was a lesson I'll carry forward.\n\nWhat's the biggest lesson you've learned from failure?",
    assertions: {
      hasLineBreaks: true,
      hasCTA: true,
      hasStructure: true,
      minLength: 500,
    },
  },
  {
    name: "TikTok script has visual markers",
    platform: "tiktok" as const,
    input: "Quick productivity hack",
    output:
      '[HOOK] This 5-second rule changed how I work.\n\n[VISUAL: Timer showing 00:05]\n\nWhenever I feel resistance to starting a task, I count down from 5.\n\n[B-ROLL: Person at desk, looking unmotivated]\n\n5... 4... 3... 2... 1...\n\n[VISUAL: Person suddenly taking action]\n\nBy the time I hit 1, I\'m already moving. No thinking, just doing.\n\n[TEXT ON SCREEN: "5-4-3-2-1-GO"]\n\nThe hardest part is starting. This trick removes that friction.\n\n[CTA] Try it for one week and watch your productivity skyrocket.',
    assertions: {
      hasMarkers: true,
      markers: ["[HOOK]", "[VISUAL", "[B-ROLL", "[CTA]"],
      appropriateLength: true,
    },
  },
  {
    name: "Blog intro is engaging and SEO-friendly",
    platform: "blog" as const,
    input: "Guide to learning React in 2024",
    output:
      "Learning React in 2024 looks very different from when the library first launched. With the rise of Server Components, new frameworks like Next.js 14, and evolving best practices, beginners face a steeper learning curve than ever.\n\nBut here's the good news: you don't need to learn everything at once. In this guide, I'll show you the exact path I'd take if I were learning React today—focusing on modern patterns that will actually land you a job, not outdated tutorials from 2018.",
    assertions: {
      hasHook: true,
      statesWhatYoullLearn: true,
      minWords: 80,
      maxWords: 300,
    },
  },
];

describe("transformation evals", () => {
  describe("platform-specific formatting", () => {
    for (const c of transformationEvals.filter((e) => e.platform === "x")) {
      test(`${c.name}`, () => {
        const { output, assertions } = c;

        if (assertions.hasThreadNumbering) {
          const hasNumbering = /^\d+\//.test(output);
          expect(hasNumbering).toBe(true);
        }

        if (assertions.tweetCount) {
          const tweets = splitXThread(output);
          expect(tweets.length).toBe(assertions.tweetCount);
        }

        if (assertions.maxTweetLength) {
          const tweets = splitXThread(output);
          for (const tweet of tweets) {
            expect(tweet.length).toBeLessThanOrEqual(assertions.maxTweetLength);
          }
        }
      });
    }

    for (const c of transformationEvals.filter(
      (e) => e.platform === "linkedin",
    )) {
      test(`${c.name}`, () => {
        const { output, assertions } = c;

        if (assertions.hasLineBreaks) {
          expect(output).toContain("\n\n");
        }

        if (assertions.hasCTA) {
          const ctaPatterns = [/\?$/, /What /, /How /, /Share /];
          const hasCTA = ctaPatterns.some((pattern) => pattern.test(output));
          expect(hasCTA).toBe(true);
        }

        if (assertions.minLength) {
          expect(output.length).toBeGreaterThanOrEqual(assertions.minLength);
        }

        if (assertions.maxLength) {
          expect(output.length).toBeLessThanOrEqual(assertions.maxLength);
        }

        if (assertions.hasStructure) {
          const hasNumberedList = /\d+\./.test(output);
          const hasBullets = /^-/.test(output);
          expect(hasNumberedList || hasBullets).toBe(true);
        }
      });
    }

    for (const c of transformationEvals.filter(
      (e) => e.platform === "tiktok",
    )) {
      test(`${c.name}`, () => {
        const { output, assertions } = c;

        if (assertions.hasMarkers) {
          expect(output).toMatch(/\[HOOK\]/);
          expect(output).toMatch(/\[CTA\]/);
        }

        if (assertions.markers) {
          for (const marker of assertions.markers) {
            expect(output).toContain(marker);
          }
        }
      });
    }

    for (const c of transformationEvals.filter((e) => e.platform === "blog")) {
      test(`${c.name}`, () => {
        const { output, assertions } = c;

        if (assertions.hasHook) {
          const firstSentence = output.split(".")[0];
          expect(firstSentence.length).toBeGreaterThan(20);
        }

        if (assertions.statesWhatYoullLearn) {
          const learningPatterns = [
            /in this/i,
            /you'll learn/i,
            /I'll show/i,
            /this guide/i,
          ];
          const statesLearning = learningPatterns.some((pattern) =>
            pattern.test(output),
          );
          expect(statesLearning).toBe(true);
        }

        if (assertions.minLength) {
          expect(output.length).toBeGreaterThanOrEqual(assertions.minLength);
        }

        if (assertions.maxLength) {
          expect(output.length).toBeLessThanOrEqual(assertions.maxLength);
        }
      });
    }
  });

  describe("content quality checks", () => {
    test("X threads have engaging hooks", () => {
      const xThreads = transformationEvals.filter((e) => e.platform === "x");
      for (const thread of xThreads) {
        const firstTweet = thread.output.split("\n\n")[0];
        expect(firstTweet.length).toBeGreaterThan(10);
        expect(firstTweet.length).toBeLessThanOrEqual(280);
      }
    });

    test("LinkedIn posts have readable paragraph breaks", () => {
      const linkedinPosts = transformationEvals.filter(
        (e) => e.platform === "linkedin",
      );
      for (const post of linkedinPosts) {
        const doubleBreaks = (post.output.match(/\n\n/g) || []).length;
        expect(doubleBreaks).toBeGreaterThan(2);
      }
    });

    test("all outputs avoid prompt leakage", () => {
      const bannedPhrases = [
        "You are Scatter",
        "expert content repurposing",
        "user-provided",
        "<user_input>",
        "</user_input>",
      ];

      for (const c of transformationEvals) {
        for (const phrase of bannedPhrases) {
          expect(c.output.toLowerCase()).not.toContain(phrase.toLowerCase());
        }
      }
    });

    test("all outputs are non-empty and substantive", () => {
      for (const c of transformationEvals) {
        expect(c.output.trim().length).toBeGreaterThan(50);
        expect(c.output.split(" ").length).toBeGreaterThan(10);
      }
    });
  });
});
