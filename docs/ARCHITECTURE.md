# FitAI — System Architecture

```
                                    +-----------------------------------+
                                    |        React 18 + Vite            |
                                    |     Frontend Client (5173)        |
                                    |  (3D Coach + 3D Exercise Demos)   |
                                    +-----------------+-----------------+
                                                      |
                                           HTTP API / Socket.IO
                                                      |
                                                      v
                                    +-----------------------------------+
                                    |       Node.js Express MERN        |
                                    |        Backend Server (3000)      |
                                    |     (JWT, Mongoose, Socket.IO)    |
                                    +---------+-----------------+-------+
                                              |                 |
                                 REST Client  |                 | Mongoose
                                              v                 v
                 +-----------------------------------+    +----------------------+
                 |      FastAPI Python Service       |    |    MongoDB Atlas     |
                 |      ML Inference Engine (8001)   |    |    Cloud Database    |
                 | (Recovery, Injury, Recommender)   |    +----------------------+
                 +-----------------------------------+
```
