const foundations = [
  ['Candidates', 'Keep profiles, documents, and applications connected.'],
  ['Pipelines', 'Move applicants through a clear, configurable hiring process.'],
  ['Collaboration', 'Bring interviews, scorecards, and communication into one timeline.'],
];

export default function Home() {
  return (
    <main>
      <nav>
        <span className="brand">GEDPro</span>
        <span className="status">Frontend foundation</span>
      </nav>
      <section className="hero">
        <p className="eyebrow">Recruitment, without the busywork</p>
        <h1>A calmer way to build great teams.</h1>
        <p className="lede">
          The GEDPro web application is ready for its first product workflow. Backend and frontend
          now live together, while remaining independently deployable.
        </p>
      </section>
      <section className="cards" aria-label="Product foundations">
        {foundations.map(([title, description], index) => (
          <article key={title}>
            <span>0{index + 1}</span>
            <h2>{title}</h2>
            <p>{description}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
