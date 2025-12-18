// Custom server for Railway deployment
// This ensures Next.js listens on the PORT environment variable and handles errors gracefully
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// Get port from environment variable (Railway sets this automatically)
const port = parseInt(process.env.PORT || '3000', 10)
const hostname = '0.0.0.0' // Listen on all interfaces
const dev = process.env.NODE_ENV !== 'production'

console.log('='.repeat(50))
console.log('Starting Next.js server...')
console.log(`PORT: ${port}`)
console.log(`NODE_ENV: ${process.env.NODE_ENV}`)
console.log(`Hostname: ${hostname}`)
console.log('='.repeat(50))

// Create Next.js app
const app = next({ 
  dev,
  hostname,
  port,
})

const handle = app.getRequestHandler()

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Start the server
app.prepare()
  .then(() => {
    console.log('Next.js app prepared successfully')
    
    const server = createServer(async (req, res) => {
      try {
        // Health check endpoint
        if (req.url === '/health' || req.url === '/api/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ 
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
          }))
          return
        }

        const parsedUrl = parse(req.url, true)
        await handle(req, res, parsedUrl)
      } catch (err) {
        console.error('Error occurred handling request:', req.url, err)
        res.statusCode = 500
        res.end('internal server error')
      }
    })

    server.listen(port, hostname, (err) => {
      if (err) {
        console.error('Failed to start server:', err)
        process.exit(1)
      }
      console.log(`✅ Server is ready on http://${hostname}:${port}`)
      console.log(`✅ Listening for requests...`)
    })

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err)
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`)
      }
      process.exit(1)
    })
  })
  .catch((err) => {
    console.error('❌ Failed to prepare Next.js app:', err)
    console.error('Error stack:', err.stack)
    process.exit(1)
  })

