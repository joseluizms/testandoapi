import { RouteObject } from 'react-router-dom'
import Home from './pages/Home'
import LiveAuction from './pages/LiveAuction'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <Home />
  },
  {
    path: '/auction',
    element: <LiveAuction />
  }
]

export default routes