// Script para probar el endpoint del backend y verificar el formato de la grilla
async function testBackendGrid() {
  try {
    const response = await fetch('http://localhost:8000/api/diagramacion/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        palabras: ['HOLA', 'MUNDO', 'TEST']
      })
    });

    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', data);

    if (data.grid) {
      console.log('Grid type:', typeof data.grid);
      console.log('Grid length:', data.grid.length);
      console.log('First row type:', typeof data.grid[0]);
      console.log('First row length:', data.grid[0]?.length);
      console.log('First few cells:', data.grid[0]?.slice(0, 5));
      console.log('Sample cell types:', data.grid[0]?.slice(0, 5).map(cell => typeof cell));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testBackendGrid();