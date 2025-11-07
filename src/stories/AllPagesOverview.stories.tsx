import React from 'react';
const stories = import.meta.glob('./pages/*.stories.tsx', { eager: true });

export default { title: 'Storyboard/All Pages Overview' };

export const AllPages = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))',
      gap: '1rem',
      padding: '1rem',
      background: '#f5f6f8',
    }}
  >
    {Object.entries(stories).map(([path, mod]) => {
      const name = path.split('/').pop()?.replace('.stories.tsx', '');
      const Component =
        (mod as any).default?.component ||
        (mod as any).Default ||
        (mod as any).default;
      if (!Component) return null;
      return (
        <div
          key={name}
          style={{
            background: '#fff',
            border: '1px solid #ccc',
            borderRadius: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <h3
            style={{
              textAlign: 'center',
              background: '#f0f0f0',
              margin: 0,
              padding: '0.5rem',
            }}
          >
            {name}
          </h3>
          <div style={{ height: '600px', overflow: 'auto' }}>
            <Component />
          </div>
        </div>
      );
    })}
  </div>
);
