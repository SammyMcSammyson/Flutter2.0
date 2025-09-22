import { io } from 'socket.io-client';

const socket = io('https://flutter2-0.onrender.com/'); // point to your backend

export default socket;
