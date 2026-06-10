export function Nav() {
  return (
    <nav className="mb-2 flex items-center justify-between rounded-md border-hairline border-border bg-bg-card px-4 py-3 sm:mb-3 sm:px-6 sm:py-4">
      <div className="flex items-center gap-2.5">
        <span className="font-serif text-xl font-medium tracking-tight">Heat</span>
        <span className="rounded-[4px] border-hairline border-border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] text-text-secondary">
          Intelligence
        </span>
      </div>
      <div className="hidden gap-6 text-sm text-text-secondary md:flex">
        <a className="cursor-pointer hover:text-text-primary" href="#pricing">Pricing</a>
        <a className="cursor-pointer hover:text-text-primary" href="#bundle">How it works</a>
        <a className="cursor-pointer hover:text-text-primary" href="#faq">FAQ</a>
        <a className="cursor-pointer hover:text-text-primary" href="http://localhost:9000/login">Login</a>
      </div>
      <button className="rounded-md bg-text-primary px-3.5 py-2 text-[12px] font-medium text-white sm:px-4 sm:py-2.5 sm:text-[13px]">
        Claim your venue
      </button>
    </nav>
  );
}
