/**
 * The atmosphere behind every glass surface: soft-focus solid-color "light
 * sources" — plain fills blurred heavily, not gradients — that glass panels
 * appear to refract. This is the actual Apple-style liquid-glass technique:
 * real light sources behind frosted glass, rather than a gradient painted
 * onto the glass itself.
 */
export function AmbientBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-bg-0" aria-hidden>
      <div
        className="absolute -left-[10%] -top-[18%] h-[46vh] w-[46vw] rounded-full opacity-[0.16]"
        style={{ background: "var(--accent-violet)", filter: "blur(110px)" }}
      />
      <div
        className="absolute -right-[14%] top-[-4%] h-[40vh] w-[40vw] rounded-full opacity-[0.13]"
        style={{ background: "var(--accent-teal)", filter: "blur(110px)" }}
      />
      <div
        className="absolute bottom-[-16%] left-[18%] h-[36vh] w-[36vw] rounded-full opacity-[0.07]"
        style={{ background: "var(--accent-teal)", filter: "blur(120px)" }}
      />
    </div>
  );
}
