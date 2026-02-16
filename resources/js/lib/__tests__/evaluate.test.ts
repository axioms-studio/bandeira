import { describe, it, expect } from "vitest";
import {
  evaluateStrategy,
  evaluateConstraint,
  normalizedHash,
  type Strategy,
  type Constraint,
  type EvalContext,
} from "../evaluate";

describe("normalizedHash", () => {
  it("returns consistent results for the same input", () => {
    const a = normalizedHash("user42group1");
    const b = normalizedHash("user42group1");
    expect(a).toBe(b);
  });

  it("returns a value between 0 and 99", () => {
    for (const s of ["a", "b", "hello", "user-123", "test"]) {
      const h = normalizedHash(s);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(100);
    }
  });
});

describe("evaluateStrategy — default", () => {
  it("always returns true", () => {
    const s: Strategy = { name: "default", parameters: {}, constraints: [] };
    const trace = evaluateStrategy(s, {});
    expect(trace.finalResult).toBe(true);
  });
});

describe("evaluateStrategy — gradualRollout", () => {
  it("100% rollout → enabled", () => {
    const s: Strategy = {
      name: "gradualRollout",
      parameters: { rollout: 100 },
      constraints: [],
    };
    const trace = evaluateStrategy(s, { userId: "anyone" });
    expect(trace.finalResult).toBe(true);
  });

  it("0% rollout → disabled", () => {
    const s: Strategy = {
      name: "gradualRollout",
      parameters: { rollout: 0 },
      constraints: [],
    };
    const trace = evaluateStrategy(s, { userId: "anyone" });
    expect(trace.finalResult).toBe(false);
  });

  it("empty stickiness value → disabled", () => {
    const s: Strategy = {
      name: "gradualRollout",
      parameters: { rollout: 50 },
      constraints: [],
    };
    const trace = evaluateStrategy(s, {});
    expect(trace.finalResult).toBe(false);
  });

  it("string rollout parameter works", () => {
    const s: Strategy = {
      name: "gradualRollout",
      parameters: { rollout: "100" },
      constraints: [],
    };
    const trace = evaluateStrategy(s, { userId: "test" });
    expect(trace.finalResult).toBe(true);
  });
});

describe("evaluateStrategy — userWithId", () => {
  it("matching user → enabled", () => {
    const s: Strategy = {
      name: "userWithId",
      parameters: { userIds: "1,2,42" },
      constraints: [],
    };
    const trace = evaluateStrategy(s, { userId: "42" });
    expect(trace.finalResult).toBe(true);
  });

  it("non-matching user → disabled", () => {
    const s: Strategy = {
      name: "userWithId",
      parameters: { userIds: "1,2,42" },
      constraints: [],
    };
    const trace = evaluateStrategy(s, { userId: "99" });
    expect(trace.finalResult).toBe(false);
  });

  it("no context → disabled", () => {
    const s: Strategy = {
      name: "userWithId",
      parameters: { userIds: "1,2,42" },
      constraints: [],
    };
    const trace = evaluateStrategy(s, {});
    expect(trace.finalResult).toBe(false);
  });

  it("newline-separated userIds", () => {
    const s: Strategy = {
      name: "userWithId",
      parameters: { userIds: "1\n2\n42" },
      constraints: [],
    };
    const trace = evaluateStrategy(s, { userId: "42" });
    expect(trace.finalResult).toBe(true);
  });
});

describe("evaluateStrategy — remoteAddress", () => {
  it("exact IP match", () => {
    const s: Strategy = {
      name: "remoteAddress",
      parameters: { ips: "10.0.0.1\n192.168.1." },
      constraints: [],
    };
    const trace = evaluateStrategy(s, { remoteAddress: "10.0.0.1" });
    expect(trace.finalResult).toBe(true);
  });

  it("prefix match", () => {
    const s: Strategy = {
      name: "remoteAddress",
      parameters: { ips: "192.168.1." },
      constraints: [],
    };
    const trace = evaluateStrategy(s, { remoteAddress: "192.168.1.100" });
    expect(trace.finalResult).toBe(true);
  });

  it("no match", () => {
    const s: Strategy = {
      name: "remoteAddress",
      parameters: { ips: "10.0.0.1" },
      constraints: [],
    };
    const trace = evaluateStrategy(s, { remoteAddress: "172.16.0.1" });
    expect(trace.finalResult).toBe(false);
  });
});

describe("evaluateConstraint", () => {
  it("IN — match", () => {
    const c: Constraint = {
      context_name: "companyId",
      operator: "IN",
      values: ["1", "2", "3"],
      inverted: false,
      case_insensitive: false,
    };
    const result = evaluateConstraint(c, {
      properties: { companyId: "2" },
    });
    expect(result.passed).toBe(true);
  });

  it("IN — no match", () => {
    const c: Constraint = {
      context_name: "companyId",
      operator: "IN",
      values: ["1", "2", "3"],
      inverted: false,
      case_insensitive: false,
    };
    const result = evaluateConstraint(c, {
      properties: { companyId: "99" },
    });
    expect(result.passed).toBe(false);
  });

  it("NOT_IN — match", () => {
    const c: Constraint = {
      context_name: "plan",
      operator: "NOT_IN",
      values: ["free"],
      inverted: false,
      case_insensitive: false,
    };
    const result = evaluateConstraint(c, {
      properties: { plan: "enterprise" },
    });
    expect(result.passed).toBe(true);
  });

  it("inverted IN → excludes matching values", () => {
    const c: Constraint = {
      context_name: "plan",
      operator: "IN",
      values: ["free"],
      inverted: true,
      case_insensitive: false,
    };
    // "free" IS in the list → inverted → false
    expect(
      evaluateConstraint(c, { properties: { plan: "free" } }).passed,
    ).toBe(false);
    // "enterprise" is NOT in the list → inverted → true
    expect(
      evaluateConstraint(c, { properties: { plan: "enterprise" } }).passed,
    ).toBe(true);
  });

  it("case insensitive matching", () => {
    const c: Constraint = {
      context_name: "country",
      operator: "IN",
      values: ["Brazil", "Portugal"],
      inverted: false,
      case_insensitive: true,
    };
    expect(
      evaluateConstraint(c, { properties: { country: "brazil" } }).passed,
    ).toBe(true);
    expect(
      evaluateConstraint(c, { properties: { country: "PORTUGAL" } }).passed,
    ).toBe(true);
    expect(
      evaluateConstraint(c, { properties: { country: "spain" } }).passed,
    ).toBe(false);
  });

  it("STR_CONTAINS", () => {
    const c: Constraint = {
      context_name: "email",
      operator: "STR_CONTAINS",
      values: ["@acme.com"],
      inverted: false,
      case_insensitive: false,
    };
    expect(
      evaluateConstraint(c, { properties: { email: "user@acme.com" } }).passed,
    ).toBe(true);
    expect(
      evaluateConstraint(c, { properties: { email: "user@other.com" } }).passed,
    ).toBe(false);
  });

  it("NUM_GT", () => {
    const c: Constraint = {
      context_name: "age",
      operator: "NUM_GT",
      values: ["18"],
      inverted: false,
      case_insensitive: false,
    };
    expect(
      evaluateConstraint(c, { properties: { age: "21" } }).passed,
    ).toBe(true);
    expect(
      evaluateConstraint(c, { properties: { age: "16" } }).passed,
    ).toBe(false);
  });

  it("DATE_AFTER", () => {
    const c: Constraint = {
      context_name: "created",
      operator: "DATE_AFTER",
      values: ["2025-01-01T00:00:00Z"],
      inverted: false,
      case_insensitive: false,
    };
    expect(
      evaluateConstraint(c, {
        properties: { created: "2025-06-01T00:00:00Z" },
      }).passed,
    ).toBe(true);
    expect(
      evaluateConstraint(c, {
        properties: { created: "2024-06-01T00:00:00Z" },
      }).passed,
    ).toBe(false);
  });
});

describe("constraints + strategy combined", () => {
  it("constraint fails → strategy disabled regardless", () => {
    const s: Strategy = {
      name: "default",
      parameters: {},
      constraints: [
        {
          context_name: "country",
          operator: "IN",
          values: ["US"],
          inverted: false,
          case_insensitive: false,
        },
      ],
    };
    const trace = evaluateStrategy(s, {
      properties: { country: "BR" },
    });
    expect(trace.finalResult).toBe(false);
    expect(trace.constraints[0].passed).toBe(false);
  });

  it("constraint passes → strategy logic runs", () => {
    const s: Strategy = {
      name: "userWithId",
      parameters: { userIds: "42" },
      constraints: [
        {
          context_name: "plan",
          operator: "IN",
          values: ["pro"],
          inverted: false,
          case_insensitive: false,
        },
      ],
    };
    const trace = evaluateStrategy(s, {
      userId: "42",
      properties: { plan: "pro" },
    });
    expect(trace.finalResult).toBe(true);
    expect(trace.constraints[0].passed).toBe(true);
  });
});
