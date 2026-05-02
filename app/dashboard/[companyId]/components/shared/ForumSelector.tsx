'use client';

export interface Forum {
  id: string;
  company_id: string;
  name: string;
  experience_id: string;
  created_at: string;
  who_can_post?: string;
  is_synced_only?: boolean;
}

interface ForumSelectorProps {
  forums: Forum[];
  value: string;
  onChange: (experienceId: string) => void;
  placeholder?: string;
}

export default function ForumSelector({ forums, value, onChange, placeholder = 'Select forum' }: ForumSelectorProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%',
        background: '#161616',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
        padding: '9px 12px',
        color: value ? '#F0F0F0' : '#555',
        fontSize: 14,
        outline: 'none',
        cursor: 'pointer',
      }}
    >
      <option value="">{placeholder}</option>
      {forums.map((f) => (
        <option key={f.id} value={f.experience_id}>
          {f.name}{f.who_can_post === 'admins' ? ' (admins only)' : ''}
        </option>
      ))}
    </select>
  );
}
