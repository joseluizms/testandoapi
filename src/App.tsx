import { useRoutes } from 'react-router-dom'

import routes from './routes'
import { SocketContextProvider } from './context/SocketContext'

const App = () => {
  const elements = useRoutes(routes)

  return <SocketContextProvider>{elements}</SocketContextProvider>
}

export default App