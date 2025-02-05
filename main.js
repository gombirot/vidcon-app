import './style.css';
import { createClient } from '@supabase/supabase-js';
import { Device } from 'mediasoup-client';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// State management
const state = {
  roomId: null,
  username: null,
  participants: new Map(),
  localStream: null,
  screenStream: null,
  isAdmin: false,
  isMuted: false,
  isVideoOff: false,
  breakoutRooms: new Map(),
};

// DOM Elements
const loginContainer = document.getElementById('loginContainer');
const meetingContainer = document.getElementById('meetingContainer');
const joinForm = document.getElementById('joinForm');
const usernameInput = document.getElementById('username');
const roomIdInput = document.getElementById('roomId');
const videoGrid = document.getElementById('videoGrid');
const participantsList = document.getElementById('participantsList');
const participantCount = document.getElementById('participantCount');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessage');
const muteAudioBtn = document.getElementById('muteAudio');
const muteVideoBtn = document.getElementById('muteVideo');
const shareScreenBtn = document.getElementById('shareScreen');
const leaveRoomBtn = document.getElementById('leaveRoom');
const breakoutRoomsContainer = document.getElementById('breakoutRooms');
const createBreakoutRoomBtn = document.getElementById('createBreakoutRoom');

// WebRTC configuration
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

// Initialize Socket.io
const socket = io('https://your-signaling-server.com');

// Initialize MediaSoup device
const device = new Device();

// Event Listeners
joinForm.addEventListener('submit', handleJoinRoom);
sendMessageBtn.addEventListener('click', handleSendMessage);
muteAudioBtn.addEventListener('click', toggleAudio);
muteVideoBtn.addEventListener('click', toggleVideo);
shareScreenBtn.addEventListener('click', toggleScreenShare);
leaveRoomBtn.addEventListener('click', leaveRoom);
createBreakoutRoomBtn.addEventListener('click', createBreakoutRoom);

// Handle joining room
async function handleJoinRoom(e) {
  e.preventDefault();
  
  state.username = usernameInput.value;
  state.roomId = roomIdInput.value;
  
  try {
    // Initialize local media
    state.localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });
    
    // Join room in Supabase
    const { data, error } = await supabase
      .from('room_participants')
      .insert([
        { 
          room_id: state.roomId,
          username: state.username,
          joined_at: new Date()
        }
      ]);
      
    if (error) throw error;
    
    // Connect to signaling server
    socket.emit('join-room', {
      roomId: state.roomId,
      username: state.username
    });
    
    // Show meeting interface
    loginContainer.classList.add('hidden');
    meetingContainer.classList.remove('hidden');
    
    // Add local video
    addVideoStream(state.localStream, state.username, true);
    
    // Check if user is admin (first participant)
    const { data: participants } = await supabase
      .from('room_participants')
      .select('joined_at')
      .eq('room_id', state.roomId)
      .order('joined_at', { ascending: true });
      
    state.isAdmin = participants[0].joined_at === data[0].joined_at;
    if (state.isAdmin) {
      breakoutRoomsContainer.classList.remove('hidden');
    }
    
  } catch (error) {
    console.error('Error joining room:', error);
    alert('Failed to join room. Please try again.');
  }
}

// Handle sending chat messages
async function handleSendMessage() {
  const message = chatInput.value.trim();
  if (!message) return;
  
  try {
    await supabase
      .from('chat_messages')
      .insert([
        {
          room_id: state.roomId,
          sender: state.username,
          message: message,
          timestamp: new Date()
        }
      ]);
      
    chatInput.value = '';
    
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
  }
}

// Toggle audio
function toggleAudio() {
  if (state.localStream) {
    state.isMuted = !state.isMuted;
    state.localStream.getAudioTracks().forEach(track => {
      track.enabled = !state.isMuted;
    });
    muteAudioBtn.textContent = state.isMuted ? 'Unmute Audio' : 'Mute Audio';
  }
}

// Toggle video
function toggleVideo() {
  if (state.localStream) {
    state.isVideoOff = !state.isVideoOff;
    state.localStream.getVideoTracks().forEach(track => {
      track.enabled = !state.isVideoOff;
    });
    muteVideoBtn.textContent = state.isVideoOff ? 'Start Video' : 'Stop Video';
  }
}

// Toggle screen sharing
async function toggleScreenShare() {
  try {
    if (!state.screenStream) {
      state.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });
      addVideoStream(state.screenStream, `${state.username}'s Screen`, true);
      shareScreenBtn.textContent = 'Stop Sharing';
      
      state.screenStream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } else {
      stopScreenShare();
    }
  } catch (error) {
    console.error('Error sharing screen:', error);
    alert('Failed to share screen. Please try again.');
  }
}

// Stop screen sharing
function stopScreenShare() {
  if (state.screenStream) {
    state.screenStream.getTracks().forEach(track => track.stop());
    state.screenStream = null;
    shareScreenBtn.textContent = 'Share Screen';
  }
}

// Create breakout room
async function createBreakoutRoom() {
  if (!state.isAdmin) return;
  
  const roomName = prompt('Enter breakout room name:');
  if (!roomName) return;
  
  try {
    const roomId = uuidv4();
    await supabase
      .from('breakout_rooms')
      .insert([
        {
          id: roomId,
          main_room_id: state.roomId,
          name: roomName,
          created_by: state.username
        }
      ]);
      
    addBreakoutRoom(roomId, roomName);
    
  } catch (error) {
    console.error('Error creating breakout room:', error);
    alert('Failed to create breakout room. Please try again.');
  }
}

// Add video stream to grid
function addVideoStream(stream, username, isLocal = false) {
  const videoContainer = document.createElement('div');
  videoContainer.className = 'video-container';
  
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;
  if (isLocal) video.muted = true;
  
  const nameLabel = document.createElement('div');
  nameLabel.className = 'participant-name';
  nameLabel.textContent = username;
  
  videoContainer.appendChild(video);
  videoContainer.appendChild(nameLabel);
  videoGrid.appendChild(videoContainer);
}

// Add breakout room to list
function addBreakoutRoom(roomId, name) {
  const roomCard = document.createElement('div');
  roomCard.className = 'room-card';
  
  const roomName = document.createElement('h4');
  roomName.textContent = name;
  
  const joinButton = document.createElement('button');
  joinButton.textContent = 'Join Room';
  joinButton.onclick = () => joinBreakoutRoom(roomId);
  
  roomCard.appendChild(roomName);
  roomCard.appendChild(joinButton);
  document.getElementById('roomList').appendChild(roomCard);
}

// Join breakout room
async function joinBreakoutRoom(roomId) {
  try {
    // Leave current room
    await leaveRoom();
    
    // Join new room
    state.roomId = roomId;
    handleJoinRoom(new Event('submit'));
    
  } catch (error) {
    console.error('Error joining breakout room:', error);
    alert('Failed to join breakout room. Please try again.');
  }
}

// Leave room
async function leaveRoom() {
  try {
    // Stop all media tracks
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => track.stop());
    }
    if (state.screenStream) {
      state.screenStream.getTracks().forEach(track => track.stop());
    }
    
    // Remove from Supabase
    await supabase
      .from('room_participants')
      .delete()
      .match({ 
        room_id: state.roomId,
        username: state.username
      });
    
    // Disconnect from signaling server
    socket.emit('leave-room', {
      roomId: state.roomId,
      username: state.username
    });
    
    // Reset state
    state.roomId = null;
    state.username = null;
    state.localStream = null;
    state.screenStream = null;
    state.isAdmin = false;
    
    // Show login interface
    meetingContainer.classList.add('hidden');
    loginContainer.classList.remove('hidden');
    
    // Clear video grid
    videoGrid.innerHTML = '';
    
  } catch (error) {
    console.error('Error leaving room:', error);
    alert('Failed to leave room. Please try again.');
  }
}

// Initialize real-time subscriptions
function initializeSubscriptions() {
  // Listen for new participants
  supabase
    .channel('room_participants')
    .on('INSERT', payload => {
      const participant = payload.new;
      if (participant.room_id === state.roomId) {
        updateParticipantsList();
      }
    })
    .on('DELETE', payload => {
      const participant = payload.old;
      if (participant.room_id === state.roomId) {
        updateParticipantsList();
      }
    })
    .subscribe();
    
  // Listen for new chat messages
  supabase
    .channel('chat_messages')
    .on('INSERT', payload => {
      const message = payload.new;
      if (message.room_id === state.roomId) {
        addChatMessage(message);
      }
    })
    .subscribe();
}

// Update participants list
async function updateParticipantsList() {
  try {
    const { data: participants } = await supabase
      .from('room_participants')
      .select('username')
      .eq('room_id', state.roomId);
      
    participantsList.innerHTML = '';
    participants.forEach(participant => {
      const div = document.createElement('div');
      div.textContent = participant.username;
      participantsList.appendChild(div);
    });
    
    participantCount.textContent = participants.length;
    
  } catch (error) {
    console.error('Error updating participants list:', error);
  }
}

// Add chat message to display
function addChatMessage(message) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'chat-message';
  
  const sender = document.createElement('div');
  sender.className = 'sender';
  sender.textContent = message.sender;
  
  const content = document.createElement('div');
  content.textContent = message.message;
  
  messageDiv.appendChild(sender);
  messageDiv.appendChild(content);
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize subscriptions when the app starts
initializeSubscriptions();