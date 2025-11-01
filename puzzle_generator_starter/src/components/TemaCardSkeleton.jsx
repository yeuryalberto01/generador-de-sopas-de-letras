export default function TemaCardSkeleton() {
  return (
    <div
      style={{
        position: 'relative',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 16,
        background: 'white',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}
    >
      {/* Botón favorito skeleton */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          width: 20,
          height: 20,
          borderRadius: '50%',
          backgroundColor: '#f3f4f6'
        }}
      />
      
      {/* Botones de acción skeleton */}
      <div
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          gap: 8
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: '#f3f4f6'
          }}
        />
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            backgroundColor: '#f3f4f6'
          }}
        />
      </div>

      {/* Contenido skeleton */}
      <div style={{ marginLeft: 30 }}>
        {/* Título skeleton */}
        <div
          style={{
            height: 20,
            backgroundColor: '#f3f4f6',
            borderRadius: 4,
            marginBottom: 8,
            width: '70%'
          }}
        />
        
        {/* Descripción skeleton */}
        <div
          style={{
            height: 14,
            backgroundColor: '#f3f4f6',
            borderRadius: 4,
            marginBottom: 8,
            width: '90%'
          }}
        />
        
        {/* Fecha skeleton */}
        <div
          style={{
            height: 12,
            backgroundColor: '#f3f4f6',
            borderRadius: 4,
            width: '60%'
          }}
        />
      </div>
    </div>
  )
}