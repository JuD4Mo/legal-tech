'use client';
import { useState, useEffect, useId } from 'react';
import { Check, Circle, GitBranch, List, BookOpen, Download, Eye } from 'lucide-react';
import type { PortalActor, Publication, Stage } from '@/types/portal';
import { portalRepository } from '@/lib/portal-repository';
import { formatDate } from '@/lib/dates';
import { Badge, Modal } from '@/components/ui';

export function PortalFile({
  actor,
  caseId,
  versionId,
  name,
}: {
  actor: PortalActor;
  caseId: string;
  versionId: string;
  name: string;
}) {
  const [preview, setPreview] = useState<{ url: string; mime: string }>();
  const [error, setError] = useState('');
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview.url);
    },
    [preview],
  );
  async function open(view: boolean) {
    try {
      const file = await portalRepository.file(actor, caseId, versionId);
      if (
        view &&
        !['application/pdf', 'text/plain', 'image/png', 'image/jpeg', 'image/webp'].includes(
          file.mime,
        )
      ) {
        setError('Este formato solo admite descarga.');
        return;
      }
      const url = URL.createObjectURL(file.blob);
      if (view) setPreview({ url, mime: file.mime });
      else {
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="portal-file">
      <span>{name}</span>
      <div className="button-group">
        <button
          className="icon-button"
          aria-label={`Consultar ${name}`}
          onClick={() => void open(true)}
        >
          <Eye size={18} />
        </button>
        <button
          className="icon-button"
          aria-label={`Descargar ${name}`}
          onClick={() => void open(false)}
        >
          <Download size={18} />
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {preview && (
        <Modal title={name} onClose={() => setPreview(undefined)}>
          <iframe
            className="document-preview"
            sandbox="allow-same-origin"
            title={name}
            src={preview.url}
          />
        </Modal>
      )}
    </div>
  );
}
export function TrackingView({
  publication,
  actor,
}: {
  publication: Publication;
  actor?: PortalActor;
}) {
  const [view, setView] = useState('simple');
  const [selectedId, setSelectedId] = useState('');
  const stages = publication.stages;
  const selected =
    stages.find((s) => s.id === selectedId) ??
    stages.find((s) => s.status === 'actual') ??
    stages[0];
  function details(stage: Stage) {
    return (
      <div className="stage-explanation">
        <div className="portal-section-heading">
          <h3>{stage.title}</h3>
          <Badge>{stage.status}</Badge>
        </div>
        <p>{stage.description}</p>
        {(
          [
            ['¿Qué significa?', stage.meaning],
            ['¿Qué se ha realizado?', stage.completed],
            ['¿Qué sigue?', stage.next],
            ['¿Necesito hacer algo?', stage.action],
          ] as const
        ).map(([label, text]) => (
          <div key={label}>
            <h3>{label}</h3>
            <p>{text || 'Su abogado aún no ha publicado esta explicación.'}</p>
          </div>
        ))}
        <p className="muted">
          {stage.responsible && `Responsable: ${stage.responsible} · `}Última revisión:{' '}
          {formatDate(publication.updatedAt)}
        </p>
        {actor &&
          publication.files
            .filter((f) => stage.documentIds.includes(f.documentId))
            .map((f) => (
              <PortalFile
                key={f.versionId}
                actor={actor}
                caseId={publication.caseId}
                versionId={f.versionId}
                name={`${f.name} · v${f.version}`}
              />
            ))}
      </div>
    );
  }
  return (
    <section className="panel portal-tracking">
      <div className="panel-title">
        <h2>Entiende tu proceso</h2>
        <span className="muted">Revisión {publication.revision}</span>
      </div>
      <div className="portal-tabs" role="tablist" aria-label="Visualización del seguimiento">
        {[
          { id: 'simple', label: 'En palabras sencillas', icon: BookOpen },
          { id: 'timeline', label: 'Línea de tiempo', icon: List },
          { id: 'flow', label: 'Diagrama de flujo', icon: GitBranch },
        ].map((t) => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={view === t.id}
            aria-controls="tracking-panel"
            onClick={() => setView(t.id)}
          >
            <t.icon size={17} />
            {t.label}
          </button>
        ))}
      </div>
      {!selected ? (
        <p className="portal-empty">Su abogado todavía no ha publicado etapas de seguimiento.</p>
      ) : (
        <div id="tracking-panel" role="tabpanel" aria-labelledby={`tab-${view}`}>
          {view === 'simple' ? (
            <>
              <div className="current-stage">
                <span>Etapa seleccionada</span>
                <strong>{selected.title}</strong>
                <Badge>{selected.status}</Badge>
              </div>
              {details(selected)}
            </>
          ) : (
            <div className={`tracking-split ${view === 'flow' ? 'flow-layout' : ''}`}>
              {view === 'timeline' ? (
                <ol className="portal-timeline">
                  {stages.map((s) => (
                    <li key={s.id} className={`stage-${s.status.replaceAll(' ', '-')}`}>
                      <button
                        aria-pressed={selected.id === s.id}
                        onClick={() => setSelectedId(s.id)}
                      >
                        <span className="stage-marker">
                          {s.status === 'completada' ? <Check size={17} /> : <Circle size={15} />}
                        </span>
                        <span>
                          <small>
                            {s.date ? formatDate(s.date) : 'Fecha pendiente de confirmación'}
                          </small>
                          <strong>{s.title}</strong>
                          <Badge>{s.status}</Badge>
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="portal-flow" aria-label="Relaciones entre actuaciones">
                  <p className="muted">
                    Seleccione una etapa. Las conexiones describen caminos posibles, no garantizan
                    su realización.
                  </p>
                  <ProcessDiagram
                    publication={publication}
                    selected={selected.id}
                    onSelect={setSelectedId}
                  />
                  {!publication.edges.length && (
                    <p className="notice">No hay relaciones registradas entre estas etapas.</p>
                  )}
                </div>
              )}
              {details(selected)}
            </div>
          )}
        </div>
      )}
      <p className="notice">
        Las actuaciones previstas pueden cambiar. No representan un porcentaje de avance ni
        garantizan resultados jurídicos. Los términos y vencimientos deben ser verificados por el
        profesional responsable.
      </p>
    </section>
  );
}
function ProcessDiagram({
  publication,
  selected,
  onSelect,
}: {
  publication: Publication;
  selected: string;
  onSelect: (id: string) => void;
}) {
  const marker = useId().replaceAll(':', '');
  const positions = new Map(
    publication.stages.map((s, i) => [
      s.id,
      { x: i % 2 ? 370 : 30, y: 30 + Math.floor(i / 2) * 230 },
    ]),
  );
  const height = Math.max(220, Math.ceil(publication.stages.length / 2) * 230);
  return (
    <>
      <p className="diagram-hint">
        Puede desplazar el diagrama para explorar todas sus etapas y leer las conexiones debajo.
      </p>
      <div
        className="diagram-viewport"
        tabIndex={0}
        aria-label="Diagrama desplazable de etapas y conexiones"
      >
        <svg
          className="process-diagram"
          width="700"
          height={height}
          viewBox={`0 0 700 ${height}`}
          aria-label="Diagrama de flujo del expediente"
        >
          <defs>
            <marker
              id={marker}
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--gold)" />
            </marker>
          </defs>
          {publication.edges.map((e, i) => {
            const a = positions.get(e.from);
            const b = positions.get(e.to);
            if (!a || !b) return null;
            const sameRow = a.y === b.y;
            const startX = sameRow ? a.x + (b.x > a.x ? 260 : 0) : a.x + 130;
            const startY = sameRow ? a.y + 45 : a.y + 90;
            const endX = sameRow ? b.x + (b.x > a.x ? 0 : 260) : b.x + 130;
            const endY = sameRow ? b.y + 45 : b.y;
            const loop = b.y <= a.y && !sameRow;
            const rail = 680 - (i % 3) * 12;
            const self = e.from === e.to;
            const path = self
              ? `M${a.x + 260},${a.y + 60} C${a.x + 310},${a.y + 60} ${a.x + 310},${a.y - 15} ${a.x + 130},${a.y - 15} L${a.x + 130},${a.y}`
              : sameRow
                ? `M${startX},${startY} L${endX},${endY}`
                : loop
                  ? `M${a.x + 260},${a.y + 45} H${rail} V${b.y + 45} H${b.x + 260}`
                  : `M${startX},${startY} C${startX},${startY + 65} ${endX},${endY - 65} ${endX},${endY}`;
            return (
              <g key={e.id}>
                <title>
                  {publication.stages.find((s) => s.id === e.from)?.title} →{' '}
                  {publication.stages.find((s) => s.id === e.to)?.title}: {e.label}
                </title>
                <path
                  d={path}
                  fill="none"
                  stroke="var(--gold)"
                  strokeWidth="2"
                  strokeDasharray={loop ? '5 4' : undefined}
                  markerEnd={`url(#${marker})`}
                />
                {!self && !loop && (
                  <foreignObject
                    x={(startX + endX) / 2 - 105}
                    y={sameRow ? startY + 58 : (startY + endY) / 2 - 15}
                    width="210"
                    height="48"
                  >
                    <div className="diagram-edge-label">{e.label || 'Relación registrada'}</div>
                  </foreignObject>
                )}
              </g>
            );
          })}
          {publication.stages.map((s) => {
            const pos = positions.get(s.id)!;
            return (
              <foreignObject key={s.id} x={pos.x} y={pos.y} width="260" height="90">
                <button
                  className={`flow-node diagram-node ${selected === s.id ? 'selected' : ''}`}
                  aria-pressed={selected === s.id}
                  onClick={() => onSelect(s.id)}
                >
                  <strong>{s.title}</strong>
                  <Badge>{s.status}</Badge>
                </button>
              </foreignObject>
            );
          })}
        </svg>
        <details className="diagram-relations">
          <summary>Leer todas las conexiones ({publication.edges.length})</summary>
          {publication.edges.map((e) => (
            <p key={e.id}>
              {publication.stages.find((s) => s.id === e.from)?.title} →{' '}
              {publication.stages.find((s) => s.id === e.to)?.title}:{' '}
              {e.label || 'Relación registrada'}
            </p>
          ))}
        </details>
      </div>
    </>
  );
}
