'use client';

export function SourcesStrip() {
  return (
    <div className="bg-bg border-t border-border px-4 py-2 text-[11px] leading-relaxed text-muted text-center">
      <span className="text-muted">Sources:</span>{' '}
      <a
        href="https://eciresults.nic.in/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-fg underline decoration-dotted hover:text-accent"
      >
        ECI · eciresults.nic.in
      </a>{' '}
      ·{' '}
      <span className="text-muted">State CEO portals:</span>{' '}
      <a href="https://ceoassam.nic.in/" target="_blank" rel="noopener noreferrer" className="hover:text-fg">Assam</a>,{' '}
      <a href="https://ceo.kerala.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-fg">Kerala</a>,{' '}
      <a href="https://elections.tn.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-fg">Tamil Nadu</a>,{' '}
      <a href="https://ceowestbengal.nic.in/" target="_blank" rel="noopener noreferrer" className="hover:text-fg">West Bengal</a>,{' '}
      <a href="https://ceopondicherry.py.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-fg">Puducherry</a>
    </div>
  );
}
