const foundations = [
  ['Candidates', 'Keep profiles, documents, and applications connected.'],
  ['Pipelines', 'Move applicants through a clear, configurable hiring process.'],
  ['Collaboration', 'Bring interviews, scorecards, and communication into one timeline.'],
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 pb-14 pt-7 sm:px-[clamp(1.5rem,5vw,4.5rem)]">
      <nav className="flex items-center justify-between" aria-label="Primary navigation">
        <span className="text-xl font-bold tracking-[-0.04em]">GEDPro</span>
        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground max-sm:hidden">
          Frontend foundation
        </span>
      </nav>
      <section className="max-w-[56rem] py-[clamp(5.5rem,16vh,11rem)]">
        <p className="mb-6 font-semibold text-primary">Recruitment, without the busywork</p>
        <h1 className="m-0 text-[clamp(3.5rem,9vw,8.5rem)] leading-[0.9] tracking-[-0.075em]">
          A calmer way to build great teams.
        </h1>
        <p className="mt-9 max-w-[41rem] text-[clamp(1.05rem,2vw,1.35rem)] leading-relaxed text-muted-foreground">
          The GEDPro web application is ready for its first product workflow. Backend and frontend
          now live together, while remaining independently deployable.
        </p>
      </section>
      <section
        className="grid border-t border-border md:grid-cols-3"
        aria-label="Product foundations"
      >
        {foundations.map(([title, description], index) => (
          <article
            className="border-b border-border py-6 md:border-b-0 md:border-r md:px-7 md:py-7 md:first:pl-0 md:last:border-r-0"
            key={title}
          >
            <span className="font-mono text-xs text-primary">0{index + 1}</span>
            <h2 className="mb-2.5 mt-8 text-xl font-semibold">{title}</h2>
            <p className="m-0 leading-relaxed text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
