const { VITE_API_URL } = import.meta.env

const apiUrl = VITE_API_URL

if (!apiUrl) {
  throw new Error('VITE_API_URL must be defined')
}

const config = {
  apiUrl,
}

export default config
