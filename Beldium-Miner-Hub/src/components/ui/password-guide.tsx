import { Check, Circle, X } from "lucide-react";

import { cn } from "@/lib/utils";

// What the API enforces on a new password (Django's AUTH_PASSWORD_VALIDATORS in
// the backend's core/settings.py): a minimum length, not digits only, not a
// commonly used password, and not too close to the person's own name or email.
// The first two are checked here exactly; the last two can only be decided by
// the server, so they are shown as guidance and flagged only when obviously
// broken.

type RuleState = "met" | "unmet" | "advice";

interface Rule {
  label: string;
  state: RuleState;
}

/** Name and email fragments long enough to be worth warning about. */
function identityTokens(identity: string[]): string[] {
  return identity
    .flatMap((value) => value.toLowerCase().split(/[\s@._-]+/))
    .filter((token) => token.length >= 4);
}

export function passwordRules(password: string, identity: string[] = []): Rule[] {
  const typed = password.length > 0;
  const lower = password.toLowerCase();
  const resembles = typed && identityTokens(identity).some((token) => lower.includes(token));
  return [
    {
      label: "At least 8 characters",
      state: !typed ? "advice" : password.length >= 8 ? "met" : "unmet",
    },
    {
      label: "Includes letters, not numbers only",
      state: !typed ? "advice" : /^\d+$/.test(password) ? "unmet" : "met",
    },
    {
      label: "Not a common password, such as “password123” or “qwerty123”",
      state: "advice",
    },
    {
      label: "Not based on your name or email address",
      state: resembles ? "unmet" : "advice",
    },
  ];
}

/** The first rule the form can be sure the API will refuse, or null. */
export function passwordProblem(password: string): string | null {
  if (password.length < 8) return "Use at least 8 characters.";
  if (/^\d+$/.test(password)) return "Add some letters: a password cannot be numbers only.";
  return null;
}

const ICON: Record<RuleState, typeof Check> = { met: Check, unmet: X, advice: Circle };

export function PasswordGuide({
  password,
  identity,
  id,
  className,
}: {
  password: string;
  /** The person's name and email, so a password built from them can be flagged. */
  identity?: string[];
  /** Point the input's aria-describedby here. */
  id?: string;
  className?: string;
}) {
  return (
    <div id={id} className={cn("space-y-1.5 text-xs text-muted-foreground", className)}>
      <p className="font-medium text-foreground">Your password needs to be:</p>
      <ul className="space-y-1">
        {passwordRules(password, identity).map((rule) => {
          const Icon = ICON[rule.state];
          return (
            <li
              key={rule.label}
              className={cn(
                "flex items-start gap-1.5",
                rule.state === "met" && "text-success",
                rule.state === "unmet" && "text-destructive",
              )}
            >
              <Icon
                aria-hidden
                className={cn("mt-0.5 size-3 shrink-0", rule.state === "advice" && "size-2 mt-1 mx-0.5")}
              />
              <span>
                {rule.label}
                <span className="sr-only">
                  {rule.state === "met" ? " (met)" : rule.state === "unmet" ? " (not met)" : ""}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <p>
        Tip: a short phrase with a capital letter, a number and a symbol is strong and easier to
        remember than a single word.
      </p>
    </div>
  );
}
