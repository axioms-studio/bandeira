export interface Strategy {
  name: string;
  parameters: Record<string, any>;
  constraints: Constraint[];
}

export interface Constraint {
  context_name: string;
  operator: string;
  values: string[];
  inverted: boolean;
  case_insensitive: boolean;
}

export interface EvalContext {
  userId?: string;
  sessionId?: string;
  remoteAddress?: string;
  properties?: Record<string, string>;
}

export interface EvalTrace {
  constraints: { constraint: Constraint; passed: boolean; reason: string }[];
  strategyResult: boolean;
  strategyReason: string;
  finalResult: boolean;
}

// FNV-32a hash, returns value 0-99 for consistent bucketing.
export function normalizedHash(s: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return ((hash >>> 0) % 100);
}

function splitMulti(s: string): string[] {
  return s
    .replace(/\r\n/g, ",")
    .replace(/\n/g, ",")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

function getContextValue(name: string, ctx: EvalContext): string {
  switch (name) {
    case "userId":
      return ctx.userId ?? "";
    case "sessionId":
      return ctx.sessionId ?? "";
    case "remoteAddress":
      return ctx.remoteAddress ?? "";
    default:
      return ctx.properties?.[name] ?? "";
  }
}

function evalOperator(
  op: string,
  ctxValue: string,
  values: string[],
  caseInsensitive: boolean,
): boolean {
  const cv = caseInsensitive ? ctxValue.toLowerCase() : ctxValue;

  switch (op) {
    case "IN":
      return values.some((v) => cv === (caseInsensitive ? v.toLowerCase() : v));

    case "NOT_IN":
      return !values.some((v) => cv === (caseInsensitive ? v.toLowerCase() : v));

    case "STR_CONTAINS":
      return values.some((v) => cv.includes(caseInsensitive ? v.toLowerCase() : v));

    case "STR_STARTS_WITH":
      return values.some((v) => cv.startsWith(caseInsensitive ? v.toLowerCase() : v));

    case "STR_ENDS_WITH":
      return values.some((v) => cv.endsWith(caseInsensitive ? v.toLowerCase() : v));

    case "NUM_EQ":
    case "NUM_GT":
    case "NUM_GTE":
    case "NUM_LT":
    case "NUM_LTE": {
      const num = parseFloat(cv);
      if (isNaN(num)) return false;
      return values.some((v) => {
        const target = parseFloat(v);
        if (isNaN(target)) return false;
        switch (op) {
          case "NUM_EQ":  return num === target;
          case "NUM_GT":  return num > target;
          case "NUM_GTE": return num >= target;
          case "NUM_LT":  return num < target;
          case "NUM_LTE": return num <= target;
          default:        return false;
        }
      });
    }

    case "DATE_AFTER":
    case "DATE_BEFORE": {
      const t = new Date(cv);
      if (isNaN(t.getTime())) return false;
      return values.some((v) => {
        const target = new Date(v);
        if (isNaN(target.getTime())) return false;
        return op === "DATE_AFTER" ? t > target : t < target;
      });
    }

    default:
      return false;
  }
}

export function evaluateConstraint(
  con: Constraint,
  ctx: EvalContext,
): { passed: boolean; reason: string } {
  const ctxValue = getContextValue(con.context_name, ctx);
  const result = evalOperator(con.operator, ctxValue, con.values, con.case_insensitive);
  const final = con.inverted ? !result : result;

  const label = con.inverted ? `NOT(${con.operator})` : con.operator;
  const reason = final
    ? `"${ctxValue}" ${label} [${con.values.join(", ")}] → pass`
    : `"${ctxValue}" ${label} [${con.values.join(", ")}] → fail`;

  return { passed: final, reason };
}

function evalUserWithId(s: Strategy, ctx: EvalContext): { result: boolean; reason: string } {
  const raw = s.parameters.userIds;
  if (typeof raw !== "string") return { result: false, reason: "No userIds parameter" };
  const ids = splitMulti(raw);
  const uid = ctx.userId ?? "";
  if (ids.includes(uid)) {
    return { result: true, reason: `User "${uid}" found in [${ids.join(", ")}]` };
  }
  return { result: false, reason: `User "${uid}" not in [${ids.join(", ")}]` };
}

function evalGradualRollout(s: Strategy, ctx: EvalContext): { result: boolean; reason: string } {
  const rolloutRaw = s.parameters.rollout;
  let rollout: number;
  if (typeof rolloutRaw === "number") {
    rollout = rolloutRaw;
  } else if (typeof rolloutRaw === "string") {
    rollout = parseInt(rolloutRaw, 10);
    if (isNaN(rollout)) return { result: false, reason: "Invalid rollout value" };
  } else {
    return { result: false, reason: "No rollout parameter" };
  }

  if (rollout >= 100) return { result: true, reason: "Rollout is 100% → always on" };
  if (rollout <= 0) return { result: false, reason: "Rollout is 0% → always off" };

  const stickiness = typeof s.parameters.stickiness === "string" ? s.parameters.stickiness : "userId";
  let stickinessValue: string;
  switch (stickiness) {
    case "userId":
      stickinessValue = ctx.userId ?? "";
      break;
    case "sessionId":
      stickinessValue = ctx.sessionId ?? "";
      break;
    default:
      stickinessValue = ctx.properties?.[stickiness] ?? "";
  }

  if (!stickinessValue) return { result: false, reason: `Stickiness field "${stickiness}" is empty` };

  const groupId = typeof s.parameters.groupId === "string" ? s.parameters.groupId : "";
  const hash = normalizedHash(stickinessValue + groupId);
  const enabled = hash < rollout;

  return {
    result: enabled,
    reason: `hash("${stickinessValue}${groupId}") % 100 = ${hash} ${enabled ? "<" : ">="} ${rollout}`,
  };
}

function evalRemoteAddress(s: Strategy, ctx: EvalContext): { result: boolean; reason: string } {
  let raw = s.parameters.ips ?? s.parameters.IPs;
  if (typeof raw !== "string") return { result: false, reason: "No IPs parameter" };
  const ips = splitMulti(raw);
  const addr = ctx.remoteAddress ?? "";

  for (const entry of ips) {
    if (entry === addr) {
      return { result: true, reason: `"${addr}" matches "${entry}" exactly` };
    }
    if (entry.endsWith(".") && addr.startsWith(entry)) {
      return { result: true, reason: `"${addr}" matches prefix "${entry}"` };
    }
  }
  return { result: false, reason: `"${addr}" not in [${ips.join(", ")}]` };
}

export function evaluateStrategy(s: Strategy, ctx: EvalContext): EvalTrace {
  const constraintResults = s.constraints.map((con) => ({
    constraint: con,
    ...evaluateConstraint(con, ctx),
  }));

  const allConstraintsPass = constraintResults.every((r) => r.passed);

  if (!allConstraintsPass) {
    return {
      constraints: constraintResults,
      strategyResult: false,
      strategyReason: "Constraints failed (AND logic)",
      finalResult: false,
    };
  }

  let strategyEval: { result: boolean; reason: string };

  switch (s.name) {
    case "default":
      strategyEval = { result: true, reason: "Default strategy → always on" };
      break;
    case "userWithId":
      strategyEval = evalUserWithId(s, ctx);
      break;
    case "gradualRollout":
      strategyEval = evalGradualRollout(s, ctx);
      break;
    case "remoteAddress":
      strategyEval = evalRemoteAddress(s, ctx);
      break;
    default:
      strategyEval = { result: true, reason: `Unknown strategy "${s.name}" → pass` };
  }

  return {
    constraints: constraintResults,
    strategyResult: strategyEval.result,
    strategyReason: strategyEval.reason,
    finalResult: strategyEval.result,
  };
}
