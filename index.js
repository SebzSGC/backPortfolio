import express from 'express'
import logger from 'morgan'
import cors from 'cors'

import { Server } from 'socket.io'
import { createServer } from 'node:http'

const port = process.env.PORT ?? 4000

const app = express()
const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*'
  }
})

let userPins = {}
let globalPins = []

app.use(logger('dev'))
app.use(cors())

io.on('connection', (socket) => {
  console.log('New client connected', socket.id)
  socket.emit('currentPins', globalPins)

  socket.on('newUser', (location) => {
    if (!userPins[socket.id]) {
      userPins[socket.id] = []
    }
    userPins[socket.id].push(location)
    globalPins.push(location)
    socket.emit('currentPins', globalPins)
    io.emit('userConnected', location)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    removeUserPins(socket.id)
  })
})

function removeUserPins(userId) {
  if (userPins[userId]) {
    userPins[userId].forEach((pin) => {
      const index = globalPins.indexOf(pin)
      if (index > -1) {
        globalPins.splice(index, 1)
      }
    })
    delete userPins[userId]

    io.emit('currentPins', globalPins)
  }
}

server.listen(port, () => console.log(`Listening on port ${port}`))
