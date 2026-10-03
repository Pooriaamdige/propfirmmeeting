/**
 * Page-wide ambient backdrop: drifting orange/gold aurora blobs over a faint grid and
 * film grain. Pure CSS (GPU transforms only) so it costs nothing on the main thread.
 */
export function SiteBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="grid-bg absolute inset-0 opacity-[0.55] [mask-image:radial-gradient(ellipse_at_top,#000_20%,transparent_75%)]" />
      <div className="aurora-blob absolute -top-[20vh] right-[-10vw] h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)]" />
      <div className="aurora-blob aurora-delay absolute top-[30vh] left-[-15vw] h-[55vh] w-[50vw] rounded-full bg-[radial-gradient(closest-side,var(--glow-2),transparent)]" />
      <div className="aurora-blob aurora-delay-2 absolute bottom-[-20vh] right-[20vw] h-[50vh] w-[45vw] rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)]" />
      <div className="grain absolute inset-0 opacity-[0.035]" />
    </div>
  );
}
