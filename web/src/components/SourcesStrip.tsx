'use client';

export function SourcesStrip() {
  return (
    <div className="bg-zinc-950 border-t border-zinc-900 px-4 py-2 text-[11px] leading-relaxed text-zinc-500 text-center">
      <span className="text-zinc-400">Sources:</span>{' '}
      <a
        href="https://eciresults.nic.in/"
        target="_blank"
        rel="noopener noreferrer"
        className="text-zinc-300 underline decoration-dotted hover:text-white"
      >
        ECI · eciresults.nic.in
      </a>{' '}
      ·{' '}
      <span className="text-zinc-400">State CEO portals:</span>{' '}
      <a href="https://ceoassam.nic.in/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300">Assam</a>,{' '}
      <a href="https://ceo.kerala.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300">Kerala</a>,{' '}
      <a href="https://elections.tn.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300">Tamil Nadu</a>,{' '}
      <a href="https://ceowestbengal.nic.in/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300">West Bengal</a>,{' '}
      <a href="https://ceopondicherry.py.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300">Puducherry</a>
    </div>
  );
}
