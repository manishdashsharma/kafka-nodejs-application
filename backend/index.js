import express from 'express';
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import { Server } from 'socket.io';
import config from "./src/config/index.js";
import { startMessageConsumer } from "./src/utils/kafka.js"
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
// startMessageConsumer();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {

    socket.on('message', async (data) => {
        let dataToSave = {
            id: socket.id,
            message: data,
            timestamp: Date().toString()
        }
        socket.broadcast.emit('received-message', data);
        await produceMessage(dataToSave);
        console.log("Message Produced to Kafka Broker");
    });
    socket.on('disconnect', () => {
        console.log(`User disconnected ${socket.id}`);
    });
});

server.on('error', (error) => {
    console.error(`Server error: ${error}`);
    process.exit(1);
});

const onListening = () => {
    console.log(`Listening on port ${config.PORT}`);
};

server.listen(config.PORT, onListening);