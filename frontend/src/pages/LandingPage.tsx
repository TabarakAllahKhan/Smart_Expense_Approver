import { SignInButton } from "@clerk/clerk-react";

const TOOL_CALLS = [
  "checkSpendingLimit",
  "checkReceiptRequired",
  "checkDuplicateSubmission",
  "viewPurchaseHistory",
];

export function LandingPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-2 gap-16 items-center">
      <div>
        <p
          className="text-xs tracking-widest uppercase mb-4"
          style={{ color: "#2F6F4E", fontFamily: "'JetBrains Mono', monospace" }}
        >
          Agentic expense review
        </p>
        <h1
          className="text-4xl md:text-5xl font-bold leading-[1.1] mb-6"
          style={{ color: "#1C2321", fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Every expense gets a reason, not just a rule.
        </h1>
        <p className="text-base text-gray-600 leading-relaxed mb-8 max-w-md">
          Submit an expense and an AI agent reads your receipt, checks your
          spending history, and writes a real justification — approved,
          flagged, or rejected. Managers see the reasoning, not just the verdict.
        </p>
        <SignInButton mode="modal">
          <button
            className="px-6 py-3 rounded-md text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{ backgroundColor: "#1C2321" }}
          >
            Sign in to submit an expense
          </button>
        </SignInButton>
      </div>

      <VerdictStrip />
    </div>
  );
}

function VerdictStrip() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        className="rounded-t-md px-6 pt-6 pb-8 shadow-sm"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #D8D5CB",
          borderBottom: "none",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        <p className="text-xs mb-1" style={{ color: "#8A8578" }}>
          EXPENSE #4471
        </p>
        <div className="flex justify-between text-sm mb-4" style={{ color: "#1C2321" }}>
          <span>Team Dinner — Meals</span>
          <span>$75.00</span>
        </div>

        <div className="space-y-2 mb-5">
          {TOOL_CALLS.map((call, i) => (
            <div
              key={call}
              className="flex items-center gap-2 text-xs opacity-0 animate-[fadeIn_0.4s_ease-out_forwards]"
              style={{ color: "#5B5748", animationDelay: `${i * 0.35 + 0.3}s` }}
            >
              <span
                className="inline-block w-3 h-3 rounded-sm text-center leading-3 opacity-0 animate-[fadeIn_0.2s_ease-out_forwards]"
                style={{
                  backgroundColor: "#2F6F4E",
                  color: "white",
                  fontSize: "8px",
                  animationDelay: `${i * 0.35 + 0.55}s`,
                }}
              >
                ✓
              </span>
              {call}()
            </div>
          ))}
        </div>

        <div
          className="text-xs italic leading-relaxed opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]"
          style={{ color: "#8A8578", animationDelay: "1.8s" }}
        >
          "Receipt total does not match claimed amount — flagged for review."
        </div>
      </div>

      <div
        className="relative flex items-center justify-center py-4"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #D8D5CB",
          borderTop: "none",
        }}
      >
        <div
          className="px-4 py-1.5 rounded border-2 opacity-0 scale-90 rotate-[-6deg] animate-[stampIn_0.4s_ease-out_forwards]"
          style={{
            borderColor: "#C08A2E",
            color: "#C08A2E",
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            letterSpacing: "0.05em",
            animationDelay: "2.1s",
          }}
        >
          FLAGGED
        </div>
      </div>

      <div
        className="h-4 w-full"
        style={{
          backgroundImage:
            "linear-gradient(135deg, #FAFAF7 8px, transparent 0), linear-gradient(-135deg, #FAFAF7 8px, transparent 0)",
          backgroundSize: "16px 16px",
          backgroundRepeat: "repeat-x",
          backgroundColor: "#FFFFFF",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 0%, transparent 0%)",
        }}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes stampIn {
          from { opacity: 0; transform: scale(1.4) rotate(-6deg); }
          to { opacity: 1; transform: scale(1) rotate(-6deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="animation"] { animation: none !important; opacity: 1 !important; }
        }
      `}</style>
    </div>
  );
}