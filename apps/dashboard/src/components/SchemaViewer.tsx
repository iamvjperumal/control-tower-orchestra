interface SchemaField {
  name: string;
  type: string | object;
  doc?: string;
}

const PII_LEVEL_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  direct: { bg: 'rgba(239, 68, 68, 0.12)', text: '#ef4444', label: 'DIRECT PII' },
  quasi: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24', label: 'QUASI PII' },
  sensitive: { bg: 'rgba(251, 146, 60, 0.12)', text: '#fb923c', label: 'SENSITIVE' },
  pii: { bg: 'rgba(251, 191, 36, 0.12)', text: '#fbbf24', label: 'PII' },
};

function detectPIILevel(doc?: string): string | null {
  if (!doc) return null;
  const lower = doc.toLowerCase();
  if (lower.includes('direct')) return 'direct';
  if (lower.includes('quasi')) return 'quasi';
  if (lower.includes('sensitive')) return 'sensitive';
  if (lower.includes('pii')) return 'pii';
  return null;
}

function detectHandling(doc?: string): string | null {
  if (!doc) return null;
  const lower = doc.toLowerCase();
  if (lower.includes('hash')) return 'HASH';
  if (lower.includes('redact')) return 'REDACT';
  if (lower.includes('mask')) return 'MASK';
  if (lower.includes('encrypt')) return 'ENCRYPT';
  return null;
}

export function SchemaViewer({ schema }: { schema: { name: string; namespace?: string; fields: SchemaField[] } }) {
  const domain = schema.namespace?.split('.')[1] || schema.name.split('.')[0];
  const piiCount = schema.fields.filter((f) => detectPIILevel(f.doc)).length;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-white">{schema.name}</h3>
          {schema.namespace && (
            <p className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--text-muted)' }}>{schema.namespace}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {piiCount > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
              style={{ background: 'rgba(251, 191, 36, 0.12)', color: '#fbbf24' }}>
              {piiCount} PII field{piiCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
            style={{ background: 'rgba(34, 211, 238, 0.12)', color: '#22d3ee' }}>
            {schema.fields.length} fields
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-card)' }}>
              <th className="text-left py-2 pr-4 font-semibold">Field</th>
              <th className="text-left py-2 pr-4 font-semibold">Type</th>
              <th className="text-left py-2 pr-4 font-semibold">Classification</th>
              <th className="text-left py-2 font-semibold">Handling</th>
            </tr>
          </thead>
          <tbody>
            {schema.fields.map((field) => {
              const piiLevel = detectPIILevel(field.doc);
              const handling = detectHandling(field.doc);
              const piiStyle = piiLevel ? PII_LEVEL_COLORS[piiLevel] : null;

              return (
                <tr key={field.name} style={{ borderBottom: '1px solid rgba(30, 30, 54, 0.5)' }}>
                  <td className="py-2 pr-4 font-mono" style={{ color: 'var(--text-primary)' }}>{field.name}</td>
                  <td className="py-2 pr-4" style={{ color: 'var(--text-secondary)' }}>
                    {typeof field.type === 'string' ? field.type : JSON.stringify(field.type)}
                  </td>
                  <td className="py-2 pr-4">
                    {piiStyle && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: piiStyle.bg, color: piiStyle.text }}>
                        {piiStyle.label}
                      </span>
                    )}
                  </td>
                  <td className="py-2">
                    {handling && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa' }}>
                        {handling}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
