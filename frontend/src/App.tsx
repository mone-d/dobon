import { useEffect, useState } from 'react';
import { useGameStore } from './stores/gameStore';
import { useUserStore } from './stores/userStore';
import { useRoomStore } from './stores/roomStore';
import GameScreen from './screens/GameScreen';
import GameResultScreen from './screens/GameResultScreen';
import HomeScreen from './screens/HomeScreen';
import LobbyScreen from './screens/LobbyScreen';
import RoomScreen from './screens/RoomScreen';
import { ErrorNotification } from './components/ErrorNotification';

type Screen = 'home' | 'lobby' | 'room' | 'game' | 'result';

export default function App() {
  const { currentUser } = useUserStore();
  const { initializeSocket, setCurrentUserId, gameEndData, gameState, socket } = useGameStore();
  const { currentRoom, initializeSocket: initRoomSocket, clearRoom } = useRoomStore();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  useEffect(() => {
    // Initialize WebSocket connections
    initializeSocket();
    initRoomSocket();
  }, [initializeSocket, initRoomSocket]);

  useEffect(() => {
    // Set current user ID when user is created
    if (currentUser) {
      setCurrentUserId(currentUser.userId);
      // Navigate to lobby after user creation
      if (currentScreen === 'home') {
        setCurrentScreen('lobby');
      }
    }
  }, [currentUser, setCurrentUserId]);

  useEffect(() => {
    // Navigate to room screen when room is joined
    if (currentRoom && currentScreen === 'lobby') {
      setCurrentScreen('room');
    }
  }, [currentRoom]);

  // Navigate to result screen when game ends
  useEffect(() => {
    if (gameEndData && currentScreen === 'game') {
      setCurrentScreen('result' as Screen);
    }
  }, [gameEndData]);

  // Navigate to game screen when gameState is set (e.g., after rejoin)
  useEffect(() => {
    if (gameState && !gameEndData && currentScreen !== 'game') {
      setCurrentScreen('game');
    }
  }, [gameState]);

  // Listen for room:ended event to navigate back to lobby
  useEffect(() => {
    if (!socket) return;
    
    const handleRoomEnded = () => {
      clearRoom();
      useGameStore.setState({ gameEndData: null, gameState: null, currentRoomId: null });
      setCurrentScreen('lobby');
    };
    
    socket.on('room:ended', handleRoomEnded);
    return () => {
      socket.off('room:ended', handleRoomEnded);
    };
  }, [socket, clearRoom]);

  // Listen for game:started to navigate back to game screen (for next round)
  useEffect(() => {
    if (!socket) return;
    
    const handleGameStarted = () => {
      if (currentScreen === 'result' || currentScreen === 'room') {
        useGameStore.setState({ gameEndData: null });
        setCurrentScreen('game');
      }
    };
    
    socket.on('game:started', handleGameStarted);
    return () => {
      socket.off('game:started', handleGameStarted);
    };
  }, [socket, currentScreen]);

  const handleGameStart = () => {
    useGameStore.setState({ gameEndData: null });
    setCurrentScreen('game');
  };

  const handleLeaveRoom = () => {
    setCurrentScreen('lobby');
  };

  const handlePlayAgain = () => {
    useGameStore.setState({ gameEndData: null });
    // Stay on result screen - game:started event will navigate to game
  };

  const handleExitToLobby = () => {
    useGameStore.setState({ gameEndData: null, gameState: null });
    clearRoom();
    setCurrentScreen('lobby');
  };

  // Render current screen
  if (!currentUser) {
    return <HomeScreen />;
  }

  return (
    <>
      <ErrorNotification />
      {currentScreen === 'lobby' && <LobbyScreen />}
      {currentScreen === 'room' && currentRoom && (
        <RoomScreen
          onLeave={handleLeaveRoom}
          onGameStart={handleGameStart}
        />
      )}
      {currentScreen === 'room' && !currentRoom && <LobbyScreen />}
      {currentScreen === 'game' && <GameScreen />}
      {currentScreen === 'result' && gameEndData && (
        <GameResultScreen
          data={gameEndData}
          currentUserId={currentUser.userId}
          onPlayAgain={handlePlayAgain}
          onExit={handleExitToLobby}
        />
      )}
    </>
  );
}
