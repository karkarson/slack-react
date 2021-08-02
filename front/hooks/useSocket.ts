import io from 'socket.io-client';
import { useCallback } from 'react';

const backUrl = 'http://localhost:3095';

const sockets: { [key: string]: SocketIOClient.Socket } = {};
const useSocket = (workspace?: string): [SocketIOClient.Socket | undefined, () => void] => {
  console.log('rerender', workspace);

  const disconnect = useCallback(() => {
    if (workspace) {
      const disconnect = sockets[workspace].disconnect();
      delete sockets[workspace];
    }
  }, [workspace]);

  if (!workspace) {
    return [undefined, disconnect];
  }

  if (!sockets[workspace]) {
    // 계속 리렌더링 되는 문제 -> 기존에 내가 저장을 해놓은게 없었다면
    sockets[workspace] = io.connect(`${backUrl}/ws-${workspace}`, { transports: ['websocket'] });
  }

  return [sockets[workspace], disconnect]; //기존에 있었던거 리턴
};

export default useSocket;
