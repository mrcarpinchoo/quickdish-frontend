type PlaceholderPageProps = {
  title: string;
};

/** Stand-in for screens that later issues build. Keeps the routes reachable now. */
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <section className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-stone-600">
        Esta pantalla llega en una historia posterior.
      </p>
    </section>
  );
}
