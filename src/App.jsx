import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import bonjourAudio from './assets/bonjour_tout_le_monde.mp3'

function App() {
  const [count, setCount] = useState(0)
  const [text, setText] = useState('')
  const [checkResult, setCheckResult] = useState(null)
  const [pianoDownloaded, setPianoDownloaded] = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)

  const phraseCorrecte = "Bonjour tout le monde."
  const pianoUrl = 'https://nicolasfavier.github.io/mp3-provider/piano.wav'
  const pianoCacheKey = 'piano-audio'

  useEffect(() => {
    const checkPianoCache = async () => {
      try {
        const cache = await caches.open('audio-cache')
        const cachedResponse = await cache.match(pianoCacheKey)
        if (cachedResponse) {
          setPianoDownloaded(true)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du cache:', error)
      }
    }
    checkPianoCache()

    // Gérer l'installation de la PWA
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const installPWA = async () => {
    if (!installPrompt) return

    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('PWA installée')
    }
    setInstallPrompt(null)
  }

  const playAudio = () => {
    const audio = new Audio(bonjourAudio)
    audio.play()
  }

  const downloadPiano = async () => {
    try {
      console.log('Téléchargement du fichier piano...')
      const response = await fetch(pianoUrl)
      const blob = await response.blob()

      const cache = await caches.open('audio-cache')
      const cacheResponse = new Response(blob)
      await cache.put(pianoCacheKey, cacheResponse)

      setPianoDownloaded(true)
      console.log('Fichier piano téléchargé et mis en cache !')
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
      alert('Erreur lors du téléchargement du fichier piano')
    }
  }

  const playPianoLocal = async () => {
    try {
      const cache = await caches.open('audio-cache')
      const cachedResponse = await cache.match(pianoCacheKey)

      if (cachedResponse) {
        const blob = await cachedResponse.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.play()
        console.log('Lecture du fichier piano depuis le cache')
      } else {
        alert('Le fichier piano n\'est pas encore téléchargé. Cliquez d\'abord sur "Télécharger Piano"')
      }
    } catch (error) {
      console.error('Erreur lors de la lecture:', error)
      alert('Erreur lors de la lecture du fichier piano')
    }
  }

  const verifierDictee = async () => {
    try {
      const response = await fetch(`https://api.languagetool.org/v2/check?text=${encodeURIComponent(text)}&language=fr-FR`)
      const data = await response.json()
      setCheckResult(data)
      console.log('Résultats de la vérification:', data)
    } catch (error) {
      console.error('Erreur lors de la vérification:', error)
    }
  }

  const categoriserFautes = () => {
    if (!checkResult || !checkResult.matches) return {}

    const categories = {}
    checkResult.matches.forEach(match => {
      const type = match.rule.issueType || 'Autre'
      if (!categories[type]) {
        categories[type] = []
      }
      categories[type].push(match)
    })
    return categories
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <button onClick={playAudio}>
          Play Audio
        </button>
        <button onClick={downloadPiano}>
          Télécharger Piano {pianoDownloaded && '✓'}
        </button>
        <button onClick={playPianoLocal}>
          Play Piano Local
        </button>
        {installPrompt && (
          <button onClick={installPWA} style={{
            backgroundColor: '#4CAF50',
            color: 'white'
          }}>
            Installer l'application
          </button>
        )}
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <div className="card">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Saisissez votre texte ici..."
          rows="5"
          style={{ width: '100%', padding: '10px' }}
        />
        <button onClick={verifierDictee}>
          Vérifier ma dictée
        </button>
        {checkResult && (
          <div style={{ marginTop: '20px', textAlign: 'left' }}>
            <div style={{
              backgroundColor: '#f0f0f0',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              <h3>Résultat de la dictée</h3>
              <p><strong>Phrase correcte attendue:</strong> {phraseCorrecte}</p>
              <p><strong>Votre saisie:</strong> {text}</p>
              <p style={{ color: checkResult.matches?.length > 0 ? 'red' : 'green', fontSize: '1.2em' }}>
                <strong>Nombre de fautes: {checkResult.matches?.length || 0}</strong>
              </p>
            </div>

            {checkResult.matches && checkResult.matches.length > 0 && (
              <div>
                <h3>Détail des fautes par type:</h3>
                {Object.entries(categoriserFautes()).map(([type, fautes]) => (
                  <div key={type} style={{
                    marginBottom: '20px',
                    border: '2px solid #ff6b6b',
                    padding: '15px',
                    borderRadius: '5px',
                    backgroundColor: '#ffe0e0'
                  }}>
                    <h4>{type} ({fautes.length} faute{fautes.length > 1 ? 's' : ''})</h4>
                    {fautes.map((match, index) => (
                      <div key={index} style={{
                        border: '1px solid #ccc',
                        padding: '10px',
                        marginTop: '10px',
                        borderRadius: '5px',
                        backgroundColor: 'white'
                      }}>
                        <p><strong>Message:</strong> {match.message}</p>
                        <p><strong>Contexte:</strong> "{match.context.text}"</p>
                        {match.replacements && match.replacements.length > 0 && (
                          <p><strong>Suggestions:</strong> {match.replacements.map(r => r.value).join(', ')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {checkResult.matches && checkResult.matches.length === 0 && (
              <div style={{
                backgroundColor: '#d4edda',
                padding: '15px',
                borderRadius: '5px',
                color: '#155724',
                border: '1px solid #c3e6cb'
              }}>
                <strong>Parfait ! Aucune faute détectée.</strong>
              </div>
            )}
          </div>
        )}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
