import { ThemeProvider } from '@emotion/react'

import ChevronLeft from '@mui/icons-material/ChevronLeft'
import Dashboard from '@mui/icons-material/Dashboard'
import Menu from '@mui/icons-material/Menu'
import SettingsIcon from '@mui/icons-material/Settings'
import SettingsEthernet from '@mui/icons-material/SettingsEthernet'
import Storage from '@mui/icons-material/Storage'

import { Box, createTheme } from '@mui/material'

import CircularProgress from '@mui/material/CircularProgress'
import CssBaseline from '@mui/material/CssBaseline'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import DownloadIcon from '@mui/icons-material/Download';

import { grey } from '@mui/material/colors'

import { Suspense, lazy, useMemo, useState } from 'react'
import { Provider, useDispatch, useSelector } from 'react-redux'

import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { RootState, store } from './stores/store'

import AppBar from './components/AppBar'
import Drawer from './components/Drawer'

import Archive from './Archive'
import { formatGiB } from './utils'

function AppContent() {
  const [open, setOpen] = useState(false)

  const settings = useSelector((state: RootState) => state.settings)
  const status = useSelector((state: RootState) => state.status)

  const mode = settings.theme
  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: settings.theme,
        background: {
          default: settings.theme === 'light' ? grey[50] : '#121212'
        },
      },
    }), [settings.theme]
  )

  const toggleDrawer = () => {
    setOpen(!open)
  }

  const Home = lazy(() => import('./Home'))
  const Settings = lazy(() => import('./Settings'))

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          <AppBar position="absolute" open={open}>
            <Toolbar sx={{ pr: '24px' }}>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="open drawer"
                onClick={toggleDrawer}
                sx={{
                  marginRight: '36px',
                  ...(open && { display: 'none' }),
                }}
              >
                <Menu />
              </IconButton>
              <Typography
                component="h1"
                variant="h6"
                color="inherit"
                noWrap
                sx={{ flexGrow: 1 }}
              >
                yt-dlp WebUI
              </Typography>
              {
                status.freeSpace ?
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}>
                    <Storage />
                    <span>&nbsp;{formatGiB(status.freeSpace)}&nbsp;</span>
                  </div>
                  : null
              }
              <div style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}>
                <SettingsEthernet />
                <span>&nbsp;{status.connected ? settings.serverAddr : 'not connected'}</span>
              </div>
            </Toolbar>
          </AppBar>
          <Drawer variant="permanent" open={open}>
            <Toolbar
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                px: [1],
              }}
            >
              <IconButton onClick={toggleDrawer}>
                <ChevronLeft />
              </IconButton>
            </Toolbar>
            <Divider />
            <List component="nav">
              <Link to={'/'} style={
                {
                  textDecoration: 'none',
                  color: mode === 'dark' ? '#ffffff' : '#000000DE'
                }
              }>
                <ListItemButton disabled={status.downloading}>
                  <ListItemIcon>
                    <Dashboard />
                  </ListItemIcon>
                  <ListItemText primary="Home" />
                </ListItemButton>
              </Link>
              <Link to={'/archive'} style={
                {
                  textDecoration: 'none',
                  color: mode === 'dark' ? '#ffffff' : '#000000DE'
                }
              }>
                <ListItemButton disabled={status.downloading}>
                  <ListItemIcon>
                    <DownloadIcon />
                  </ListItemIcon>
                  <ListItemText primary="Archive" />
                </ListItemButton>
              </Link>
              <Link to={'/settings'} style={
                {
                  textDecoration: 'none',
                  color: mode === 'dark' ? '#ffffff' : '#000000DE'
                }
              }>
                <ListItemButton disabled={status.downloading}>
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </Link>
            </List>
          </Drawer>
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              height: '100vh',
              overflow: 'auto',
            }}
          >
            <Toolbar />
            <Routes>
              <Route path="/" element={
                <Suspense fallback={<CircularProgress />}>
                  <Home />
                </Suspense>
              } />
              <Route path="/settings" element={
                <Suspense fallback={<CircularProgress />}>
                  <Settings />
                </Suspense>
              } />
              <Route path="/archive" element={
                <Suspense fallback={<CircularProgress />}>
                  <Archive />
                </Suspense>
              } />
            </Routes>
          </Box>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}