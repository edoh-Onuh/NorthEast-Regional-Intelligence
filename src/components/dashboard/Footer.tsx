export function Footer() {
  return (
    <footer className="mx-auto mt-2 max-w-6xl px-4 pb-8 pt-2 text-[11px] leading-relaxed text-foreground-subtle sm:px-6">
      <p>
        <strong className="text-foreground-muted">Data sources:</strong> ONS Regional GVA (balanced) by
        local authority · NOMIS Claimant Count (NM_162_1) · NOMIS Annual Population Survey (NM_17_5) ·
        NOMIS Population Estimates (NM_31_1) · NOMIS UK Business Counts (NM_142_1) · HM Land Registry UK
        House Price Index · OHID Fingertips (Life Expectancy, indicator 90366). All data is Crown
        Copyright / Open Government Licence v3.0.
      </p>
    </footer>
  );
}
