// Servicios para consumir datos de n8n
// Las URLs se configurarán mediante variables de entorno

export async function getIdeasFromN8n(): Promise<any[]> {
  const url = process.env.N8N_IDEAS_URL
  if (!url) {
    console.warn('N8N_IDEAS_URL no configurada')
    return []
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener ideas: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error al obtener ideas de n8n:', error)
    return []
  }
}

export async function getVideosFromN8n(): Promise<any[]> {
  const url = process.env.N8N_VIDEOS_URL
  if (!url) {
    console.warn('N8N_VIDEOS_URL no configurada')
    return []
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Error al obtener videos: ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error al obtener videos de n8n:', error)
    return []
  }
}
